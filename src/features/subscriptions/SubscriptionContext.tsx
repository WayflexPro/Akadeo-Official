import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  cancelSubscription as cancelSubscriptionRequest,
  fetchCurrentSubscription,
  type Subscription,
} from "./api";

type SubscriptionContextValue = {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  cancel: () => Promise<void>;
  canceling: boolean;
  cancelError: string | null;
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCurrentSubscription();
      setSubscription(response.data.subscription);
    } catch (err: any) {
      setError(err?.message || "Could not load subscription.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const cancel = useCallback(async () => {
    setCancelError(null);
    setCanceling(true);
    try {
      await cancelSubscriptionRequest();
      await load();
    } catch (err: any) {
      setCancelError(err?.message || "We could not cancel your membership right now.");
      throw err;
    } finally {
      setCanceling(false);
    }
  }, [load]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({ subscription, loading, error, refresh, cancel, canceling, cancelError }),
    [subscription, loading, error, refresh, cancel, canceling, cancelError]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return ctx;
}
