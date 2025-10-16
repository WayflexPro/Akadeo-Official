import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSubscription } from "../../features/subscriptions/SubscriptionContext";
import "../PaymentStatus.css";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subscription, loading, refresh } = useSubscription();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const planName = useMemo(() => {
    if (!subscription) {
      return "Free";
    }
    if (subscription.isActive && subscription.planName) {
      return subscription.planName;
    }
    return subscription.planName || "Free";
  }, [subscription]);

  const handleGoToDashboard = () => {
    navigate("/dashboard", { replace: true });
  };

  const handleManagePlans = () => {
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem("akadeo-dashboard-target-page", "plans");
      } catch {
        // ignore storage errors
      }
    }
    navigate("/dashboard", { replace: true });
  };

  const sessionId = searchParams.get("session_id");

  return (
    <div className="payment-status">
      <section className="payment-status__card" aria-live="polite">
        <span className="payment-status__eyebrow">Payment confirmed</span>
        <h1 className="payment-status__title">You&apos;re all set!</h1>
        <p className="payment-status__body">
          {loading
            ? "We&apos;re updating your workspace with the new membership."
            : `Your workspace is now on the ${planName} plan.`}
        </p>
        <span className="payment-status__plan-chip" role="status">
          Plan: {planName}
        </span>
        {sessionId ? (
          <p className="payment-status__note">Checkout reference: {sessionId}</p>
        ) : null}
        <div className="payment-status__actions">
          <button
            type="button"
            className="payment-status__button payment-status__button--primary"
            onClick={handleGoToDashboard}
          >
            Go to dashboard
          </button>
          <button
            type="button"
            className="payment-status__button payment-status__button--ghost"
            onClick={handleManagePlans}
          >
            Manage plans
          </button>
        </div>
        <p className="payment-status__note">
          A receipt will arrive via email shortly. You can manage your membership anytime from the Plans view inside the
          dashboard.
        </p>
      </section>
    </div>
  );
}
