import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { plans as sitePlans, type Plan as SitePlan } from "@/content/siteContent";
import { cn } from "../lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useAuth } from "../features/auth/AuthContext";
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
  { id: "layouts", label: "Layouts" },
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

const comingSoonPages: Record<Exclude<PageId, "overview" | "classes" | "plans" | "themes" | "layouts">, string> = {
  "smart-planner": "Plan differentiated instruction with AI suggestions tailored to each class.",
  notifications: "All of your class, student, and platform alerts will surface here soon.",
  templates: "Reusable lesson, quiz, and communication templates are on the way.",
  "file-management": "Organize handouts, media, and AI resources in a central library.",
  "learning-insights": "Deep insights into mastery, pacing, and student sentiment are in progress.",
  "ai-co-teacher": "Your AI co-teacher will help orchestrate lessons and personalize support.",
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

type ThemeDefinition = {
  id: string;
  name: string;
  vibe: string;
  description: string;
  features: string[];
  previewBackground: string;
  accent: string;
  accentSoft: string;
  glow: string;
  motion: {
    primary: { x: number; y: number; duration: number };
    secondary: { x: number; y: number; duration: number };
  };
};

const THEME_STORAGE_KEY = "akadeo-dashboard-theme";

const dashboardThemes: ThemeDefinition[] = [
  {
    id: "aurora-drift",
    name: "Aurora Drift",
    vibe: "Ethereal polar shimmer",
    description:
      "Polar gradients ripple across the chrome with frosted glass panels and subtle aurora ribbons for a calming command centre.",
    features: [
      "Frosted glass panels glow through teal and violet auroras",
      "Parallax ribbons animate gently across the workspace shell",
      "Soft particle twinkles add depth without distraction",
    ],
    previewBackground: "radial-gradient(120% 120% at 12% 8%, #1a2648 0%, #091022 58%, #02040c 100%)",
    accent: "#7cf0ff",
    accentSoft: "rgba(124, 240, 255, 0.35)",
    glow: "rgba(124, 240, 255, 0.65)",
    motion: {
      primary: { x: 18, y: -20, duration: 7.4 },
      secondary: { x: -14, y: 16, duration: 9.2 },
    },
  },
  {
    id: "neon-night",
    name: "Neon Night",
    vibe: "Electric synthwave energy",
    description:
      "A high-contrast synthwave set with neon scan lines, vapor trails, and chrome typography for late-night productivity sprints.",
    features: [
      "Animated neon grid with sweeping scan-lines",
      "Hover interactions trigger electric glow pulses",
      "Accent controls beam in hot magenta and cyan",
    ],
    previewBackground: "linear-gradient(150deg, #050018 0%, #21024a 60%, #050018 100%)",
    accent: "#ff36d2",
    accentSoft: "rgba(53, 193, 255, 0.38)",
    glow: "rgba(255, 54, 210, 0.7)",
    motion: {
      primary: { x: 22, y: -12, duration: 6.4 },
      secondary: { x: -18, y: 18, duration: 8.1 },
    },
  },
  {
    id: "zen-garden",
    name: "Zen Garden",
    vibe: "Botanical serenity",
    description:
      "Ground the dashboard in misty greens, floating leaves, and drifting incense trails that breathe mindfulness into planning.",
    features: [
      "Organic gradients inspired by moss and stone",
      "Floating leaf shadows drift slowly across tiles",
      "Soft incense wisps animate behind key widgets",
    ],
    previewBackground: "linear-gradient(160deg, #1f3b2c 0%, #0c1d16 55%, #040b08 100%)",
    accent: "#6fe7b7",
    accentSoft: "rgba(111, 231, 183, 0.32)",
    glow: "rgba(111, 231, 183, 0.55)",
    motion: {
      primary: { x: 14, y: -18, duration: 10 },
      secondary: { x: -10, y: 20, duration: 11.5 },
    },
  },
  {
    id: "cosmic-wave",
    name: "Cosmic Wave",
    vibe: "Galactic motion",
    description:
      "Invoke deep-space momentum with orbiting constellations, vibrant nebulas, and kinetic trajectories that track progress.",
    features: [
      "Nebula gradients sweep across the workspace shell",
      "Orbiting particles trace momentum rings",
      "Shooting-star streaks react to navigation",
    ],
    previewBackground: "radial-gradient(130% 130% at 85% 10%, #401b7a 0%, #0c0823 55%, #020111 100%)",
    accent: "#8f7bff",
    accentSoft: "rgba(143, 123, 255, 0.36)",
    glow: "rgba(143, 123, 255, 0.6)",
    motion: {
      primary: { x: -24, y: -10, duration: 8.4 },
      secondary: { x: 20, y: 18, duration: 9.8 },
    },
  },
  {
    id: "desert-dawn",
    name: "Desert Dawn",
    vibe: "Sunrise warmth",
    description:
      "Sandy gradients, mirage shimmer, and rising sunlight bring optimism while retaining crisp contrast for analytics.",
    features: [
      "Warm terracotta panels with soft sun flares",
      "Mirage shimmer animation along header glass",
      "Dust motes drift in parallax for subtle depth",
    ],
    previewBackground: "linear-gradient(140deg, #2a0d0d 0%, #503116 45%, #1a0f0a 100%)",
    accent: "#ffb169",
    accentSoft: "rgba(255, 177, 105, 0.34)",
    glow: "rgba(255, 177, 105, 0.6)",
    motion: {
      primary: { x: 16, y: -14, duration: 7.6 },
      secondary: { x: -18, y: 22, duration: 10.2 },
    },
  },
  {
    id: "retro-pixel",
    name: "Retro Pixel",
    vibe: "Playful arcade grid",
    description:
      "Pixelated panels, scanline pulses, and bouncing sprites gamify your workflow with throwback optimism.",
    features: [
      "Animated pixel sprites orbit navigation icons",
      "Iso-metric grid pulses in 8-bit gradients",
      "Chunky headers pair with playful sound cues",
    ],
    previewBackground: "linear-gradient(155deg, #1a0425 0%, #151d54 55%, #040714 100%)",
    accent: "#58f5ff",
    accentSoft: "rgba(255, 239, 95, 0.38)",
    glow: "rgba(88, 245, 255, 0.6)",
    motion: {
      primary: { x: 26, y: -8, duration: 5.6 },
      secondary: { x: -22, y: 18, duration: 6.6 },
    },
  },
  {
    id: "ocean-tide",
    name: "Ocean Tide",
    vibe: "Fluid tidal calm",
    description:
      "Rolling gradients, refracted caustics, and bubble accents make the workspace feel like a tranquil reef habitat.",
    features: [
      "Layered waveforms flow beneath navigation",
      "Light caustics shimmer across card surfaces",
      "Bubble particles rise with interaction cues",
    ],
    previewBackground: "linear-gradient(150deg, #041b33 0%, #042a3d 48%, #010913 100%)",
    accent: "#56d2ff",
    accentSoft: "rgba(86, 210, 255, 0.34)",
    glow: "rgba(86, 210, 255, 0.6)",
    motion: {
      primary: { x: 18, y: -16, duration: 8.8 },
      secondary: { x: -16, y: 18, duration: 9.6 },
    },
  },
  {
    id: "forest-canopy",
    name: "Forest Canopy",
    vibe: "Firefly focus",
    description:
      "A twilight forest palette with firefly pulses, layered foliage, and woodgrain surfaces for grounded focus.",
    features: [
      "Layered canopy shadows sway with a breeze",
      "Firefly micro-animations spark between widgets",
      "Warm woodgrain headers balance deep greens",
    ],
    previewBackground: "linear-gradient(165deg, #0f1f12 0%, #132b18 52%, #050906 100%)",
    accent: "#9df85c",
    accentSoft: "rgba(157, 248, 92, 0.32)",
    glow: "rgba(157, 248, 92, 0.55)",
    motion: {
      primary: { x: -18, y: -16, duration: 11.2 },
      secondary: { x: 20, y: 22, duration: 12.6 },
    },
  },
  {
    id: "pastel-dream",
    name: "Pastel Dream",
    vibe: "Soft creative lift",
    description:
      "Weightless bubbles, cotton-candy gradients, and playful typography make ideation sessions feel dreamy.",
    features: [
      "Floating pastel clouds drift around hero widgets",
      "Bokeh sparkles animate with gentle parallax",
      "Rounded glass panels showcase soft shadows",
    ],
    previewBackground: "radial-gradient(140% 140% at 20% 15%, #ff9ce5 0%, #6a7bff 45%, #121328 100%)",
    accent: "#ffc9f1",
    accentSoft: "rgba(255, 201, 241, 0.38)",
    glow: "rgba(255, 201, 241, 0.6)",
    motion: {
      primary: { x: 14, y: -12, duration: 10.5 },
      secondary: { x: -18, y: 16, duration: 12 },
    },
  },
  {
    id: "monochrome-grid",
    name: "Monochrome Grid",
    vibe: "Architectural precision",
    description:
      "A disciplined monochrome palette with animated blueprint grids and crisp typographic focus for detail work.",
    features: [
      "Animated blueprint gridlines sweep across panels",
      "Chrome highlights glide along card edges",
      "High-contrast typography with soft grayscale accents",
    ],
    previewBackground: "linear-gradient(160deg, #0d1119 0%, #1a202d 50%, #06080d 100%)",
    accent: "#9aa5b1",
    accentSoft: "rgba(154, 165, 177, 0.35)",
    glow: "rgba(154, 165, 177, 0.55)",
    motion: {
      primary: { x: 12, y: -16, duration: 9.8 },
      secondary: { x: -10, y: 18, duration: 11.4 },
    },
  },
  {
    id: "solar-flare",
    name: "Solar Flare",
    vibe: "Luminous intensity",
    description:
      "Ignite the workspace with coronal bursts, radiant spectra, and molten gradients for high-energy launches.",
    features: [
      "Animated solar arcs sweep along the top rail",
      "Glowing coronal particles drift with depth",
      "High-energy accent buttons pulse with heat",
    ],
    previewBackground: "radial-gradient(135% 135% at 30% 10%, #ff6820 0%, #47091c 45%, #08020a 100%)",
    accent: "#ff8a3d",
    accentSoft: "rgba(255, 138, 61, 0.38)",
    glow: "rgba(255, 138, 61, 0.65)",
    motion: {
      primary: { x: -22, y: -12, duration: 6.8 },
      secondary: { x: 18, y: 20, duration: 8.4 },
    },
  },
  {
    id: "cyber-hologram",
    name: "Cyber Hologram",
    vibe: "Futuristic clarity",
    description:
      "Layered holo panes, refracted prisms, and coded glyphs create a sci-fi ops centre ready for advanced automations.",
    features: [
      "Prismatic holo panes animate with glass refraction",
      "Floating glyph ticker streams along the header",
      "Interactive focus rings ripple on click targets",
    ],
    previewBackground: "linear-gradient(155deg, #061129 0%, #09264a 48%, #02060d 100%)",
    accent: "#6ef3ff",
    accentSoft: "rgba(110, 243, 255, 0.36)",
    glow: "rgba(110, 243, 255, 0.62)",
    motion: {
      primary: { x: 20, y: -18, duration: 7.2 },
      secondary: { x: -16, y: 18, duration: 8.9 },
    },
  },
  {
    id: "chalkboard",
    name: "Chalkboard",
    vibe: "Scholastic nostalgia",
    description:
      "Hand-drawn chalk strokes, dusty particles, and bold classroom typography embrace analog charm with digital polish.",
    features: [
      "Animated chalk strokes reveal key headers",
      "Dust motes float with subtle depth of field",
      "Warm task cards feel like sticky notes on slate",
    ],
    previewBackground: "linear-gradient(155deg, #0f211d 0%, #0a1513 55%, #020605 100%)",
    accent: "#ffe27a",
    accentSoft: "rgba(255, 226, 122, 0.36)",
    glow: "rgba(255, 226, 122, 0.55)",
    motion: {
      primary: { x: 16, y: -14, duration: 9.4 },
      secondary: { x: -18, y: 16, duration: 11.3 },
    },
  },
];

type OverviewWidgetDefinition = {
  id: "focus" | "pulse" | "events" | "files" | "ai" | "spotlight";
  title: string;
  description: string;
};

const overviewWidgets: OverviewWidgetDefinition[] = [
  {
    id: "focus",
    title: "Today's Focus",
    description: "Insights arriving soon to keep your lesson priorities sharp.",
  },
  {
    id: "pulse",
    title: "Student Pulse",
    description: "Early signals around wellbeing and engagement will surface here.",
  },
  {
    id: "events",
    title: "Upcoming Events",
    description: "Assemblies, due dates, and reminders will slot themselves into view.",
  },
  {
    id: "files",
    title: "Recent Files",
    description: "Your latest uploads and shared materials will gather in this space.",
  },
  {
    id: "ai",
    title: "AI Suggestions",
    description: "Akadeo will recommend actions, automations, and insights tailored to you.",
  },
  {
    id: "spotlight",
    title: "Spotlight",
    description: "Celebrate important wins, nudges, and highlights curated for your classes.",
  },
];

const overviewWidgetMap = overviewWidgets.reduce<Record<OverviewWidgetDefinition["id"], OverviewWidgetDefinition>>(
  (acc, widget) => {
    acc[widget.id] = widget;
    return acc;
  },
  {} as Record<OverviewWidgetDefinition["id"], OverviewWidgetDefinition>
);

type SecondaryWidgetDefinition = {
  id: "workflows" | "wins" | "setup";
  title: string;
  description: string;
};

const secondaryWidgets: SecondaryWidgetDefinition[] = [
  {
    id: "workflows",
    title: "AI workflows",
    description: "Rich analytics and actions tailored for you will appear here.",
  },
  {
    id: "wins",
    title: "Student wins",
    description: "Rich analytics and actions tailored for you will appear here.",
  },
  {
    id: "setup",
    title: "Workspace setup",
    description: "Rich analytics and actions tailored for you will appear here.",
  },
];

const secondaryWidgetMap = secondaryWidgets.reduce<Record<SecondaryWidgetDefinition["id"], SecondaryWidgetDefinition>>(
  (acc, widget) => {
    acc[widget.id] = widget;
    return acc;
  },
  {} as Record<SecondaryWidgetDefinition["id"], SecondaryWidgetDefinition>
);

type LayoutEmphasis = "default" | "wide";

type LayoutWidgetPlacement = {
  id: OverviewWidgetDefinition["id"];
  emphasis?: LayoutEmphasis;
};

type LayoutSecondaryPlacement = {
  id: SecondaryWidgetDefinition["id"];
};

type DashboardLayoutDefinition = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  widgetPlacements: LayoutWidgetPlacement[];
  secondaryPlacements: LayoutSecondaryPlacement[];
  ctaPosition: "left" | "right";
  accent: string;
  accentSoft: string;
  previewBackground: string;
  highlights: string[];
};

