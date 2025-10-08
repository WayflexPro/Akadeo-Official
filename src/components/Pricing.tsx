import React from "react";
import { plans, LAUNCH_DISCOUNT } from "../content/siteContent";
import { applyLaunchDiscount } from "../lib/pricing";

export default function Pricing() {
  const [billing, setBilling] = React.useState<"monthly" | "annual">("monthly");

  return (
    <section id="pricing" aria-labelledby="pricing-title">
      <div className="container">
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}
        >
          <h2 id="pricing-title">Pricing</h2>
          <div aria-label="Billing period toggle" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={billing === "monthly" ? "" : "muted"}>Monthly</span>
            <button
              type="button"
              className={`toggle ${billing === "annual" ? "on" : ""}`}
              aria-label="Toggle billing period"
              aria-pressed={billing === "annual"}
              onClick={() => setBilling((prev) => (prev === "monthly" ? "annual" : "monthly"))}
            >
              <span className="knob" aria-hidden />
            </button>
            <span className={billing === "annual" ? "" : "muted"}>Annual</span>
          </div>
        </div>

        {LAUNCH_DISCOUNT.active && (
          <div className="card" style={{ marginTop: 12, background: "#eef2ff" }} role="status">
            🎉 LAUNCH PROMO: <strong>{LAUNCH_DISCOUNT.percent}% OFF</strong> all paid plans. Discount applies automatically.
          </div>
        )}

        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 24 }}
        >
          {plans.map((plan) => {
            const base = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;
            const discounted = applyLaunchDiscount(base);
            const isDiscounted = Boolean(LAUNCH_DISCOUNT.active && base && base > 0);

            return (
              <article key={plan.id} className="card" aria-label={`${plan.name} plan`}>
                {plan.badge && <span className="badge">{plan.badge}</span>}
                <h3>{plan.name}</h3>
                <p className="muted" style={{ minHeight: "3rem" }}>
                  {plan.tagline}
                </p>

                <div style={{ marginTop: 10 }} aria-live="polite">
                  {base == null ? (
                    <div className="price">Contact sales</div>
                  ) : isDiscounted ? (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <div className="price">${discounted?.toFixed(2)}</div>
                      <div className="strike">${base.toFixed(2)}</div>
                      <div className="muted">{billing === "monthly" ? "/mo" : "/yr"}</div>
                    </div>
                  ) : (
                    <div className="price">
                      ${base.toFixed(2)} <span className="muted">{billing === "monthly" ? "/mo" : "/yr"}</span>
                    </div>
                  )}

                  {isDiscounted && (
                    <div className="note" style={{ marginTop: 4 }}>
                      LAUNCH: Save {LAUNCH_DISCOUNT.percent}%
                    </div>
                  )}
                </div>

                <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                {plan.limits && (
                  <div style={{ marginTop: 16 }}>
                    <div className="small muted" style={{ fontWeight: 600, letterSpacing: 0.4 }}>
                      Plan limits
                    </div>
                    <pre className="small" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
{JSON.stringify(plan.limits, null, 2)}
                    </pre>
                  </div>
                )}

                <button className="btn" style={{ width: "100%", marginTop: 16 }}>
                  {plan.id === "enterprise" ? "Contact sales" : "Choose plan"}
                </button>
              </article>
            );
          })}
        </div>

        <p className="note" style={{ marginTop: 16 }}>
          Add-ons: AI Token Pack (+5,000 gens): $3; Extra storage: $1.99 / 10GB; Extra teacher seat on School: $5/mo.
        </p>
      </div>
    </section>
  );
}
