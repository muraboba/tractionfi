export type Priority = {
  id: string;
  phase: string;
  eyebrow: string;
  title: string;
  description: string;
  rationale: string;
};

export const PRIORITIES: Priority[] = [
  {
    id: "starter-ef",
    phase: "Phase 2 · Starter emergency fund",
    eyebrow: "Your next step",
    title: "Build a $1,000 starter emergency fund",
    description:
      "Park a thousand dollars in a separate high-yield savings account before you do anything else. This is the buffer that stops a flat tire from becoming a credit-card balance.",
    rationale:
      "You have no cash reserves designated as emergency funds. A starter buffer comes before debt paydown because it prevents new debt from forming.",
  },
  {
    id: "401k-match",
    phase: "Phase 3 · 401(k) employer match",
    eyebrow: "Your next step",
    title: "Capture your full 401(k) employer match",
    description:
      "Increase your 401(k) contribution to at least 6% of pay. Your employer match is a 100% return on contribution, the highest-leverage move in any portfolio.",
    rationale:
      "You contribute 3% of pay but your employer matches up to 6%. Three percentage points of free money are currently being left on the table every paycheck.",
  },
  {
    id: "high-int-debt",
    phase: "Phase 4 · High-interest debt",
    eyebrow: "Your next step",
    title: "Pay off your credit-card balance",
    description:
      "Direct any remaining slack in your budget toward the highest-APR debt first. Eliminating an 18.99% balance is a guaranteed 18.99% return, nothing in the market beats it.",
    rationale:
      "Your highest-rate debt is a $4,200 balance at 18.99%. Paying it off ranks above further retirement contributions until cleared.",
  },
  {
    id: "full-ef",
    phase: "Phase 5 · Full emergency fund",
    eyebrow: "Your next step",
    title: "Grow your emergency fund to 3 to 6 months of expenses",
    description:
      "Now that high-interest debt is gone, top up the buffer to cover three to six months of essential spending. This is the cushion that lets you negotiate from strength.",
    rationale:
      "Essential monthly spend is $3,400. You hold $2,100 in designated emergency cash, about 0.6 months of runway.",
  },
];

export type FrameworkPhase = {
  n: number;
  title: string;
  detail: string;
};

export const FRAMEWORK_PHASES: FrameworkPhase[] = [
  {
    n: 1,
    title: "Build a working budget",
    detail: "Income minus essentials minus discretionary. You need a number to optimise.",
  },
  {
    n: 2,
    title: "Starter emergency fund",
    detail: "$1,000 in a separate high-yield account. Prevents new debt from forming.",
  },
  {
    n: 3,
    title: "401(k) employer match",
    detail:
      "Contribute up to your full match. A 100% return is the highest-leverage move in any portfolio.",
  },
  {
    n: 4,
    title: "High-interest debt",
    detail:
      "Anything above 7 to 8% APR. Eliminate before adding investments, a guaranteed return.",
  },
  {
    n: 5,
    title: "Full emergency fund",
    detail:
      "Three to six months of essential expenses. The cushion that lets you negotiate from strength.",
  },
  {
    n: 6,
    title: "Moderate-interest debt",
    detail: "4 to 7% APR student loans, lower-rate consumer debt. Paid down before further investing.",
  },
  {
    n: 7,
    title: "Retirement savings",
    detail: "Roth IRA, then traditional, then back-door. Aim for 15% of gross household income.",
  },
  {
    n: 8,
    title: "HSA, college, long-term goals",
    detail:
      "Tax-advantaged savings for healthcare, education, and any remaining long-horizon goals.",
  },
];

export const FAQ_ITEMS = [
  {
    q: "Is this financial advice?",
    a: "No. TractionFI provides general information based on a published financial framework. It is not financial, tax, or investment advice. The engine encodes a widely-used educational flowchart; your situation may include factors it doesn't model.",
  },
  {
    q: "What framework do you use?",
    a: "The US Personal Income Spending Flowchart, the same framework used by financial educators to teach the right order of priorities. It runs in eight phases, from working budget through long-term tax-advantaged savings.",
  },
  {
    q: "Why only one priority at a time?",
    a: "Personal finance is dominated by sequencing. Doing the third-best thing first wastes the money you'd spend on the best thing. Surfacing one priority makes the sequence obvious and removes decision fatigue.",
  },
  {
    q: "What do you need to know about me?",
    a: "At minimum: monthly income, essential expenses, savings balances, and any debt. The richer the input, the more nuanced the recommendation, but a five-field paycheck is usually enough to find the next move.",
  },
  {
    q: "Do you connect to my bank?",
    a: "Not in v1. All inputs are manual. We're prioritising precision and trust over convenience, and a manual model means your data never leaves your browser session.",
  },
  {
    q: "What's coming next?",
    a: "Account creation, multi-scenario comparisons, and persistent dashboards. For now, the sample dashboard runs against in-memory state, useful for exploration but not yet for tracking real progress.",
  },
];
