"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ENGINE_VERSION,
  evaluate,
  type Milestone,
  type MilestoneStatus,
  type UserData,
} from "@tractionfi/engine";
import { ThemeToggle } from "@/components/theme-toggle";

// Hardcoded sample data â€” proves end-to-end engine integration.
// This will be replaced by D1-backed user data once auth is wired up.
const SAMPLE_USER_DATA: UserData = {
  paycheck: {
    grossAmount: 4_000,
    netAmount: 3_000,
    contribution401k: 0,
    ytdContribution401k: 0,
    projected401kContribution: 0,
    contribution401kPercentage: 2,
    employerOffers401kMatch: true,
    employerMatchPercentage: 5,
    payFrequency: "biweekly",
  },
  incomes: [],
  expenses: [
    {
      id: "expense-rent",
      name: "Rent",
      amount: 1_800,
      frequency: "monthly",
      category: "essential",
    },
    {
      id: "expense-food",
      name: "Groceries",
      amount: 600,
      frequency: "monthly",
      category: "essential",
    },
    {
      id: "expense-utilities",
      name: "Utilities",
      amount: 200,
      frequency: "monthly",
      category: "essential",
    },
  ],
  assets: [
    {
      id: "asset-ef",
      name: "Emergency Fund",
      value: 1_200,
      category: "cash",
      isEmergencyFund: true,
    },
  ],
  debts: [
    {
      id: "debt-cc",
      name: "Visa",
      balance: 4_500,
      interestRate: 18.99,
      minimumPayment: 90,
      category: "credit-card",
    },
  ],
  hasHDHP: false,
  hasCollegeBoundChildren: false,
  longTermGoal: "standard_retirement",
};

function statusBadge(status: MilestoneStatus): { label: string; className: string } {
  switch (status) {
    case "active":
      return {
        label: "Current focus",
        className: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-1 ring-[var(--warning-fg)]/20",
      };
    case "completed":
      return {
        label: "Completed",
        className: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-1 ring-[var(--success-fg)]/20",
      };
    case "not_applicable":
      return {
        label: "Not applicable",
        className: "bg-surface-2 text-muted-foreground ring-1 ring-border",
      };
    case "skipped":
      return {
        label: "Skipped",
        className: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-1 ring-[var(--warning-fg)]/20",
      };
    case "blocked":
      return {
        label: "Blocked",
        className: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-1 ring-[var(--danger-fg)]/20",
      };
    case "not_started":
      return {
        label: "Not started",
        className: "bg-surface-2 text-muted-2 ring-1 ring-border",
      };
  }
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const result = useMemo(() => evaluate(SAMPLE_USER_DATA), []);
  const { currentPriority, milestones, metrics, blockers } = result;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-brand transition">
            â† back to landing
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sample dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Engine v{ENGINE_VERSION} Â· tax year {result.taxYear} Â· sample data
            (no auth yet)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={async () => {
              await fetch('/api/auth/sign-out', { method: 'POST' })
              window.location.href = '/login'
            }}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground transition hover:border-border-strong hover:bg-surface-2"
          >
            Log out
          </button>
        </div>
      </header>

      {blockers.length > 0 ? (
        <section className="mt-8 rounded-xl border border-[var(--danger-fg)]/20 bg-[var(--danger-bg)] p-6">
          <h2 className="text-lg font-semibold text-[var(--danger-fg)]">Complete your budget first</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--danger-fg)]/90">
            {blockers.map((b) => (
              <li key={b.code}>{b.message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric label="Monthly income" value={formatUSD(metrics.monthlyIncome)} />
        <Metric label="Monthly expenses" value={formatUSD(metrics.monthlyExpenses)} />
        <Metric
          label="Monthly cash flow"
          value={formatUSD(metrics.monthlyCashFlow)}
          tone={metrics.monthlyCashFlow >= 0 ? "positive" : "negative"}
        />
        <Metric label="Net worth" value={formatUSD(metrics.netWorth)} />
        <Metric
          label="Emergency fund"
          value={formatUSD(metrics.emergencyFundBalance)}
        />
        <Metric label="Annual gross" value={formatUSD(metrics.annualGrossIncome)} />
      </section>

      {currentPriority ? (
        <section className="mt-10 overflow-hidden rounded-2xl bg-priority-bg p-8 shadow-[var(--priority-shadow)] ring-1 ring-priority-accent/15">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-priority-accent">
            Your next step
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-priority-fg">
            {currentPriority.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-priority-fg/90">
            {currentPriority.description}
          </p>
          <p className="mt-5 text-sm text-priority-muted">
            <strong className="text-priority-fg">Why:</strong>{" "}
            {currentPriority.rationale}
          </p>
        </section>
      ) : null}

      <section className="mt-12">
        <h3 className="text-lg font-semibold tracking-tight">Your financial roadmap</h3>
        <ol className="mt-4 space-y-2">
          {milestones.map((m, i) => (
            <MilestoneRow key={m.id} index={i + 1} milestone={m} />
          ))}
        </ol>
      </section>

      <footer className="mt-16 border-t border-border pt-6 text-xs text-muted-2">
        TractionFI provides general information based on a published financial
        framework. It is not financial, tax, or investment advice.
      </footer>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-[var(--success-fg)]"
      : tone === "negative"
        ? "text-[var(--danger-fg)]"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition hover:border-border-strong">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${toneClass}`}>{value}</p>
    </div>
  );
}

function MilestoneRow({ milestone, index }: { milestone: Milestone; index: number }) {
  const badge = statusBadge(milestone.status);
  const isActive = milestone.status === "active";
  return (
    <li
      className={`flex items-start gap-4 rounded-xl border p-4 transition ${
        isActive
          ? "border-brand/40 bg-surface shadow-[0_0_0_1px_var(--brand-glow)]"
          : "border-border bg-surface hover:border-border-strong"
      }`}
    >
      <span
        className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
          isActive
            ? "bg-brand text-brand-foreground"
            : "bg-surface-2 text-muted-foreground"
        }`}
      >
        {index}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-foreground">{milestone.title}</h4>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{milestone.description}</p>
      </div>
    </li>
  );
}
