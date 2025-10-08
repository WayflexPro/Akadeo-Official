import { LAUNCH_DISCOUNT } from "../content/siteContent";

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function applyLaunchDiscount(base: number | null) {
  if (base == null) return null;
  if (!LAUNCH_DISCOUNT.active) return round2(base);
  return round2(base * (1 - LAUNCH_DISCOUNT.percent / 100));
}
