import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../../features/subscriptions/SubscriptionContext";
import "../PaymentStatus.css";

export default function PaymentFailedPage() {
  const navigate = useNavigate();
  const { subscription, loading, refresh, error } = useSubscription();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRetry = () => {
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem("akadeo-dashboard-target-page", "plans");
      } catch {
        // ignore storage errors
      }
    }
    navigate("/dashboard", { replace: true });
  };

  const planName = subscription?.planName ?? "Free";

  return (
    <div className="payment-status payment-status--error">
      <section className="payment-status__card" aria-live="assertive">
        <span className="payment-status__eyebrow">Payment issue</span>
        <h1 className="payment-status__title">We couldn&apos;t confirm your payment</h1>
        <p className="payment-status__body">
          {loading
            ? "Checking your membership status…"
            : `Your workspace is still on the ${planName} plan. Please try the checkout again or update your payment method.`}
        </p>
        <span className="payment-status__plan-chip">Current plan: {planName}</span>
        {error ? <p className="payment-status__error">{error}</p> : null}
        <div className="payment-status__actions">
          <button
            type="button"
            className="payment-status__button payment-status__button--primary"
            onClick={handleRetry}
          >
            Try again
          </button>
          <button
            type="button"
            className="payment-status__button payment-status__button--ghost"
            onClick={() => navigate("/", { replace: true })}
          >
            Back to homepage
          </button>
        </div>
        <p className="payment-status__note">
          If the issue persists, contact the Akadeo team and share the email address tied to your workspace so we can
          investigate quickly.
        </p>
      </section>
    </div>
  );
}
