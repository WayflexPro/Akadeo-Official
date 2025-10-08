import { LAUNCH_DISCOUNT, COST_ASSUMPTIONS } from "../content/siteContent.js";

export function applyLaunchDiscount(base: number | null) {
  if (base == null) return null;
  if (!LAUNCH_DISCOUNT.active) return round2(base);
  const discounted = base * (1 - LAUNCH_DISCOUNT.percent / 100);
  return round2(discounted);
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function estMonthlyAICostPerSeat(limitGenerations: number) {
  const { aiTokenCostPer1k, avgTokensPerGeneration, utilizationFactor } =
    COST_ASSUMPTIONS;
  const used = limitGenerations * utilizationFactor;
  const tokensK = (used * avgTokensPerGeneration) / 1000;
  return round2(tokensK * aiTokenCostPer1k);
}
