import { useState } from "react";
import AkadeoDashboard from "./AkadeoDashboard";
import { useAuth } from "../features/auth/AuthContext";

export default function DashboardApp() {
  const { logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }

    try {
      setSigningOut(true);
      await logout();
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  return <AkadeoDashboard onSignOut={handleSignOut} signingOut={signingOut} />;
}
