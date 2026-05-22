import { PRIORITIES } from "./data";
import { ArrowRight, ChevronDown, Lock } from "./icons";

const PRIMARY = PRIORITIES[0];

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-24 pt-18">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(900px 500px at 85% -10%, var(--accent-glow), transparent 60%)",
        }}
      />
      <div className="relative z-10 mx-auto grid max-w-[1024px] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
            Personal finance, decided
          </div>

          <h1
            className="mt-6 font-semibold tracking-[-0.025em] text-balance text-foreground"
            style={{ fontSize: "clamp(40px, 6vw, 64px)", lineHeight: 1.04 }}
          >
            One next step.
            <br />
            <span className="text-muted">Not a hundred opinions.</span>
          </h1>

          <p className="mt-6 max-w-[48ch] text-pretty text-[18px] leading-[1.55] text-muted">
            Tell us about your money, income, expenses, savings, debts, and we&apos;ll tell you the
            single most important thing to do next with your dollars. No guesswork, no advice that
            doesn&apos;t fit your situation.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#preview"
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-accent px-[22px] py-3.5 text-[15px] font-medium text-accent-foreground shadow-[0_0_32px_rgba(139,124,255,0.22)] transition-colors hover:bg-accent-hover"
            >
              See a sample dashboard
              <ArrowRight size={16} />
            </a>
            <a
              href="#framework"
              className="inline-flex items-center gap-1.5 px-3.5 py-3 text-sm text-muted transition-colors hover:text-accent"
            >
              See the framework
              <ChevronDown size={14} />
            </a>
          </div>

          <div className="mt-8 flex items-center gap-3 text-[13px] text-muted-2">
            <Lock size={13} />
            <span>Free during beta · auth and account creation coming soon</span>
          </div>
        </div>

        <div className="relative flex justify-end">
          <span className="absolute -top-8 left-2 font-mono text-[11px] tracking-[0.04em] text-muted-2">
            sample · dashboard.priority
          </span>

          <article className="relative w-full max-w-[440px] rounded-2xl bg-priority-bg p-7 shadow-[var(--priority-shadow)] outline outline-1 outline-[rgba(194,65,12,0.15)] -outline-offset-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-priority-accent">
                {PRIMARY.eyebrow}
              </span>
              <span className="font-mono text-[11px] text-priority-muted">1 of 8</span>
            </div>

            <h2
              className="mt-3 font-semibold tracking-[-0.02em] text-priority-fg"
              style={{ fontSize: "26px", lineHeight: 1.15 }}
            >
              {PRIMARY.title}
            </h2>
            <p className="mt-3 text-[15px] leading-[1.55] text-priority-fg/85">
              {PRIMARY.description}
            </p>

            <div
              className="mt-5 rounded-lg px-3.5 py-3 text-[13px] leading-[1.5] text-priority-muted"
              style={{ background: "rgba(194,65,12,0.06)" }}
            >
              <strong className="font-semibold text-priority-fg">Why: </strong>
              {PRIMARY.rationale}
            </div>
          </article>

          <div className="pointer-events-none absolute -bottom-4 right-5 grid w-[calc(100%-40px)] translate-y-full gap-2">
            <DimmedNext rank={2} title="Pay off your credit-card balance" />
            <DimmedNext rank={3} title="Grow your emergency fund to 3 to 6 months" />
          </div>
        </div>
      </div>
    </section>
  );
}

function DimmedNext({ rank, title }: { rank: number; title: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
      style={{ opacity: 0.55 - (rank - 2) * 0.15 }}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface-2 text-xs font-medium tabular-nums text-muted">
        {rank}
      </span>
      <span className="text-sm text-muted">{title}</span>
    </div>
  );
}
