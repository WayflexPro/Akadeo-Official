import { Router } from 'express';
import Stripe from 'stripe';
import { getPool } from '../db.mjs';
import { optionalEnv, requireEnv } from '../env.mjs';
import { HttpError, asyncHandler, jsonOk, methodNotAllowed } from '../utils.mjs';
import { requireAuthenticatedUser } from '../lib/session.mjs';
import {
  calculatePlanPricing,
  normalisePlanRow,
  recordPaymentAttempt,
  subscriptionIsActive,
  toIsoOrNull,
} from '../lib/membership.mjs';

const membershipsRouter = Router();

const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-06-20',
});

const configuredBaseUrl = optionalEnv('APP_BASE_URL');

function resolveBaseUrl(req) {
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = forwardedHost || req.headers.host;

  if (!host) {
    throw new HttpError(500, 'INTERNAL', 'Could not determine application base URL.', {
      code: 'E_BASE_URL_UNAVAILABLE',
    });
  }

  const protocol =
    typeof forwardedProto === 'string' && forwardedProto.length > 0
      ? forwardedProto.split(',')[0]
      : req.secure
        ? 'https'
        : 'http';

  return `${protocol}://${host}`;
}

async function fetchPlan(connection, planId) {
  const [rows] = await connection.execute(
    'SELECT id, name, price_cents, discount_percent, discount_end_date, description FROM plans WHERE id = ? LIMIT 1',
    [planId]
  );
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new HttpError(404, 'NOT_FOUND', 'The selected plan could not be found.', {
      code: 'E_PLAN_NOT_FOUND',
    });
  }
  return rows[0];
}

async function fetchUser(connection, userId) {
  const [rows] = await connection.execute(
    'SELECT id, email, full_name FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new HttpError(404, 'NOT_FOUND', 'We could not find your account.', {
      code: 'E_USER_NOT_FOUND',
    });
  }
  return rows[0];
}

function ensurePlanPurchasable(plan) {
  const pricing = calculatePlanPricing(plan);
  if (pricing.priceCents <= 0) {
    throw new HttpError(422, 'VALIDATION', 'This plan cannot be purchased online. Please contact support.', {
      code: 'E_PLAN_REQUIRES_SALES',
    });
  }
  return pricing.currentPriceCents > 0 ? pricing.currentPriceCents : pricing.priceCents;
}

membershipsRouter.get(
  '/plans',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT id, name, price_cents, discount_percent, discount_end_date, description FROM plans ORDER BY price_cents ASC, id ASC'
      );
      const now = new Date();
      const plans = Array.isArray(rows) ? rows.map((row) => normalisePlanRow(row, now)) : [];
      jsonOk(res, { plans });
    } finally {
      connection.release();
    }
  })
);

membershipsRouter.post(
  '/plans/:planId/checkout',
  asyncHandler(async (req, res) => {
    const { userId } = requireAuthenticatedUser(req);
    const planId = Number.parseInt(req.params.planId, 10);
    if (!Number.isInteger(planId) || planId <= 0) {
      throw new HttpError(422, 'VALIDATION', 'Choose a valid plan to continue.', {
        code: 'E_INVALID_PLAN_ID',
      });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    let plan;
    let user;
    let activeSubscriptionId = null;

    try {
      plan = await fetchPlan(connection, planId);
      user = await fetchUser(connection, userId);

      const [existingSubscriptions] = await connection.execute(
        "SELECT id, status FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1",
        [userId]
      );

      if (Array.isArray(existingSubscriptions) && existingSubscriptions.length > 0) {
        const record = existingSubscriptions[0];
        activeSubscriptionId = record.id;
        if (subscriptionIsActive(record.status)) {
          throw new HttpError(409, 'CONFLICT', 'You already have an active subscription.', {
            code: 'E_SUBSCRIPTION_EXISTS',
          });
        }
      }

      const amountCents = ensurePlanPurchasable(plan);

      const baseUrl = resolveBaseUrl(req);

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        success_url: `${baseUrl}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/dashboard/payment-failed`,
        customer_email: String(user.email ?? ''),
        metadata: {
          userId: String(userId),
          planId: String(planId),
        },
        subscription_data: {
          metadata: {
            userId: String(userId),
            planId: String(planId),
          },
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: String(plan.name ?? 'Akadeo plan'),
                description: plan.description ? String(plan.description) : undefined,
              },
              unit_amount: amountCents,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
      });

      await recordPaymentAttempt(connection, {
        userId,
        planId,
        sessionId: session.id,
        status: 'pending',
        amountCents,
        createdAt: new Date().toISOString(),
      });

      jsonOk(res, {
        sessionId: session.id,
        url: session.url,
        existingSubscriptionId: activeSubscriptionId ? Number.parseInt(activeSubscriptionId, 10) : null,
      });
    } finally {
      connection.release();
    }
  })
);

