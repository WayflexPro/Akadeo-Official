import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import DashboardHomePage from "./pages/Home";
import DashboardAboutPage from "./pages/About";
import DashboardFeaturesPage from "./pages/Features";
import DashboardPlansPage from "./pages/Plans";
import DashboardFAQPage from "./pages/FAQ";
import DashboardBlogPage from "./pages/Blog";
import DashboardContactPage from "./pages/Contact";

const DASHBOARD_PAGES = ["home", "about", "features", "plans", "faq", "blog", "contact"] as const;

type DashboardPageId = (typeof DASHBOARD_PAGES)[number];

const DEFAULT_PAGE: DashboardPageId = "home";

const getPageFromHash = (): DashboardPageId => {
  const hash = window.location.hash.replace(/^#/, "").toLowerCase();
  if (DASHBOARD_PAGES.includes(hash as DashboardPageId)) {
    return hash as DashboardPageId;
  }
  return DEFAULT_PAGE;
};

const dashboardPageComponents: Record<DashboardPageId, JSX.Element> = {
  home: <DashboardHomePage />,
  about: <DashboardAboutPage />,
  features: <DashboardFeaturesPage />,
  plans: <DashboardPlansPage />,
  faq: <DashboardFAQPage />,
  blog: <DashboardBlogPage />,
  contact: <DashboardContactPage />,
};

export default function DashboardApp() {
  const { logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<DashboardPageId>(() =>
    typeof window === "undefined" ? DEFAULT_PAGE : getPageFromHash()
  );
  const mainRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash());
      setMenuOpen(false);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.body.dataset.dashboard = "true";
    return () => {
      delete document.body.dataset.dashboard;
      delete document.body.dataset.dashboardPage;
    };
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.dataset.dashboardPage = currentPage;
    }
    mainRef.current?.focus();
    window.scrollTo(0, 0);
  }, [currentPage]);

  const navigation = useMemo(
    () =>
      DASHBOARD_PAGES.map((page) => ({
        page,
        label: page === "faq" ? "FAQ" : page.charAt(0).toUpperCase() + page.slice(1),
      })),
    []
  );

  const handleLogout = async () => {
    try {
      setSigningOut(true);
      await logout();
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  return (
    <div className="dashboard-shell">
      <header className="dashboard-shell__header">
        <div className="dashboard-shell__brand">
          <span className="dashboard-shell__mark" aria-hidden="true">
            A
          </span>
          <div>
            <p className="dashboard-shell__title">Akadeo Workspace</p>
            <p className="dashboard-shell__subtitle">Where your classroom operations live</p>
          </div>
        </div>
        <button
          className="dashboard-shell__menu"
          type="button"
          aria-expanded={menuOpen ? "true" : "false"}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className="sr-only">Toggle dashboard navigation</span>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav className={`dashboard-shell__nav${menuOpen ? " dashboard-shell__nav--open" : ""}`}>
          {navigation.map(({ page, label }) => {
            const isActive = currentPage === page;
            return (
              <a
                key={page}
                href={`#${page}`}
                className={isActive ? "is-active" : undefined}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            );
          })}
        </nav>
        <button className="dashboard-shell__logout" type="button" onClick={handleLogout} disabled={signingOut}>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </header>
      <main className="dashboard-shell__main" ref={mainRef} tabIndex={-1}>
        {dashboardPageComponents[currentPage]}
      </main>
    </div>
  );
}
