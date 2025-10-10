import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { plans as sitePlans, type Plan as SitePlan } from "../../content/siteContent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

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
  onSignOut?: () => void | Promise<void>;
  signingOut?: boolean;
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

export default function AkadeoDashboard({ userName, onSignOut, signingOut }: AkadeoDashboardProps) {
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const displayName = userName?.trim().length ? userName : "Alex";

  const currentNav = useMemo(
    () => NAV_ITEMS.find((item) => item.id === activePage) ?? NAV_ITEMS[0],
    [activePage]
  );

  const renderPage = () => {
    if (activePage === "overview") {
      return (
        <div className="space-y-6">
          <Card className="border-white/5 bg-slate-900/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-white">Welcome back</CardTitle>
              <CardDescription className="text-base text-slate-300">
                Your centralized hub for planning, assessing, and guiding every learner. Widgets like
                Today&apos;s Focus, Student Pulse, and recent activity will live here soon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {["Today&apos;s Focus", "Student Pulse", "Upcoming Events", "Recent Files", "AI Suggestions", "Spotlight"]
                  .map((widget) => (
                    <div
                      key={widget}
                      className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 text-slate-200 shadow-inner shadow-black/10"
                    >
                      <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{widget}</p>
                      <p className="mt-3 text-lg text-slate-300">Insights arriving soon.</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
            <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#6c63ff]/20 via-transparent to-[#00c1c1]/20" />
              <CardHeader className="relative">
                <CardTitle className="text-3xl font-semibold text-white">Classes</CardTitle>
                <CardDescription className="text-base text-slate-300">
                  Create, join, and orchestrate every class experience from one beautiful command centre.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative pt-2">
                <motion.button
                  type="button"
                  className="group flex h-40 w-full items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-lg font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c63ff] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 md:h-48"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6c63ff] to-[#00c1c1] text-center text-base font-semibold text-slate-950 shadow-lg shadow-[#6c63ff]/30 transition group-hover:shadow-xl group-hover:shadow-[#6c63ff]/40 md:h-32 md:w-32 md:text-lg">
                    Create or Join Class
                  </span>
                </motion.button>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {["AI workflows", "Student wins", "Workspace setup"].map((title) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/5 bg-slate-900/50 p-6 text-slate-200 shadow-inner shadow-black/20"
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</p>
                  <p className="mt-2 text-sm text-slate-400">Rich analytics and actions tailored for you will appear here.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activePage === "classes") {
      return (
        <Card className="border-white/5 bg-slate-900/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl text-white">Classes</CardTitle>
            <CardDescription className="text-base text-slate-300">
              All of your classroom superpowers—AI planning, grading, communication, and analytics—will live in this
              space. Here&apos;s a preview of the toolset you&apos;ll unlock.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {classesFeatureList.map((feature) => (
                <motion.div
                  key={feature}
                  className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 text-sm text-slate-200 shadow-inner shadow-black/10"
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  {feature}
                </motion.div>
              ))}
            </div>
            <p className="mt-6 text-sm text-slate-400">
              Each module will connect seamlessly with Akadeo&apos;s AI engine and analytics to save you hours every week.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (activePage === "plans") {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-semibold text-white">Plans</h2>
            <p className="mt-2 text-base text-slate-300">
              Choose the Akadeo plan that fits your classroom or institution. Monthly pricing shown—switching to annual
              unlocks extra savings.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <Card
                  className={
                    plan.id === "starter"
                      ? "border-[#6c63ff]/80 bg-gradient-to-br from-[#6c63ff]/20 via-slate-900/80 to-[#00c1c1]/20"
                      : "border-white/10 bg-slate-900/60"
                  }
                >
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-200">
                        {plan.badge}
                      </span>
                    </div>
                    <CardDescription className="text-sm text-slate-300">{plan.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <p className="text-4xl font-semibold text-white">
                        {plan.monthlyPrice === null ? "Custom" : currencyFormatter.format(plan.monthlyPrice)}
                        {plan.monthlyPrice !== null && <span className="text-base font-normal text-slate-400">/mo</span>}
                      </p>
                      {plan.annualPrice !== null && (
                        <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
                          Annual: {currencyFormatter.format(plan.annualPrice / 12)}/mo equivalent
                        </p>
                      )}
                    </div>
                    <ul className="space-y-3 text-sm text-slate-200">
                      {plan.features.slice(0, 3).map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#6c63ff] to-[#00c1c1]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                      <button
                        type="button"
                        className="w-full rounded-xl bg-gradient-to-r from-[#6c63ff] to-[#00c1c1] px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-[#6c63ff]/20 transition hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c63ff] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                      >
                        {getPlanCtaLabel(plan.id)}
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    if (activePage in comingSoonPages) {
      const copy = comingSoonPages[activePage as keyof typeof comingSoonPages];
      return (
        <Card className="border-white/5 bg-slate-900/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl text-white">{currentNav.label}</CardTitle>
            <CardDescription className="text-base text-slate-300">{copy}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">
              We&apos;re building this feature with teachers in mind. Expect thoughtful workflows, automation, and
              analytics soon.
            </p>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0b1220] to-[#050810] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 py-6 sm:px-6 lg:px-10">
        <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-[0_35px_120px_rgba(6,10,21,0.45)] backdrop-blur-xl">
          <header className="border-b border-white/10 bg-slate-950/60 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6c63ff] to-[#00c1c1] text-lg font-semibold text-slate-950 shadow-lg shadow-[#6c63ff]/30">
                  Ak
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#6c63ff]">Akadeo</p>
                  <p className="text-xl font-semibold text-white">Hello, {displayName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <motion.span
                  key={currentNav.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hidden rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-300 md:inline-flex"
                >
                  You&apos;re viewing <span className="ml-1 font-semibold text-white">{currentNav.label}</span>
                </motion.span>
                <motion.button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-slate-900/80 text-slate-200 transition hover:border-[#6c63ff]/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c63ff] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 md:hidden"
                  onClick={() => setNavOpen((prev) => !prev)}
                  aria-expanded={navOpen}
                  whileTap={{ scale: 0.96 }}
                >
                  <span className="sr-only">Toggle navigation</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                </motion.button>
                <button
                  type="button"
                  onClick={() => onSignOut?.()}
                  disabled={signingOut}
                  className="hidden rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-[#6c63ff]/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c63ff] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex"
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
            <AnimatePresence>
              {navOpen ? (
                <motion.nav
                  key="mobile-nav"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 flex flex-col gap-1 rounded-2xl border border-white/10 bg-slate-900/70 p-2 md:hidden"
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
                        className={`relative flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c63ff] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                          isActive
                            ? "bg-gradient-to-r from-[#6c63ff]/90 to-[#00c1c1]/90 text-slate-950 shadow-lg shadow-[#6c63ff]/30"
                            : "text-slate-200 hover:bg-white/5"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {item.label}
                        {isActive && (
                          <motion.span
                            layoutId="mobile-indicator"
                            className="ml-2 inline-flex h-2 w-2 items-center justify-center rounded-full bg-slate-950"
                          />
                        )}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => onSignOut?.()}
                    disabled={signingOut}
                    className="mt-2 inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-[#6c63ff]/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c63ff] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60 md:hidden"
                  >
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </motion.nav>
              ) : null}
            </AnimatePresence>
          </header>

          <div className="flex flex-1 flex-col md:flex-row">
            <aside className="hidden w-64 flex-shrink-0 border-r border-white/10 bg-slate-950/60 p-6 md:block">
              <nav className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = activePage === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePage(item.id)}
                      className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c63ff] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                        isActive ? "text-white" : "text-slate-300 hover:text-white"
                      }`}
                      variants={sidebarHover}
                      whileHover="hover"
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="relative z-10">{item.label}</span>
                      {isActive && (
                        <motion.span
                          layoutId="desktop-indicator"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#6c63ff]/90 to-[#00c1c1]/90 shadow-lg shadow-[#6c63ff]/30"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            </aside>

            <main className="flex-1 overflow-y-auto bg-slate-950/50 p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePage}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="space-y-6"
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
