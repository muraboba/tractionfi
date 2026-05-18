import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          TractionFI
        </h1>
        <p className="mt-4 text-lg text-muted">
          Accelerate your path to financial independence.
        </p>

        <p className="mt-10 text-balance text-base leading-relaxed">
          Tell us about your money — income, expenses, savings, debts — and
          we&apos;ll tell you the single most important thing to do next with
          your dollars. No guesswork, no advice that doesn&apos;t fit your
          situation.
        </p>

        <p className="mt-4 text-balance text-sm text-muted">
          Powered by the US Personal Income Spending Flowchart, the same
          framework used by financial educators to teach the right order of
          financial priorities.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            See a sample dashboard
          </Link>
          <span className="text-xs text-muted">
            (auth and account creation coming soon)
          </span>
        </div>

        <p className="mt-16 text-xs text-muted">
          TractionFI provides general information based on a published financial
          framework. It is not financial, tax, or investment advice.
        </p>
      </div>
    </main>
  );
}
