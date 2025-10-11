import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { plans as sitePlans, type Plan as SitePlan } from "@/content/siteContent";
import { cn } from "../lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import "./AkadeoDashboard.css";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "classes", label: "Classes" },
  { id: "smart-planner", label: "Smart Planner" },
  { id: "notifications", label: "Notifications" },
  { id: "templates", label: "Templates" },
  { id: "file-management", label: "File Management" },
  { id: "learning-insights", label: "Learning Insights" },
  { id: "ai-co-teacher", label: "AI Co-Teacher" },
  { id: "themes", label: "Themes" },
  { id: "plans", label: "Plans" },
  { id: "settings", label: "Settings" },
] as const;

type PageId = (typeof NAV_ITEMS)[number]["id"];

type AkadeoDashboardProps = {
  userName?: string | null;
};

const classesFeatureList = [
  "AI Quiz Generator",
  "AI Grading Assistant",
  "Assignments",
  "Quizzes & Tests",
  "Gradebook",
  "Anti-Cheat",
  "Class Dashboard",
  "Messaging",
  "Student Profiles",
  "Multi-Teacher Collaboration",
  "Learning Insights",
  "Gap Analysis",
  "Item Analysis",
  "Gamification",
  "Practice Mode",
  "Peer Review",
  "Ask-AI",
  "Smart Planner",
  "File Management",
  "Templates",
  "Notifications",
  "Organization Dashboard",
];

