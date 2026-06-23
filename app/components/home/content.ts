export const commandModules = [
  {
    id: "ai-voice",
    label: "AI Voice Agent",
    eyebrow: "Always on",
    title: "Every call answered. Every booking captured.",
    description:
      "An AI receptionist that handles inbound calls, matches callers to the right person or service, and writes confirmed bookings directly to your system, 24/7, with no staff needed.",
    stats: [
      { label: "Calls handled", value: "847", delta: "this month" },
      { label: "Bookings by AI", value: "312", delta: "auto-confirmed" },
      { label: "After hours", value: "68%", delta: "of total volume" },
      { label: "Avg handle time", value: "2m 14s", delta: "per call" },
    ],
  },
  {
    id: "dashboard",
    label: "Owner Dashboard",
    eyebrow: "See everything",
    title: "Your whole business in one calm view.",
    description:
      "Revenue, bookings, occupancy, outstanding balances, and operational health, built around how your specific business actually runs, not a generic template.",
    stats: [
      { label: "Revenue", value: "$84.2k", delta: "+18% vs last mo" },
      { label: "Occupancy", value: "94%", delta: "+7 pts" },
      { label: "Outstanding", value: "$3.1k", delta: "4 accounts" },
      { label: "New clients", value: "38", delta: "this month" },
    ],
  },
  {
    id: "booking",
    label: "Booking & CRM",
    eyebrow: "Manage customers",
    title: "Every client has a next step.",
    description:
      "Appointment scheduling, service history, staff availability, and automated follow-up reminders, all connected so nothing slips and no client goes cold.",
    stats: [
      { label: "Booked", value: "147", delta: "this week" },
      { label: "Pending confirm", value: "23", delta: "needs action" },
      { label: "Client retention", value: "78%", delta: "+12 pts" },
      { label: "Avg ticket", value: "$94", delta: "+$11" },
    ],
  },
  {
    id: "automations",
    label: "Automations",
    eyebrow: "Set and forget",
    title: "The work that runs without you.",
    description:
      "Monthly invoicing, SMS reminders, overdue alerts, and re-engagement sequences, scheduled, tested, and running in the background.",
    stats: [
      { label: "Invoices sent", value: "48", delta: "fully automated" },
      { label: "SMS this month", value: "1.2k", delta: "61% open rate" },
      { label: "Hours saved", value: "38", delta: "per month" },
      { label: "On-time payments", value: "94%", delta: "+19 pts" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    eyebrow: "Multi-location",
    title: "Across every location, in one place.",
    description:
      "Revenue, staff utilization, customer retention, and service mix, aggregated from your POS, booking system, and ops data into a single view.",
    stats: [
      { label: "Locations", value: "3", delta: "all tracked" },
      { label: "Staff utilization", value: "81%", delta: "avg" },
      { label: "Network revenue", value: "$214k", delta: "+22%" },
      { label: "Client retention", value: "73%", delta: "+9 pts" },
    ],
  },
];

export const problems = [
  {
    title: "Missed calls",
    body: "Every unanswered call after hours is a booking, and the revenue behind it, gone for good.",
  },
  {
    title: "No visibility",
    body: "Revenue, bookings, occupancy, and customer activity live in different places.",
  },
  {
    title: "Weak follow-up",
    body: "Good leads go cold because nobody can see the next action clearly.",
  },
  {
    title: "Manual work",
    body: "Your team copies data between calls, spreadsheets, calendars, and old software.",
  },
  {
    title: "Hidden risk",
    body: "Permissions, apps, cloud settings, and customer data are rarely reviewed until something breaks.",
  },
];

export const capabilities = [
  "AI voice receptionists",
  "Self-improving AI call agents",
  "Owner & operator dashboards",
  "Booking & appointment systems",
  "Client & contractor portals",
  "Automated invoicing & billing",
  "SMS & email campaigns",
  "Multi-location analytics",
  "CRM & lead pipelines",
  "POS & API integrations",
  "Role-based access controls",
  "Security & compliance reviews",
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
