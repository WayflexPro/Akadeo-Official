import { fetchWithDiagnostics } from "../../lib/fetchWithDiagnostics";
import { buildDefaultPlans } from "./defaultPlans";

export type Plan = {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  currentPriceCents: number;
  discountPercent: number | null;
  discountEndsOn: string | null;
  discountActive: boolean;
};

export type Subscription = {
  id: number | null;
  planId: number | null;
  planName: string;
  status: string;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  stripeSubscriptionId: string | null;
  priceCents: number | null;
  currentPriceCents: number | null;
  discountPercent: number | null;
  discountEndsOn: string | null;
  description: string;
};

type PlansResponse = {
  plans: Plan[];
};

type CheckoutResponse = {
  sessionId: string;
  url: string | null;
  existingSubscriptionId: number | null;
};

type SubscriptionResponse = {
  subscription: Subscription;
};

type CancelResponse = {
  message: string;
};

async function request<T>(url: string, options: RequestInit & { timeoutMs?: number; bodyJson?: unknown }) {
  return (await fetchWithDiagnostics(url, options)) as { ok: true; data: T };
}

export async function fetchPlans() {
  try {
    const payload = await request<PlansResponse>("/api/plans", { method: "GET", timeoutMs: 10000 });
    if (!payload?.data?.plans || payload.data.plans.length === 0) {
      const fallback = buildDefaultPlans();
      return { ok: true, data: { plans: fallback } } as const;
    }
    return payload;
  } catch (error) {
    const fallback = buildDefaultPlans();
    return { ok: true, data: { plans: fallback } } as const;
  }
}

export async function startCheckout(planId: number) {
  return request<CheckoutResponse>(`/api/plans/${planId}/checkout`, {
    method: "POST",
    timeoutMs: 15000,
  });
}

export async function fetchCurrentSubscription() {
  return request<SubscriptionResponse>("/api/subscriptions/current", {
    method: "GET",
    timeoutMs: 10000,
  });
}

export async function cancelSubscription() {
  return request<CancelResponse>("/api/subscriptions/cancel", {
    method: "POST",
    timeoutMs: 15000,
  });
}
