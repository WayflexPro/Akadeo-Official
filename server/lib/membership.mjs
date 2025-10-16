import { HttpError } from '../utils.mjs';

function parseNumber(value, fallback = 0) {
  if (value === null || value === undefined) {
    return fallback;
  }
  const num = Number.parseInt(value, 10);
  return Number.isNaN(num) ? fallback : num;
}

export function parseDateText(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export function toIsoOrNull(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const parsed = parseDateText(value);
  return parsed ? parsed.toISOString() : null;
}

export function isDiscountActive(percent, endDateText, now = new Date()) {
  const discountPercent = parseNumber(percent, 0);
  if (discountPercent <= 0) {
    return false;
  }
  const endDate = parseDateText(endDateText);
  if (!endDate) {
    return false;
  }
  const inclusiveEnd = new Date(endDate.getTime());
  inclusiveEnd.setUTCHours(23, 59, 59, 999);
  return inclusiveEnd.getTime() >= now.getTime();
}

export function calculatePlanPricing(planRow, now = new Date()) {
  const priceCents = parseNumber(planRow?.price_cents, 0);
  const discountPercentRaw = planRow?.discount_percent;
  const discountPercent = parseNumber(discountPercentRaw, null);
  const discountEndsOn = planRow?.discount_end_date ? String(planRow.discount_end_date) : null;

  const active = isDiscountActive(discountPercent, discountEndsOn, now);
  const boundedPercent = discountPercent === null ? null : Math.min(Math.max(discountPercent, 0), 100);
  const currentPriceCents =
    priceCents > 0 && active && boundedPercent !== null
      ? Math.max(Math.round(priceCents * ((100 - boundedPercent) / 100)), 0)
      : priceCents;

  return {
    priceCents,
    currentPriceCents,
    discountPercent: boundedPercent,
    discountEndsOn,
    discountActive: active && boundedPercent !== null && boundedPercent > 0,
  };
}

export function normalisePlanRow(planRow, now = new Date()) {
  if (!planRow) {
    throw new HttpError(500, 'INTERNAL', 'Plan record missing.');
  }

  const pricing = calculatePlanPricing(planRow, now);

  return {
    id: parseNumber(planRow.id, 0),
    name: String(planRow.name ?? ''),
    description: planRow.description ? String(planRow.description) : '',
    priceCents: pricing.priceCents,
    currentPriceCents: pricing.currentPriceCents,
    discountPercent: pricing.discountPercent,
    discountEndsOn: pricing.discountEndsOn,
    discountActive: pricing.discountActive,
  };
}

export function subscriptionIsActive(status) {
  if (!status) {
    return false;
  }
  const normalised = String(status).toLowerCase();
  return normalised === 'active' || normalised === 'trialing' || normalised === 'trial';
}

export async function recordPaymentAttempt(connection, payload) {
  try {
    await connection.execute(
      'INSERT INTO payments (user_id, plan_id, stripe_session_id, status, amount_paid_cents, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        payload.userId,
        payload.planId,
        payload.sessionId,
        payload.status,
        payload.amountCents,
        payload.createdAt,
      ]
    );
  } catch (error) {
    if (error && error.code === 'ER_NO_SUCH_TABLE') {
      // eslint-disable-next-line no-console
      console.warn('Payments table not found. Skipping audit log.');
      return;
    }
    throw error;
  }
}

export async function updatePaymentStatus(connection, sessionId, status, amountCents) {
  try {
    await connection.execute(
      'UPDATE payments SET status = ?, amount_paid_cents = ? WHERE stripe_session_id = ?',
      [status, amountCents, sessionId]
    );
  } catch (error) {
    if (error && error.code === 'ER_NO_SUCH_TABLE') {
      // eslint-disable-next-line no-console
      console.warn('Payments table not found when updating audit log.');
      return;
    }
    throw error;
  }
}
