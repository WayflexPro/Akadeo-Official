import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/Home";
import AboutPage from "./pages/About";
import FeaturesPage from "./pages/Features";
import PricingPage from "./pages/Pricing";
import FAQPage from "./pages/FAQ";
import BlogPage from "./pages/Blog";
import ContactPage from "./pages/Contact";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import VerifyEmailPage from "./pages/VerifyEmail";
import TermsPage from "./pages/Terms";
import PrivacyPage from "./pages/Privacy";
import SetupPage from "./pages/Setup";
import DebugPanel from "./components/DebugPanel";
import { useAuth } from "./features/auth/AuthContext";
import { getSession } from "./features/auth/api";
import AkadeoDashboard from "./dashboard/AkadeoDashboard";
import PaymentSuccessPage from "./dashboard/pages/PaymentSuccess";
import PaymentFailedPage from "./dashboard/pages/PaymentFailed";
import { SubscriptionProvider } from "./features/subscriptions/SubscriptionContext";

const NAV_PAGES = ["home", "about", "features", "pricing", "faq", "blog", "contact"] as const;
const LEGAL_PAGES = ["terms", "privacy"] as const;
const AUTH_PAGES = ["sign-in", "sign-up", "verify-email"] as const;

const ALL_PAGES = [
  ...NAV_PAGES,
  ...AUTH_PAGES,
  ...LEGAL_PAGES,
] as const;

type PageId = (typeof ALL_PAGES)[number];

const DEFAULT_PAGE: PageId = "home";

const getPageFromHash = (): PageId => {
  const hash = window.location.hash.replace(/^#/, "").toLowerCase();
  if (ALL_PAGES.includes(hash as PageId)) {
    return hash as PageId;
  }
  return DEFAULT_PAGE;
};

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
};

const pageComponents: Record<PageId, JSX.Element> = {
  home: <HomePage />,
  about: <AboutPage />,
  features: <FeaturesPage />,
  pricing: <PricingPage />,
  faq: <FAQPage />,
  blog: <BlogPage />,
  contact: <ContactPage />,
  "sign-in": <SignInPage />,
  "sign-up": <SignUpPage />,
  "verify-email": <VerifyEmailPage />,
  terms: <TermsPage />,
  privacy: <PrivacyPage />,
};

const NAVIGATION = NAV_PAGES.map((page) => ({
  page,
  label: page === "faq" ? "FAQ" : page.charAt(0).toUpperCase() + page.slice(1),
}));

const FOOTER_LINKS = {
  product: [
    { label: "Features", page: "features" },
    { label: "Pricing", page: "pricing" },
    { label: "FAQ", page: "faq" },
  ],
  company: [
    { label: "About", page: "about" },
    { label: "Blog", page: "blog" },
    { label: "Contact", page: "contact" },
  ],
  legal: [
    { label: "Terms", page: "terms" },
    { label: "Privacy", page: "privacy" },
  ],
} as const;

const AUTH_LINKS = [
  { label: "Sign In", page: "sign-in", className: "ghost" },
  { label: "Sign Up", page: "sign-up", className: "primary" },
] as const;

