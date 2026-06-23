export const commandModules = [
  {
    id: "performance",
    label: "Performance Dashboard",
    eyebrow: "See performance",
    title: "Know what is happening today.",
    description:
      "Revenue, leads, bookings, ad spend, open work, and security posture in one calm view.",
    stats: [
      { label: "Revenue", value: "$84.2k", delta: "+18%" },
      { label: "New leads", value: "312", delta: "+42" },
      { label: "Booked jobs", value: "47", delta: "+9" },
      { label: "ROAS", value: "5.6x", delta: "+1.1x" },
    ],
  },
  {
    id: "crm",
    label: "CRM Pipeline",
    eyebrow: "Manage customers",
    title: "Every lead has a next step.",
    description:
      "Track source, value, stage, owner, probability, follow-up date, and notes without spreadsheet drift.",
    stats: [
      { label: "Pipeline", value: "$186k", delta: "+23%" },
      { label: "Hot leads", value: "28", delta: "7 due" },
      { label: "Close rate", value: "31%", delta: "+6%" },
      { label: "Avg. reply", value: "2h", delta: "-41%" },
    ],
  },
  {
    id: "actions",
    label: "Action Center",
    eyebrow: "Take action",
    title: "The system tells you what to do next.",
    description:
      "AI-assisted recommendations for follow-ups, automations, weak campaigns, unpaid invoices, and risky access.",
    stats: [
      { label: "Open actions", value: "16", delta: "5 urgent" },
      { label: "Automations", value: "12", delta: "+3" },
      { label: "Hours saved", value: "38", delta: "monthly" },
      { label: "Risk items", value: "3", delta: "-9" },
    ],
  },
  {
    id: "growth",
    label: "Growth Engine",
    eyebrow: "Grow",
    title: "Ads tied to real business outcomes.",
    description:
      "Google and Meta spend, conversions, landing-page health, attribution, and campaign recommendations.",
    stats: [
      { label: "Spend", value: "$9.4k", delta: "on pace" },
      { label: "Conversions", value: "418", delta: "+27%" },
      { label: "CPA", value: "$22", delta: "-14%" },
      { label: "ROAS", value: "4.9x", delta: "+0.8x" },
    ],
  },
  {
    id: "security",
    label: "Security Center",
    eyebrow: "Secure",
    title: "Risk you can actually understand.",
    description:
      "Access reviews, app findings, infrastructure posture, remediation status, and plain-English next steps.",
    stats: [
      { label: "Risk score", value: "Low", delta: "stable" },
      { label: "Open findings", value: "4", delta: "-11" },
      { label: "Patches", value: "96%", delta: "+8%" },
      { label: "Access review", value: "Done", delta: "Q2" },
    ],
  },
];

export const problems = [
  {
    title: "No KPI visibility",
    body: "Revenue, leads, jobs, ad spend, and customer activity live in different places.",
  },
  {
    title: "Weak follow-up",
    body: "Good leads go cold because nobody can see the next action clearly.",
  },
  {
    title: "Manual work",
    body: "Your team copies data between emails, spreadsheets, CRMs, and old software.",
  },
  {
    title: "Wasted ad spend",
    body: "Campaigns run without trustworthy attribution or a clear path to booked revenue.",
  },
  {
    title: "Hidden risk",
    body: "Permissions, apps, cloud settings, and customer data are rarely reviewed until something breaks.",
  },
];

export const pillars = [
  {
    title: "Operate",
    subtitle: "Dashboards, CRM, workflows, AI actions.",
    body: "We build custom tools that show performance, manage customers, automate repeated work, and surface the next best action.",
    examples: ["KPI dashboards", "CRM pipeline", "Customer portals", "AI workflow assistants"],
  },
  {
    title: "Grow",
    subtitle: "Google Ads, Meta Ads, tracking, landing pages.",
    body: "We connect marketing to operations so ad spend turns into visible pipeline, booked work, and revenue.",
    examples: ["Campaign setup", "GA4 + pixels", "Attribution", "Landing-page tests"],
  },
  {
    title: "Protect",
    subtitle: "Application security, infrastructure review, access controls.",
    body: "We find the risks small businesses usually miss and turn them into a short remediation plan people can act on.",
    examples: ["OWASP review", "Cloud hardening", "Access audit", "Remediation tracker"],
  },
];

export const capabilities = [
  "CRM platforms",
  "Booking and appointment systems",
  "Customer portals",
  "KPI dashboards",
  "Lead intake and routing",
  "AI email assistants",
  "Document extraction",
  "Automated reports",
  "Ads tracking and attribution",
  "Inventory workflows",
  "Secure admin panels",
  "Role-based access",
];

export const processSteps = [
  {
    title: "Listen",
    body: "We map how the business actually runs: customers, revenue, operations, ads, tools, and risk.",
  },
  {
    title: "Scope",
    body: "You get a written scope with priorities, timeline, fixed fee, and what not to build yet.",
  },
  {
    title: "Build",
    body: "We ship the dashboard, CRM, automations, tracking, and security improvements in focused releases.",
  },
  {
    title: "Support",
    body: "We hand off clean documentation and stay available for improvements, monitoring, and new modules.",
  },
];

export const founders = [
  {
    name: "Nikunj Jadawala",
    lane: "Software and security",
    detail: "Application development and cyber security background for building and protecting the system.",
  },
  {
    name: "Jiten Patel",
    lane: "Money and client relationships",
    detail: "Financial audit background for scoping, ROI conversations, and operational discipline.",
  },
  {
    name: "Shayar Patel",
    lane: "Operations and relationships",
    detail: "Hotel management and IT background for translating real business problems into practical systems.",
  },
];
