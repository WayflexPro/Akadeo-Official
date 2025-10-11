import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSession, logout as logoutRequest } from "./api";

type AuthState = {
  isAuthenticated: boolean;
  requiresSetup: boolean;
  setupCompletedAt: string | null;
};

type AuthContextValue = {
  state: AuthState;
  setAuthenticated: (options: { requiresSetup: boolean }) => void;
  markSetupComplete: () => void;
  logout: () => Promise<void>;
};

const STORAGE_KEY = "akadeo_auth_state";

const defaultState: AuthState = {
  isAuthenticated: false,
  requiresSetup: false,
  setupCompletedAt: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredState = (): AuthState => {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.isAuthenticated === "boolean" &&
      typeof parsed.requiresSetup === "boolean"
    ) {
      return {
        isAuthenticated: parsed.isAuthenticated,
        requiresSetup: parsed.requiresSetup,
        setupCompletedAt: typeof parsed.setupCompletedAt === "string" ? parsed.setupCompletedAt : null,
      };
    }
  } catch (error) {
    console.warn("Failed to parse stored auth state", error);
  }

  return defaultState;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => readStoredState());

  useEffect(() => {
    let cancelled = false;

    const initialiseSession = async () => {
      try {
        const payload = await getSession();
        if (cancelled) {
          return;
        }

        const user = payload?.data?.user ?? null;

        if (user) {
          setState({
            isAuthenticated: true,
            requiresSetup: !user.setupCompletedAt,
            setupCompletedAt: user.setupCompletedAt,
          });
          return;
        }

        setState(defaultState);
      } catch (error: any) {
        if (cancelled) {
          return;
        }
        if (error?.status === 401) {
          setState(defaultState);
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    };

    initialiseSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!state.isAuthenticated) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setAuthenticated = useCallback((options: { requiresSetup: boolean }) => {
    setState({
      isAuthenticated: true,
      requiresSetup: options.requiresSetup,
      setupCompletedAt: options.requiresSetup ? null : new Date().toISOString(),
    });
  }, []);

  const markSetupComplete = useCallback(() => {
    setState((prev) => {
      if (!prev.isAuthenticated) {
        return prev;
      }
      return {
        isAuthenticated: true,
        requiresSetup: false,
        setupCompletedAt: new Date().toISOString(),
      };
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      console.error("Failed to call logout endpoint", error);
    }
    setState(defaultState);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleSessionExpired = () => {
      let shouldRedirect = false;
      setState((prev) => {
        if (!prev.isAuthenticated) {
          return prev;
        }
        shouldRedirect = true;
        return defaultState;
      });

      if (shouldRedirect) {
        window.localStorage.removeItem(STORAGE_KEY);
        window.location.href = "/#sign-in";
      }
    };

    window.addEventListener("akadeo:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("akadeo:session-expired", handleSessionExpired);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ state, setAuthenticated, markSetupComplete, logout }),
    [state, setAuthenticated, markSetupComplete, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
