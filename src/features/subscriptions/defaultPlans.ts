import type { Plan } from "./api";

function computeCurrent(
  priceCents: number,
  discountPercent: number | null,
  discountEndsOn: string | null,
  now: Date,
) {
  if (!discountPercent || discountPercent <= 0) return priceCents;
  if (!discountEndsOn) return priceCents;
  const end = new Date(`${discountEndsOn}T23:59:59.999Z`).getTime();
  const active = now.getTime() <= end;
  if (!active) return priceCents;
  // Round like Stripe: integers in cents, floor is fine
  return Math.floor((priceCents * (100 - discountPercent)) / 100);
}

export function buildDefaultPlans(now = new Date()): Plan[] {
  const list = [
    {
      id: 1,
      name: "Free",
      description: "Default free plan",
      priceCents: 0,
      discountPercent: null,
      discountEndsOn: null,
    },
    {
      id: 2,
      name: "Starter (Teacher)",
      description: "Everything a single teacher needs",
      priceCents: 699, // $6.99
      discountPercent: 30,
      discountEndsOn: "2025-01-04",
    },
    {
      id: 3,
      name: "School",
      description: "For schools that want shared access",
      priceCents: 2900, // $29.00
      discountPercent: 30,
      discountEndsOn: "2025-01-04",
    },
    {
      id: 4,
      name: "Enterprise",
      description: "Contact us for large deployments",
      priceCents: 0,
      discountPercent: null,
      discountEndsOn: null,
    },
  ];

  return list.map((p) => {
    const currentPriceCents = computeCurrent(
      p.priceCents,
      p.discountPercent ?? null,
      p.discountEndsOn ?? null,
      now,
    );
    const discountActive =
      p.discountPercent != null &&
      p.discountPercent > 0 &&
      p.discountEndsOn != null &&
      now.getTime() <= new Date(`${p.discountEndsOn}T23:59:59.999Z`).getTime();

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      priceCents: p.priceCents,
      currentPriceCents,
      discountPercent: p.discountPercent ?? null,
      discountEndsOn: p.discountEndsOn ?? null,
      discountActive,
    } satisfies Plan;
  });
}