const LAYOUT_STORAGE_KEY = "akadeo-dashboard-layout";

const dashboardLayouts: DashboardLayoutDefinition[] = [
  {
    id: "default",
    name: "Default Mosaic",
    tagline: "Balanced glance across every widget.",
    description:
      "Keep the dashboard feeling familiar with a classic grid and anchored call-to-action that mirrors the current layout.",
    widgetPlacements: [
      { id: "focus" },
      { id: "pulse" },
      { id: "events" },
      { id: "files" },
      { id: "ai" },
      { id: "spotlight" },
    ],
    secondaryPlacements: [{ id: "workflows" }, { id: "wins" }, { id: "setup" }],
    ctaPosition: "left",
    accent: "#7cf0ff",
    accentSoft: "rgba(124, 240, 255, 0.25)",
    previewBackground: "linear-gradient(150deg, rgba(7, 11, 28, 0.85), rgba(7, 11, 28, 0.45))",
    highlights: [
      "Classic three-column grid keeps everything evenly spaced",
      "Primary CTA stays on the left so actions are immediate",
      "Secondary stack flows in the default priority",
    ],
  },
  {
    id: "insight-stream",
    name: "Insight Stream",
    tagline: "Let analytics lead the story.",
    description:
      "Put momentum metrics up front while your action card glides to the right so insights guide every decision.",
    widgetPlacements: [
      { id: "pulse", emphasis: "wide" },
      { id: "focus" },
      { id: "ai" },
      { id: "events" },
      { id: "files" },
      { id: "spotlight" },
    ],
    secondaryPlacements: [{ id: "wins" }, { id: "workflows" }, { id: "setup" }],
    ctaPosition: "right",
    accent: "#8f7bff",
    accentSoft: "rgba(143, 123, 255, 0.25)",
    previewBackground: "linear-gradient(160deg, rgba(22, 16, 46, 0.85), rgba(7, 9, 26, 0.55))",
    highlights: [
      "Student Pulse expands to span the grid width",
      "Primary CTA drifts to the right column",
      "Celebrations rise to the top of the secondary list",
    ],
  },
  {
    id: "focus-flow",
    name: "Focus Flow",
    tagline: "Prioritise planning and upcoming work.",
    description:
      "Give planning widgets the hero treatment while keeping supporting insights close by for quick reference.",
    widgetPlacements: [
      { id: "focus", emphasis: "wide" },
      { id: "events" },
      { id: "files" },
      { id: "ai" },
      { id: "pulse" },
      { id: "spotlight" },
    ],
    secondaryPlacements: [{ id: "setup" }, { id: "workflows" }, { id: "wins" }],
    ctaPosition: "left",
    accent: "#6fe7b7",
    accentSoft: "rgba(111, 231, 183, 0.25)",
    previewBackground: "linear-gradient(155deg, rgba(10, 27, 24, 0.85), rgba(5, 12, 20, 0.55))",
    highlights: [
      "Today's Focus stretches across the grid",
      "Upcoming Events rises beside planning tools",
      "Secondary stack starts with workspace setup guidance",
    ],
  },
];

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
  const { logout } = useAuth();
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const displayName = userName?.trim().length ? userName : "Alex";
  const [signingOut, setSigningOut] = useState(false);
  const [activeTheme, setActiveTheme] = useState<ThemeDefinition["id"]>(() => {
    if (typeof window === "undefined") {
      return "aurora-drift";
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme && dashboardThemes.some((theme) => theme.id === storedTheme)) {
      return storedTheme as ThemeDefinition["id"];
    }

    return "aurora-drift";
  });
  const [activeLayout, setActiveLayout] = useState<DashboardLayoutDefinition["id"]>(() => {
    if (typeof window === "undefined") {
      return "default";
    }

    const storedLayout = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (storedLayout && dashboardLayouts.some((layout) => layout.id === storedLayout)) {
      return storedLayout as DashboardLayoutDefinition["id"];
    }

    return "default";
  });

  const appliedTheme = useMemo(
    () => dashboardThemes.find((theme) => theme.id === activeTheme) ?? dashboardThemes[0],
    [activeTheme]
  );
  const currentLayout = useMemo(
    () => dashboardLayouts.find((layout) => layout.id === activeLayout) ?? dashboardLayouts[0],
    [activeLayout]
  );

  const themeStyleVariables = useMemo(
    () =>
      ({
        "--selected-theme-accent": appliedTheme.accent,
        "--selected-theme-accent-soft": appliedTheme.accentSoft,
        "--selected-theme-glow": appliedTheme.glow,
      }) as CSSProperties,
    [appliedTheme]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LAYOUT_STORAGE_KEY, activeLayout);
  }, [activeLayout]);

  const currentNav = useMemo(
    () => NAV_ITEMS.find((item) => item.id === activePage) ?? NAV_ITEMS[0],
    [activePage]
  );

  const handleThemeSelect = (themeId: ThemeDefinition["id"]) => {
    setActiveTheme(themeId);
  };

  const handleLayoutSelect = (layoutId: DashboardLayoutDefinition["id"]) => {
    setActiveLayout(layoutId);
  };

  const renderPage = () => {
    if (activePage === "overview") {
      const widgetPlacements = currentLayout.widgetPlacements
        .map((placement) => {
          const widget = overviewWidgetMap[placement.id];
          if (!widget) {
            return null;
          }

          return { ...widget, emphasis: placement.emphasis ?? "default" };
        })
        .filter((widget): widget is OverviewWidgetDefinition & { emphasis: LayoutEmphasis } => Boolean(widget));

      const secondaryPlacements = currentLayout.secondaryPlacements
        .map((placement) => secondaryWidgetMap[placement.id])
        .filter((widget): widget is SecondaryWidgetDefinition => Boolean(widget));

      const overviewSplitOrder: Array<"cta" | "secondary"> =
        currentLayout.ctaPosition === "right" ? ["secondary", "cta"] : ["cta", "secondary"];

      return (
        <LayoutGroup id="akadeo-overview-layout">
          <Card className="akadeo-dashboard__card--frost">
            <CardHeader>
              <CardTitle className="akadeo-dashboard__heading-xl">Welcome back</CardTitle>
              <CardDescription className="akadeo-dashboard__text-lead">
                Your centralized hub for planning, assessing, and guiding every learner. Widgets like Today’s Focus,
                Student Pulse, and recent activity will live here soon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div className="akadeo-dashboard__widget-grid" layout>
                {widgetPlacements.map((widget) => (
                  <motion.div
                    key={widget.id}
                    layout
                    layoutId={`overview-widget-${widget.id}`}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                    className={cn(
                      "akadeo-dashboard__widget-placeholder",
                      widget.emphasis === "wide" && "akadeo-dashboard__widget-placeholder--wide"
                    )}
                  >
                    <h4>{widget.title}</h4>
                    <p>{widget.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>

          <motion.div className="akadeo-dashboard__overview-split" layout>
            {overviewSplitOrder.map((section) => {
              if (section === "cta") {
                return (
                  <motion.div
                    key="cta"
                    layout
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                    className="akadeo-dashboard__cta-column"
                  >
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
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key="secondary"
                  layout
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  className="akadeo-dashboard__secondary-widgets"
                >
                  {secondaryPlacements.map((widget) => (
                    <motion.div
                      key={widget.id}
                      layout
                      layoutId={`secondary-widget-${widget.id}`}
                      transition={{ type: "spring", stiffness: 260, damping: 28 }}
                      className="akadeo-dashboard__secondary-card"
                    >
                      <h4>{widget.title}</h4>
                      <p>{widget.description}</p>
                    </motion.div>
                  ))}
                </motion.div>
              );
            })}
          </motion.div>
        </LayoutGroup>
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

    if (activePage === "themes") {
      return (
        <div className="akadeo-dashboard__theme-page">
          <div className="akadeo-dashboard__themes-intro">
            <h2 className="akadeo-dashboard__heading-lg">Themes</h2>
            <p className="akadeo-dashboard__text-lead">
              Choose from immersive visual identities crafted for different moods. Each theme ships with bespoke motion,
              lighting, and accent treatments ready to transform your Akadeo workspace.
            </p>
          </div>

          <div className="akadeo-dashboard__themes-grid">
            {dashboardThemes.map((theme) => (
              <motion.article
                key={theme.id}
                className={cn(
                  "akadeo-dashboard__theme-card",
                  activeTheme === theme.id && "is-selected"
                )}
                style={
                  {
                    "--theme-accent": theme.accent,
                    "--theme-accent-soft": theme.accentSoft,
                    "--theme-glow": theme.glow,
                  } as CSSProperties
                }
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <AnimatePresence>
                  {activeTheme === theme.id && (
                    <motion.span
                      className="akadeo-dashboard__theme-card-check"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.2 }}
                    >
                      ✓
                    </motion.span>
                  )}
                </AnimatePresence>
                <motion.div
                  className="akadeo-dashboard__theme-preview"
                  data-theme={theme.id}
                  style={
                    {
                      background: theme.previewBackground,
                    } as CSSProperties
                  }
                  layout
                >
                  <motion.span
                    className="akadeo-dashboard__theme-orb"
                    animate={{ x: [0, theme.motion.primary.x, 0], y: [0, theme.motion.primary.y, 0] }}
                    transition={{ duration: theme.motion.primary.duration, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.span
                    className="akadeo-dashboard__theme-orb akadeo-dashboard__theme-orb--secondary"
                    animate={{ x: [0, theme.motion.secondary.x, 0], y: [0, theme.motion.secondary.y, 0] }}
                    transition={{ duration: theme.motion.secondary.duration, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.span
                    className="akadeo-dashboard__theme-spark"
                    animate={{ opacity: [0.25, 0.75, 0.4], scale: [0.8, 1.15, 0.9] }}
                    transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                  />

                  <div className="akadeo-dashboard__theme-preview-label">
                    <strong>{theme.name}</strong>
                    <span>{theme.vibe}</span>
                  </div>
                </motion.div>

                <div className="akadeo-dashboard__theme-body">
                  <p className="akadeo-dashboard__theme-description">{theme.description}</p>
                  <ul className="akadeo-dashboard__theme-feature-list">
                    {theme.features.map((feature) => (
                      <li key={feature}>
                        <span className="akadeo-dashboard__theme-bullet" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="akadeo-dashboard__theme-actions">
                    <button
                      type="button"
                      className="akadeo-dashboard__theme-select-button"
                      onClick={() => handleThemeSelect(theme.id)}
                      aria-pressed={activeTheme === theme.id}
                    >
                      {activeTheme === theme.id ? "Selected" : "Apply theme"}
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      );
    }

    if (activePage === "layouts") {
      return (
        <div className="akadeo-dashboard__layout-page">
          <div className="akadeo-dashboard__layouts-intro">
            <h2 className="akadeo-dashboard__heading-lg">Layouts</h2>
            <p className="akadeo-dashboard__text-lead">
              Pick the spatial rhythm that matches how you work. Layouts rearrange your widgets and secondary cards, then the
              dashboard glides into place instantly.
            </p>
          </div>

          <div className="akadeo-dashboard__layouts-grid">
            {dashboardLayouts.map((layout) => {
              const isSelected = activeLayout === layout.id;
              return (
                <motion.article
                  key={layout.id}
                  className={cn("akadeo-dashboard__layout-card", isSelected && "is-selected")}
                  style={
                    {
                      "--layout-accent": layout.accent,
                      "--layout-accent-soft": layout.accentSoft,
                    } as CSSProperties
                  }
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  <div
                    className="akadeo-dashboard__layout-preview"
                    style={{ background: layout.previewBackground } as CSSProperties}
                  >
                    <div className="akadeo-dashboard__layout-preview-grid">
                      {layout.widgetPlacements.map((placement, index) => (
                        <span
                          key={`${layout.id}-preview-${placement.id}-${index}`}
                          className={cn(
                            "akadeo-dashboard__layout-preview-widget",
                            placement.emphasis === "wide" && "is-wide"
                          )}
                        />
                      ))}
                    </div>
                    <div
                      className="akadeo-dashboard__layout-preview-split"
                      data-position={layout.ctaPosition}
                    >
                      <span className="akadeo-dashboard__layout-preview-cta" />
                      <div className="akadeo-dashboard__layout-preview-secondary">
                        {layout.secondaryPlacements.map((placement, index) => (
                          <span
                            key={`${layout.id}-preview-secondary-${placement.id}-${index}`}
                            className="akadeo-dashboard__layout-preview-secondary-card"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="akadeo-dashboard__layout-body">
                    <div className="akadeo-dashboard__layout-header">
                      <h3 className="akadeo-dashboard__layout-title">{layout.name}</h3>
                      <span className="akadeo-dashboard__layout-tagline">{layout.tagline}</span>
                    </div>
                    <p className="akadeo-dashboard__layout-description">{layout.description}</p>
                    <ul className="akadeo-dashboard__layout-highlights">
                      {layout.highlights.map((highlight) => (
                        <li key={highlight}>
                          <span className="akadeo-dashboard__layout-bullet" aria-hidden="true" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                    <div className="akadeo-dashboard__layout-actions">
                      <button
                        type="button"
                        className="akadeo-dashboard__layout-select-button"
                        onClick={() => handleLayoutSelect(layout.id)}
                        aria-pressed={isSelected}
                      >
                        {isSelected ? "Selected" : "Use layout"}
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
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

  const handleLogout = async () => {
    try {
      setSigningOut(true);
      await logout();
    } finally {
      setSigningOut(false);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  return (
    <div className="akadeo-dashboard" data-theme={appliedTheme.id} style={themeStyleVariables}>
      <div className="akadeo-dashboard__theme-backdrop" aria-hidden="true">
        <div className="akadeo-dashboard__theme-layer" />
        <div className="akadeo-dashboard__theme-layer akadeo-dashboard__theme-layer--secondary" />
        <div className="akadeo-dashboard__theme-particles" />
      </div>
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
                <motion.button
                  type="button"
                  className="akadeo-dashboard__logout-button"
                  onClick={handleLogout}
                  disabled={signingOut}
                  whileTap={{ scale: signingOut ? 1 : 0.96 }}
                >
                  {signingOut ? "Logging out…" : "Log Out"}
                </motion.button>
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