const comingSoonPages: Record<Exclude<PageId, "overview" | "classes" | "plans">, string> = {
  "smart-planner": "Plan differentiated instruction with AI suggestions tailored to each class.",
  notifications: "All of your class, student, and platform alerts will surface here soon.",
  templates: "Reusable lesson, quiz, and communication templates are on the way.",
  "file-management": "Organize handouts, media, and AI resources in a central library.",
  "learning-insights": "Deep insights into mastery, pacing, and student sentiment are in progress.",
  "ai-co-teacher": "Your AI co-teacher will help orchestrate lessons and personalize support.",
  themes: "Fine-tune the Akadeo workspace to match your classroom vibe.",
  settings: "Manage your profile, security, integrations, and more—coming soon.",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

type DashboardPlan = Pick<SitePlan, "id" | "name" | "tagline" | "badge" | "monthlyPrice" | "annualPrice" | "features">;

const plans: DashboardPlan[] = sitePlans.map((plan) => ({
  id: plan.id,
  name: plan.name,
  tagline: plan.tagline,
  badge: plan.badge,
  monthlyPrice: plan.monthlyPrice,
  annualPrice: plan.annualPrice,
  features: plan.features,
}));

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const sidebarHover = {
  hover: { y: -1, scale: 1.01 },
};

const getPlanCtaLabel = (planId: SitePlan["id"]): string => {
  if (planId === "free") {
    return "Start for free";
  }
  if (planId === "enterprise") {
    return "Contact sales";
  }
  return "Choose plan";
};

export default function AkadeoDashboard({ userName }: AkadeoDashboardProps) {
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const displayName = userName?.trim().length ? userName : "Alex";

  const currentNav = useMemo(
    () => NAV_ITEMS.find((item) => item.id === activePage) ?? NAV_ITEMS[0],
    [activePage]
  );

  const renderPage = () => {
    if (activePage === "overview") {
      const overviewWidgets = [
        "Today's Focus",
        "Student Pulse",
        "Upcoming Events",
        "Recent Files",
        "AI Suggestions",
        "Spotlight",
      ];

      return (
        <>
          <Card className="akadeo-dashboard__card--frost">
            <CardHeader>
              <CardTitle className="akadeo-dashboard__heading-xl">Welcome back</CardTitle>
              <CardDescription className="akadeo-dashboard__text-lead">
                Your centralized hub for planning, assessing, and guiding every learner. Widgets like Today’s Focus,
                Student Pulse, and recent activity will live here soon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="akadeo-dashboard__widget-grid">
                {overviewWidgets.map((widget) => (
                  <div key={widget} className="akadeo-dashboard__widget-placeholder">
                    <h4>{widget}</h4>
                    <p>Insights arriving soon.</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="akadeo-dashboard__overview-split">
            <Card className={cn("akadeo-dashboard__card--glow", "akadeo-dashboard__primary-cta")}>
              <CardHeader>
                <CardTitle className="akadeo-dashboard__heading-lg">Classes</CardTitle>
                <CardDescription className="akadeo-dashboard__text-lead">
                  Create, join, and orchestrate every class experience from one beautiful command centre.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <motion.button
                  type="button"
                  className="akadeo-dashboard__primary-cta-button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span>Create or Join Class</span>
                </motion.button>
              </CardContent>
            </Card>

            <div className="akadeo-dashboard__secondary-widgets">
              {["AI workflows", "Student wins", "Workspace setup"].map((title) => (
                <div key={title} className="akadeo-dashboard__secondary-card">
                  <h4>{title}</h4>
                  <p>Rich analytics and actions tailored for you will appear here.</p>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

    if (activePage === "classes") {
      return (
        <Card className="akadeo-dashboard__card--frost">
          <CardHeader>
            <CardTitle className="akadeo-dashboard__heading-lg">Classes</CardTitle>
            <CardDescription className="akadeo-dashboard__text-lead">
              All of your classroom superpowers—AI planning, grading, communication, and analytics—will live in this
              space. Here’s a preview of the toolset you’ll unlock.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="akadeo-dashboard__feature-grid">
              {classesFeatureList.map((feature) => (
                <motion.div
                  key={feature}
                  className="akadeo-dashboard__feature-card"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  {feature}
                </motion.div>
              ))}
            </div>
            <p className="akadeo-dashboard__coming-soon">
              Each module will connect seamlessly with Akadeo’s AI engine and analytics to save you hours every week.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (activePage === "plans") {
      return (
        <>
          <div>
            <h2 className="akadeo-dashboard__heading-lg">Plans</h2>
            <p className="akadeo-dashboard__text-lead">
              Choose the Akadeo plan that fits your classroom or institution. Monthly pricing shown—switching to annual
              unlocks extra savings.
            </p>
          </div>
          <div className="akadeo-dashboard__plans-grid">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 280, damping: 26 }}
              >
                <Card
                  className={cn(
                    "akadeo-dashboard__plan-card",
                    plan.id === "starter" && "akadeo-dashboard__plan-card--highlight"
                  )}
                >
                  <CardHeader>
                    <div className="akadeo-dashboard__plan-header">
                      <CardTitle className="akadeo-dashboard__plan-title">{plan.name}</CardTitle>
                      <span className="akadeo-dashboard__plan-badge">{plan.badge}</span>
                    </div>
                    <CardDescription className="akadeo-dashboard__plan-tagline">{plan.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <p className="akadeo-dashboard__plan-price">
                        {plan.monthlyPrice === null ? "Custom" : currencyFormatter.format(plan.monthlyPrice)}
                        {plan.monthlyPrice !== null && <small>/mo</small>}
                      </p>
                      {plan.annualPrice !== null && (
                        <p className="akadeo-dashboard__plan-annual">
                          Annual: {currencyFormatter.format(plan.annualPrice / 12)}/mo equivalent
                        </p>
                      )}
                    </div>
                    <ul className="akadeo-dashboard__plan-features">
                      {plan.features.slice(0, 3).map((feature) => (
                        <li key={feature}>
                          <span className="akadeo-dashboard__plan-feature-dot" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button type="button" className="akadeo-dashboard__plan-button">
                      {getPlanCtaLabel(plan.id)}
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      );
    }

    if (activePage in comingSoonPages) {
      const copy = comingSoonPages[activePage as keyof typeof comingSoonPages];
      return (
        <Card className="akadeo-dashboard__card--muted">
          <CardHeader>
            <CardTitle className="akadeo-dashboard__heading-lg">{currentNav.label}</CardTitle>
            <CardDescription className="akadeo-dashboard__text-lead">{copy}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="akadeo-dashboard__coming-soon">
              We’re building this feature with teachers in mind. Expect thoughtful workflows, automation, and analytics
              soon.
            </p>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="akadeo-dashboard">
      <div className="akadeo-dashboard__container">
        <div className="akadeo-dashboard__frame">
          <header className="akadeo-dashboard__header">
            <div className="akadeo-dashboard__header-row">
              <div className="akadeo-dashboard__brand">
                <div className="akadeo-dashboard__brand-icon">Ak</div>
                <div className="akadeo-dashboard__brand-text">
                  <span className="akadeo-dashboard__brand-eyebrow">Akadeo</span>
                  <p className="akadeo-dashboard__brand-greeting">Hello, {displayName}</p>
                </div>
              </div>
              <div className="akadeo-dashboard__header-actions">
                <motion.span
                  key={currentNav.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="akadeo-dashboard__view-pill"
                >
                  You’re viewing <span>{currentNav.label}</span>
                </motion.span>
                <motion.button
                  type="button"
                  className="akadeo-dashboard__menu-button"
                  onClick={() => setNavOpen((prev) => !prev)}
                  aria-expanded={navOpen}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="sr-only">Toggle navigation</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                </motion.button>
              </div>
            </div>
            <AnimatePresence>
              {navOpen ? (
                <motion.nav
                  key="mobile-nav"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="akadeo-dashboard__mobile-nav"
                >
                  {NAV_ITEMS.map((item) => {
                    const isActive = activePage === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActivePage(item.id);
                          setNavOpen(false);
                        }}
                        className={cn("akadeo-dashboard__mobile-nav-button", isActive && "is-active")}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </motion.nav>
              ) : null}
            </AnimatePresence>
          </header>

          <div className="akadeo-dashboard__layout">
            <aside className="akadeo-dashboard__sidebar">
              <nav className="akadeo-dashboard__sidebar-nav">
                {NAV_ITEMS.map((item) => {
                  const isActive = activePage === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePage(item.id)}
                      className={cn("akadeo-dashboard__sidebar-button", isActive && "is-active")}
                      variants={sidebarHover}
                      whileHover="hover"
                      aria-current={isActive ? "page" : undefined}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="desktop-indicator"
                          className="akadeo-dashboard__sidebar-active"
                          transition={{ type: "spring", stiffness: 320, damping: 32 }}
                        />
                      )}
                      <span>{item.label}</span>
                    </motion.button>
                  );
                })}
              </nav>
            </aside>

            <main className="akadeo-dashboard__main">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePage}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="akadeo-dashboard__page"
                >
                  {renderPage()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
