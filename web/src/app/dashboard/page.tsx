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

// Hardcoded sample data — proves end-to-end engine integration.
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
        className: "bg-amber-100 text-amber-800",
      };
    case "completed":
      return { label: "Completed", className: "bg-green-100 text-green-800" };
    case "not_applicable":
      return {
        label: "Not applicable",
        className: "bg-zinc-100 text-zinc-600",
      };
    case "skipped":
      return { label: "Skipped", className: "bg-orange-100 text-orange-800" };
    case "blocked":
      return { label: "Blocked", className: "bg-red-100 text-red-800" };
    case "not_started":
      return { label: "Not started", className: "bg-zinc-100 text-zinc-500" };
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
          <Link href="/" className="text-sm text-muted hover:underline">
            ← back to landing
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Sample dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Engine v{ENGINE_VERSION} · tax year {result.taxYear} · sample data
            (no auth yet)
          </p>
        </div>
        <button
          onClick={async () => {
            await fetch('/api/auth/sign-out', { method: 'POST' })
            window.location.href = '/login'
          }}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-50"
        >
          Log out
        </button>
      </header>

      {blockers.length > 0 ? (
        <section className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-900">Complete your budget first</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-900">
            {blockers.map((b) => (
              <li key={b.code}>{b.message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8 grid gap-6 sm:grid-cols-3">
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
        <section className="mt-10">
          <p className="text-xs uppercase tracking-wide text-muted">
            Your next step
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{currentPriority.title}</h2>
          <p className="mt-3 text-base leading-relaxed">
            {currentPriority.description}
          </p>
          <p className="mt-4 text-sm text-muted">
            <strong>Why:</strong> {currentPriority.rationale}
          </p>
        </section>
      ) : null}

      <section className="mt-10">
        <h3 className="text-lg font-semibold">Your financial roadmap</h3>
        <ol className="mt-4 space-y-3">
          {milestones.map((m, i) => (
            <MilestoneRow key={m.id} index={i + 1} milestone={m} />
          ))}
        </ol>
      </section>

      <footer className="mt-16 border-t border-border pt-6 text-xs text-muted">
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
      ? "text-green-700"
      : tone === "negative"
        ? "text-red-700"
        : "";
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function MilestoneRow({ milestone, index }: { milestone: Milestone; index: number }) {
  const badge = statusBadge(milestone.status);
  return (
    <li className="flex items-start gap-4 rounded-lg border border-border p-4">
      <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-700">
        {index}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{milestone.title}</h4>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">{milestone.description}</p>
      </div>
    </li>
  );
}