membershipsRouter.get(
  '/subscriptions/current',
  asyncHandler(async (req, res) => {
    const { userId } = requireAuthenticatedUser(req);
    const connection = await getPool().getConnection();

    try {
      const [rows] = await connection.execute(
        'SELECT s.id, s.plan_id, s.status, s.start_date, s.end_date, s.stripe_subscription_id, p.name, p.price_cents, p.discount_percent, p.discount_end_date, p.description FROM subscriptions s LEFT JOIN plans p ON p.id = s.plan_id WHERE s.user_id = ? ORDER BY s.start_date DESC, s.id DESC LIMIT 1',
        [userId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        jsonOk(res, {
          subscription: {
            id: null,
            planId: null,
            planName: 'Free',
            status: 'none',
            isActive: false,
            startDate: null,
            endDate: null,
            stripeSubscriptionId: null,
            priceCents: null,
            currentPriceCents: null,
            discountPercent: null,
            discountEndsOn: null,
            description: '',
          },
        });
        return;
      }

      const record = rows[0];
      const now = new Date();
      const planInfo = record.plan_id
        ? normalisePlanRow(
            {
              id: record.plan_id,
              name: record.name,
              price_cents: record.price_cents,
              discount_percent: record.discount_percent,
              discount_end_date: record.discount_end_date,
              description: record.description,
            },
            now
          )
        : null;
      const status = record.status ? String(record.status) : 'unknown';
      const isActive = subscriptionIsActive(status) && (!record.end_date || new Date(record.end_date).getTime() >= now.getTime());

      jsonOk(res, {
        subscription: {
          id: Number.parseInt(record.id, 10),
          planId: record.plan_id ? Number.parseInt(record.plan_id, 10) : null,
          planName: planInfo ? planInfo.name : 'Free',
          status,
          isActive,
          startDate: toIsoOrNull(record.start_date),
          endDate: toIsoOrNull(record.end_date),
          stripeSubscriptionId: record.stripe_subscription_id ? String(record.stripe_subscription_id) : null,
          priceCents: planInfo ? planInfo.priceCents : null,
          currentPriceCents: planInfo ? planInfo.currentPriceCents : null,
          discountPercent: planInfo ? planInfo.discountPercent : null,
          discountEndsOn: planInfo ? planInfo.discountEndsOn : null,
          description: planInfo ? planInfo.description : '',
        },
      });
    } finally {
      connection.release();
    }
  })
);

membershipsRouter.post(
  '/subscriptions/cancel',
  asyncHandler(async (req, res) => {
    const { userId } = requireAuthenticatedUser(req);
    const connection = await getPool().getConnection();

    let subscription;

    try {
      const [rows] = await connection.execute(
        'SELECT id, plan_id, status, stripe_subscription_id FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        [userId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new HttpError(404, 'NOT_FOUND', 'No subscription found to cancel.', {
          code: 'E_SUBSCRIPTION_NOT_FOUND',
        });
      }

      subscription = rows[0];

      if (!subscriptionIsActive(subscription.status)) {
        throw new HttpError(409, 'CONFLICT', 'You do not have an active subscription to cancel.', {
          code: 'E_SUBSCRIPTION_NOT_ACTIVE',
        });
      }

      const stripeSubscriptionId = subscription.stripe_subscription_id ? String(subscription.stripe_subscription_id) : null;

      if (stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(stripeSubscriptionId);
        } catch (error) {
          throw new HttpError(502, 'INTERNAL', 'We could not cancel your subscription with Stripe.', {
            code: 'E_STRIPE_CANCEL_FAILED',
            details: error?.message ?? null,
          });
        }
      }

      await connection.execute('UPDATE subscriptions SET status = ?, end_date = ? WHERE id = ?', [
        'canceled',
        new Date().toISOString(),
        subscription.id,
      ]);

      jsonOk(res, { message: 'Subscription canceled.' });
    } finally {
      connection.release();
    }
  })
);

membershipsRouter.all('/plans', (req, res) => {
  methodNotAllowed(res, ['GET']);
});

membershipsRouter.all('/plans/:planId/checkout', (req, res) => {
  methodNotAllowed(res, ['POST']);
});

membershipsRouter.all('/subscriptions/current', (req, res) => {
  methodNotAllowed(res, ['GET']);
});

membershipsRouter.all('/subscriptions/cancel', (req, res) => {
  methodNotAllowed(res, ['POST']);
});

export default membershipsRouter;
