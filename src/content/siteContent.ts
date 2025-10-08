export const NAV = ["Home", "About", "Features", "Pricing", "FAQ", "Blog", "Contact"] as const;

export const LAUNCH_DISCOUNT = { active: true, percent: 30 } as const;

export const plans = [
  {
    id: "free",
    name: "Free",
    tagline: "Get started fast—no credit card.",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Up to 2 classes or 50 students total",
      "50 AI-generated questions / month",
      "Basic quizzes & assignments",
      "Auto-grading for MCQ/checkbox",
      "Announcements & resources",
      "Email notifications",
    ],
    limits: {
      classes: 2,
      studentsTotal: 50,
      aiGenerationsPerMonth: 50,
      storageGB: 1,
      coTeachersPerClass: 0,
      questionTypes: ["MCQ", "Short/Paragraph", "Checkbox", "Dropdown"],
    },
    badge: "Starter",
  },
  {
    id: "starter",
    name: "Starter (Teacher)",
    tagline: "Everything a single teacher needs.",
    monthlyPrice: 6.99,
    annualPrice: 6.99 * 12 * 0.8,
    features: [
      "Unlimited classes & students",
      "Up to 5,000 AI generations / month",
      "AI-graded short answers & essays (review)",
      "Question bank + tags & standards",
      "Export gradebook (CSV/Excel)",
      "Custom branding (logo & theme)",
      "Co-teachers per class",
      "Analytics dashboard (progress & item analysis)",
      "Priority support",
    ],
    limits: {
      classes: "Unlimited",
      studentsTotal: "Unlimited",
      aiGenerationsPerMonth: 5000,
      storageGB: 10,
      coTeachersPerClass: 2,
      questionTypes: [
        "MCQ",
        "Checkbox",
        "Dropdown",
        "Short/Paragraph",
        "Drag-and-drop matching",
        "Sorting/Ranking",
        "Hotspot/Image click",
        "Label-the-diagram",
        "Formula entry (MathQuill)",
        "Graphing",
        "Text highlighting",
        "Explain-your-answer (AI checks reasoning)",
      ],
    },
    badge: "Most popular",
  },
  {
    id: "school",
    name: "School",
    tagline: "Designed for departments and small schools.",
    monthlyPrice: 29,
    annualPrice: 29 * 12 * 0.8,
    features: [
      "Includes 5 teacher seats (add more)",
      "Domain-restricted access (@school.edu)",
      "Admin dashboard & usage reports",
      "SSO (Google/Microsoft)",
      "Custom AI limits & API key support",
      "Centralized data export + backups",
      "Priority email/chat support",
    ],
    limits: {
      seatsIncluded: 5,
      seatAddOnMonthly: 5,
      aiGenerationsPerMonthPerSeat: 5000,
      storageGBPerSeat: 20,
      coTeachersPerClass: 5,
      sso: true,
    },
    badge: "For schools",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Larger orgs, higher stakes, custom needs.",
    monthlyPrice: null,
    annualPrice: null,
    features: [
      "Dedicated instance or private cloud",
      "White-label portal & custom domain",
      "Advanced security & DPA/SCCs (GDPR-first)",
      "Uptime SLA, onboarding & training",
      "Integrations (LMS/LTI, Canvas, Teams) roadmap",
    ],
    limits: {
      seatsIncluded: "Custom",
      aiGenerationsPerMonthPerSeat: "Custom",
      storageGBPerSeat: "Custom",
      sso: true,
    },
    badge: "Contact sales",
  },
] as const;

export const HOMEPAGE = {
  heroTitle: "Modern classroom tools teachers actually love",
  heroSubtitle:
    "Create quizzes, assignments, and insights in minutes. AI that saves time—not adds work.",
  bullets: [
    "Fast quiz generation from topics, files, or textbooks",
    "Auto-grading with teacher oversight",
    "Analytics that reveal real learning gaps",
  ],
  cta: { primary: "Get started free", secondary: "See pricing" },
} as const;

export const ABOUT = {
  mission:
    "We’re on a mission to give teachers back hours each week with simple, trustworthy tools.",
  values: [
    "Teacher-first design",
    "Privacy by default (GDPR-first, EU hosting option)",
    "Accessibility and inclusion",
  ],
} as const;

export const FEATURES = [
  {
    title: "AI that actually saves time",
    bullets: [
      "Quiz & test generation with rationales and answer keys",
      "AI-graded short answers & feedback suggestions",
      "Differentiation: easy/medium/hard variants in one click",
    ],
  },
  {
    title: "Assessment & gradebook",
    bullets: [
      "Randomized pools, time windows, anti-cheat basics",
      "Rich question types: drag/drop, hotspot, graphing, formula entry, text highlight",
      "CSV/Excel export, co-teachers, and templates",
    ],
  },
  {
    title: "Class management & insights",
    bullets: [
      "Announcements, resources, messaging",
      "Item analysis, topic mastery, gap analysis",
      "Parent CC & reports (optional)",
    ],
  },
] as const;

export const FAQ = [
  {
    q: "Is AI grading automatic?",
    a: "Objective items are instant. Short answers/essays use AI suggestions that teachers review before publishing.",
  },
  {
    q: "Do you integrate with Google/Microsoft?",
    a: "Yes. Google/Microsoft SSO on School and Enterprise. Google Classroom import and Drive/OneDrive storage are on the roadmap.",
  },
  {
    q: "Where is data hosted?",
    a: "GDPR-first with EU-hosted options. Encryption in transit and at rest.",
  },
  {
    q: "What happens when my AI limit runs out?",
    a: "You can add AI token packs anytime, or AI features pause until your next cycle.",
  },
] as const;

export const CONTACT = {
  email: "support@akadeo.example",
  address: "123 Education Lane, Suite 100",
  formFields: ["Name", "Email", "Organization", "Message"],
} as const;