function MarketingShell() {
  const [currentPage, setCurrentPage] = useState<PageId>(() => getPageFromHash());
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const isMobileNav = useMediaQuery("(max-width: 940px)");
  const parallaxAllowed = useMediaQuery("(min-width: 768px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const mainRef = useRef<HTMLElement>(null);
  const scrollBarRef = useRef<HTMLSpanElement>(null);
  const { state: authState, logout } = useAuth();

  useEffect(() => {
    const handleHashChange = () => setCurrentPage(getPageFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    document.body.dataset.page = currentPage;
    window.scrollTo(0, 0);
    mainRef.current?.focus();
    setMenuOpen(false);
  }, [currentPage]);

  useEffect(() => {
    document.body.dataset.menuOpen = menuOpen ? "true" : "false";
  }, [menuOpen]);

  useEffect(() => {
    document.documentElement.classList.toggle("is-reduced-motion", prefersReducedMotion);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!isMobileNav) {
      setMenuOpen(false);
    }
  }, [isMobileNav]);

  useEffect(() => {
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));

    if (!revealEls.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    revealEls.forEach((el) => {
      if (!el.classList.contains("visible")) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [prefersReducedMotion, currentPage]);

  useEffect(() => {
    const parallaxEls = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));

    const resetParallax = () => {
      parallaxEls.forEach((el) => {
        el.style.transform = "";
      });
    };

    const updateParallax = () => {
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax ?? "0");
        if (!Number.isFinite(speed)) return;
        const offset = window.scrollY * speed * -1;
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    };

    const updateScrollProgress = () => {
      const bar = scrollBarRef.current;
      if (!bar) return;
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? Math.min(window.scrollY / scrollHeight, 1) : 0;
      bar.style.transform = `scaleX(${progress})`;
    };

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateScrollProgress();
        if (parallaxAllowed && !prefersReducedMotion) {
          updateParallax();
        } else {
          resetParallax();
        }
        ticking = false;
      });
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [parallaxAllowed, prefersReducedMotion, currentPage]);

  const mainClassName = useMemo(() => {
    if (["sign-in", "sign-up", "terms", "privacy"].includes(currentPage)) {
      return "app";
    }
    return "page-shell";
  }, [currentPage]);

  const navHidden = isMobileNav ? !menuOpen : false;

  const handleLogout = async () => {
    setLogoutPending(true);
    try {
      await logout();
    } finally {
      setLogoutPending(false);
      window.location.href = "/";
    }
  };

  const dashboardHref = authState.requiresSetup ? "/setup" : "/dashboard";
  const dashboardLabel = authState.requiresSetup ? "Finish setup" : "Dashboard";

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="background-scene" aria-hidden="true">
        <span className="background-scene__orb background-scene__orb--one" data-parallax="0.04"></span>
        <span className="background-scene__orb background-scene__orb--two" data-parallax="0.08"></span>
        <span className="background-scene__orb background-scene__orb--three" data-parallax="0.12"></span>
        <span className="background-scene__orb background-scene__orb--four" data-parallax="0.05"></span>
        <span className="background-scene__grid" data-parallax="0.02"></span>
      </div>
      <div className="scroll-progress" aria-hidden="true">
        <span className="scroll-progress__bar" ref={scrollBarRef}></span>
      </div>
      <header className="site-header">
        <div className="container">
          <a className="brand" data-nav="home" href="#home" onClick={() => setCurrentPage("home")}>
            <span className="brand-name">Akadeo</span>
          </a>
          <nav className="site-nav" aria-label="Primary">
            <button
              className="menu-toggle"
              type="button"
              aria-expanded={menuOpen ? "true" : "false"}
              aria-controls="nav-links"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span className="sr-only">Toggle navigation</span>
              <span className="menu-toggle__line"></span>
              <span className="menu-toggle__line"></span>
            </button>
            <ul
              id="nav-links"
              className={menuOpen && isMobileNav ? "open" : undefined}
              aria-hidden={navHidden ? "true" : "false"}
            >
              {NAVIGATION.map(({ page, label }) => {
                const isActive = currentPage === page;
                return (
                  <li key={page}>
                    <a
                      href={`#${page}`}
                      data-nav={page}
                      className={isActive ? "active" : undefined}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      {label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="auth-links">
            {authState.isAuthenticated ? (
              <>
                <a
                  className="ghost"
                  href={dashboardHref}
                  onClick={() => setMenuOpen(false)}
                >
                  {dashboardLabel}
                </a>
                <button
                  className="ghost auth-links__logout"
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutPending}
                >
                  {logoutPending ? "Signing out…" : "Logout"}
                </button>
              </>
            ) : (
              AUTH_LINKS.map(({ label, page, className }) => {
                const isActive = currentPage === page;
                const combinedClass = `${className}${isActive ? " active" : ""}`.trim();
                return (
                  <a
                    key={page}
                    className={combinedClass}
                    data-nav={page}
                    href={`#${page}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </a>
                );
              })
            )}
          </div>
        </div>
      </header>
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className={mainClassName}
        data-page-root
      >
        {pageComponents[currentPage]}
      </main>
      <footer className="site-footer">
        <div className="container">
          <div className="footer__top">
            <div>
              <a className="brand" data-nav="home" href="#home" onClick={() => setCurrentPage("home")}>
                <span className="brand-mark">A</span>
                <span className="brand-name">Akadeo</span>
              </a>
              <p>
                A connected platform where teachers, students, and families shape extraordinary learning
                experiences.
              </p>
            </div>
            <div className="footer__links">
              <div>
                <h4>Product</h4>
                {FOOTER_LINKS.product.map(({ label, page }) => (
                  <a
                    key={page}
                    data-nav={page}
                    href={`#${page}`}
                    className={currentPage === page ? "active" : undefined}
                    aria-current={currentPage === page ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </a>
                ))}
              </div>
              <div>
                <h4>Company</h4>
                {FOOTER_LINKS.company.map(({ label, page }) => (
                  <a
                    key={page}
                    data-nav={page}
                    href={`#${page}`}
                    className={currentPage === page ? "active" : undefined}
                    aria-current={currentPage === page ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </a>
                ))}
              </div>
              <div>
                <h4>Legal</h4>
                {FOOTER_LINKS.legal.map(({ label, page }) => (
                  <a
                    key={page}
                    data-nav={page}
                    href={`#${page}`}
                    className={currentPage === page ? "active" : undefined}
                    aria-current={currentPage === page ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <p>
              © {new Date().getFullYear()} Akadeo. All rights reserved.
            </p>
            <div className="footer__socials">
              <a href="#" aria-label="Akadeo on Twitter">
                🐦
              </a>
              <a href="#" aria-label="Akadeo on LinkedIn">
                💼
              </a>
              <a href="#" aria-label="Akadeo on YouTube">
                ▶️
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

function RootRoute() {
  const { state } = useAuth();

  if (state.isAuthenticated) {
    if (state.requiresSetup) {
      return <Navigate to="/setup" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <MarketingShell />;
}

function SetupRoute() {
  const { state } = useAuth();

  if (!state.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!state.requiresSetup) {
    return <Navigate to="/dashboard" replace />;
  }

  return <SetupPage />;
}

function DashboardRoute() {
  const { state } = useAuth();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!state.isAuthenticated || state.requiresSetup) {
      setUserName(null);
      return;
    }

    let cancelled = false;

    const loadSession = async () => {
      try {
        const payload = await getSession();
        if (cancelled) {
          return;
        }
        const fetchedName = payload?.data?.user?.fullName?.trim();
        setUserName(fetchedName && fetchedName.length > 0 ? fetchedName : null);
      } catch (error) {
        console.error("Failed to load session", error);
        if (!cancelled) {
          setUserName(null);
        }
      }
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [state.isAuthenticated, state.requiresSetup]);

  if (!state.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (state.requiresSetup) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <SubscriptionProvider>
      <AkadeoDashboard userName={userName} />
    </SubscriptionProvider>
  );
}

function DashboardPaymentSuccessRoute() {
  const { state } = useAuth();

  if (!state.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (state.requiresSetup) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <SubscriptionProvider>
      <PaymentSuccessPage />
    </SubscriptionProvider>
  );
}

function DashboardPaymentFailedRoute() {
  const { state } = useAuth();

  if (!state.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (state.requiresSetup) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <SubscriptionProvider>
      <PaymentFailedPage />
    </SubscriptionProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DebugPanel />
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/setup" element={<SetupRoute />} />
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/dashboard/payment-success" element={<DashboardPaymentSuccessRoute />} />
        <Route path="/dashboard/payment-failed" element={<DashboardPaymentFailedRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
