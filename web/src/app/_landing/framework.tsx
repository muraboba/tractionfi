import { FRAMEWORK_PHASES, type FrameworkPhase } from "./data";
import { Check } from "./icons";

const CURRENT_PHASE = 3;

export default function Framework() {
  return (
    <section id="framework" className="border-t border-border py-24">
      <div className="mx-auto grid max-w-[1024px] grid-cols-1 items-start gap-12 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
        <div className="lg:sticky lg:top-24">
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            The framework
          </div>
          <h2
            className="mt-4 font-semibold tracking-[-0.02em] text-balance"
            style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
          >
            Eight phases.
            <br />
            <span className="text-muted-foreground">In strict order.</span>
          </h2>
          <p className="mt-5 max-w-[44ch] text-[16px] leading-[1.6] text-muted-foreground">
            TractionFI runs your money through the US Personal Income Spending Flowchart, the same
            framework used by financial educators to teach the right order of priorities. The
            engine finds the earliest phase you haven&apos;t completed and stops there.
          </p>

          <div className="mt-8 inline-flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_6px_var(--brand)]" />
            sample · earliest unfinished phase: {CURRENT_PHASE}
          </div>
        </div>

        <ol className="grid list-none gap-2 p-0">
          {FRAMEWORK_PHASES.map((p) => (
            <PhaseRow
              key={p.n}
              phase={p}
              state={p.n < CURRENT_PHASE ? "done" : p.n === CURRENT_PHASE ? "active" : "upcoming"}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

type PhaseState = "done" | "active" | "upcoming";

function PhaseRow({ phase, state }: { phase: FrameworkPhase; state: PhaseState }) {
  const palette = {
    done: {
      bg: "bg-surface",
      border: "border-border",
      title: "text-muted-foreground line-through decoration-muted-2",
      detail: "text-muted-2",
      chip: "bg-surface-2 border-border text-[var(--success-fg)]",
    },
    active: {
      bg: "bg-surface-2",
      border: "border-[rgba(139,124,255,0.4)]",
      title: "text-foreground",
      detail: "text-muted-foreground",
      chip: "bg-brand border-brand text-brand-foreground",
    },
    upcoming: {
      bg: "bg-surface",
      border: "border-border",
      title: "text-foreground",
      detail: "text-muted-foreground",
      chip: "bg-surface-2 border-border text-muted-foreground",
    },
  }[state];

  return (
    <li
      className={`grid grid-cols-[40px_1fr_auto] items-start gap-4 rounded-lg border px-5 py-[18px] transition-colors ${palette.bg} ${palette.border}`}
    >
      <span
        className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg border text-[13px] font-medium tabular-nums ${palette.chip}`}
      >
        {state === "done" ? <Check size={14} /> : phase.n}
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h3
            className={`m-0 text-[16px] font-semibold leading-[1.3] tracking-[-0.01em] ${palette.title}`}
          >
            {phase.title}
          </h3>
          {state === "active" && (
            <span className="rounded-full border border-[rgba(139,124,255,0.25)] bg-[rgba(139,124,255,0.10)] px-2 py-[3px] text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
              You are here
            </span>
          )}
        </div>
        <p className={`mt-1.5 max-w-[60ch] text-sm leading-[1.55] ${palette.detail}`}>
          {phase.detail}
        </p>
      </div>
      <span className="pt-2.5 font-mono text-[11px] tracking-[0.06em] text-muted-2">
        phase {String(phase.n).padStart(2, "0")}
      </span>
    </li>
  );
}
