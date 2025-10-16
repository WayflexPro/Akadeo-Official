import express, { Router } from 'express';
import Stripe from 'stripe';
import { getPool } from '../db.mjs';
import { requireEnv } from '../env.mjs';
import { HttpError, asyncHandler } from '../utils.mjs';
import {
  calculatePlanPricing,
  recordPaymentAttempt,
  subscriptionIsActive,
  updatePaymentStatus,
} from '../lib/membership.mjs';
import { getDefaultPlanRows } from '../lib/defaultPlans.mjs';

const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-06-20',
});

const webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET');

const webhookRouter = Router();

async function retrieveStripeSubscription(session) {
  if (!session) {
    return null;
  }

  if (typeof session.subscription === 'string') {
    return stripe.subscriptions.retrieve(session.subscription);
  }

  if (session.subscription && typeof session.subscription === 'object' && 'id' in session.subscription) {
    return session.subscription;
  }

  return null;
}

async function fetchPlanById(connection, planId) {
  const [rows] = await connection.execute(
    'SELECT id, name, price_cents, discount_percent, discount_end_date, description FROM plans WHERE id = ? LIMIT 1',
    [planId]
  );
  if (!Array.isArray(rows) || rows.length === 0) {
    const fallback = getDefaultPlanRows().find((p) => p.id === planId);
    if (fallback) {
      return fallback;
    }
    throw new HttpError(404, 'NOT_FOUND', 'Plan referenced by payment was not found.', {
      code: 'E_WEBHOOK_PLAN_NOT_FOUND',
    });
  }
  return rows[0];
}

async function upsertSubscription(connection, userId, planId, stripeSubscriptionId, periodStartIso, periodEndIso) {
  const [existing] = await connection.execute(
    'SELECT id FROM subscriptions WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (Array.isArray(existing) && existing.length > 0) {
    await connection.execute(
      'UPDATE subscriptions SET plan_id = ?, status = ?, start_date = ?, end_date = ?, stripe_subscription_id = ? WHERE id = ?',
      [planId, 'active', periodStartIso, periodEndIso, stripeSubscriptionId, existing[0].id]
    );
    return existing[0].id;
  }

  const [result] = await connection.execute(
    'INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date, stripe_subscription_id) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, planId, 'active', periodStartIso, periodEndIso, stripeSubscriptionId]
  );

  return result.insertId ?? null;
}

async function handleCheckoutSessionCompleted(session) {
  const metadata = session.metadata ?? {};
  const userIdRaw = metadata.userId ?? session.client_reference_id ?? null;
  const planIdRaw = metadata.planId ?? null;

  const userId = userIdRaw ? Number.parseInt(userIdRaw, 10) : null;
  const planId = planIdRaw ? Number.parseInt(planIdRaw, 10) : null;

  if (!userId || !planId) {
    // eslint-disable-next-line no-console
    console.warn('Checkout session completed without user or plan metadata.', { sessionId: session.id });
    return;
  }

  const connection = await getPool().getConnection();
  let inTransaction = false;

  try {
    const plan = await fetchPlanById(connection, planId);
    const pricing = calculatePlanPricing(plan);

    const subscription = await retrieveStripeSubscription(session);
    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : subscription && 'id' in subscription
          ? subscription.id
          : null;

    const periodStart = subscription?.current_period_start
      ? new Date(subscription.current_period_start * 1000)
      : new Date();
    const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end * 1000) : null;

    const periodStartIso = periodStart.toISOString();
    const periodEndIso = periodEnd ? periodEnd.toISOString() : null;

    await connection.beginTransaction();
    inTransaction = true;

    await upsertSubscription(connection, userId, planId, stripeSubscriptionId, periodStartIso, periodEndIso);

    await updatePaymentStatus(connection, session.id, 'paid', pricing.currentPriceCents ?? pricing.priceCents);

    await connection.commit();
    inTransaction = false;
  } catch (error) {
    if (inTransaction) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        // eslint-disable-next-line no-console
        console.error('Failed to roll back subscription update', rollbackError);
      }
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function handleInvoicePaymentFailed(invoice) {
  const stripeSubscriptionId = invoice?.subscription ? String(invoice.subscription) : null;
  if (!stripeSubscriptionId) {
    // eslint-disable-next-line no-console
    console.warn('Invoice payment failed without a subscription reference.', { invoiceId: invoice?.id });
    return;
  }

  const connection = await getPool().getConnection();
  let inTransaction = false;

  try {
    const [rows] = await connection.execute(
      'SELECT id, user_id, plan_id, status FROM subscriptions WHERE stripe_subscription_id = ? LIMIT 1',
      [stripeSubscriptionId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('No local subscription found for failed invoice.', { invoiceId: invoice.id, stripeSubscriptionId });
      return;
    }

    const record = rows[0];

    await connection.beginTransaction();
    inTransaction = true;

    await connection.execute('UPDATE subscriptions SET status = ?, end_date = ? WHERE id = ?', [
      'canceled',
      new Date().toISOString(),
      record.id,
    ]);

    const amountDue = invoice?.amount_due ? Number.parseInt(invoice.amount_due, 10) || 0 : 0;

    await recordPaymentAttempt(connection, {
      userId: Number.parseInt(record.user_id, 10),
      planId: Number.parseInt(record.plan_id, 10),
      sessionId: invoice?.id ? String(invoice.id) : `${stripeSubscriptionId}-failed`,
      status: 'failed',
      amountCents: amountDue,
      createdAt: new Date().toISOString(),
    });

    await connection.commit();
    inTransaction = false;
  } catch (error) {
    if (inTransaction) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        // eslint-disable-next-line no-console
        console.error('Failed to roll back failed payment handling', rollbackError);
      }
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function handleSubscriptionCanceled(subscription) {
  const stripeSubscriptionId = subscription?.id ? String(subscription.id) : null;
  if (!stripeSubscriptionId) {
    return;
  }

  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, status FROM subscriptions WHERE stripe_subscription_id = ? LIMIT 1',
      [stripeSubscriptionId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return;
    }

    const record = rows[0];
    if (!subscriptionIsActive(record.status)) {
      return;
    }

    await connection.execute('UPDATE subscriptions SET status = ?, end_date = ? WHERE id = ?', [
      'canceled',
      new Date().toISOString(),
      record.id,
    ]);
  } finally {
    connection.release();
  }
}

webhookRouter.post(
  '/',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      throw new HttpError(400, 'VALIDATION', 'Missing Stripe signature header.', {
        code: 'E_STRIPE_SIGNATURE_MISSING',
      });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error) {
      throw new HttpError(400, 'VALIDATION', 'Invalid Stripe webhook signature.', {
        code: 'E_STRIPE_SIGNATURE_INVALID',
        details: error?.message ?? null,
      });
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;
      default:
        break;
    }

    res.json({ received: true });
  })
);

export default webhookRouter;
