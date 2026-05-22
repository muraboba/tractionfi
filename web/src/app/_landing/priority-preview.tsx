"use client";

import { useState } from "react";
import { PRIORITIES, type Priority } from "./data";
import { ArrowRight } from "./icons";

const SCENARIOS = [
  { id: "starter-ef", label: "No emergency fund", sub: "$48k income Â· $0 saved" },
  { id: "401k-match", label: "Missing 401(k) match", sub: "$92k income Â· $4k saved" },
  { id: "high-int-debt", label: "Carrying credit-card debt", sub: "$72k income Â· 19% APR" },
  { id: "full-ef", label: "Topping up reserves", sub: "$110k income Â· 1mo runway" },
] as const;

export default function PriorityPreview() {
  const [activeId, setActiveId] = useState<string>(SCENARIOS[0].id);
  const priority = PRIORITIES.find((p) => p.id === activeId) ?? PRIORITIES[0];

  return (
    <section id="preview" className="border-t border-border py-24">
      <div className="mx-auto grid max-w-[1024px] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Sample Â· live preview
          </div>
          <h2
            className="mt-4 font-semibold tracking-[-0.02em] text-balance"
            style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
          >
            The card you&apos;ll open the app for.
          </h2>
          <p className="mt-5 max-w-[44ch] text-[16px] leading-[1.6] text-muted-foreground">
            The Priority Card is the only warm surface in the product. It changes as your inputs
            change, but only one shows at a time. Pick a scenario to see what the engine returns.
          </p>

          <ul className="mt-8 grid list-none gap-2 p-0">
            {SCENARIOS.map((s) => {
              const active = s.id === activeId;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(s.id)}
                    aria-pressed={active}
                    className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-lg border px-4 py-3.5 text-left transition-colors ${
                      active
                        ? "border-[rgba(139,124,255,0.4)] bg-surface-2"
                        : "border-border bg-surface hover:border-border-strong hover:bg-surface-2"
                    }`}
                  >
                    <span
                      className={`relative inline-block h-[18px] w-[18px] rounded-full border-2 ${
                        active ? "border-brand bg-brand" : "border-border-strong bg-transparent"
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-[3px] rounded-full bg-background" />
                      )}
                    </span>
                    <span className="grid">
                      <span className="text-sm font-medium text-foreground">{s.label}</span>
                      <span className="mt-0.5 text-xs tabular-nums text-muted-2">{s.sub}</span>
                    </span>
                    <ArrowRight
                      size={14}
                      className={active ? "text-brand" : "text-muted-2"}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <PreviewPriorityCard priority={priority} />
      </div>
    </section>
  );
}

function PreviewPriorityCard({ priority }: { priority: Priority }) {
  return (
    <div className="relative flex justify-center py-10">
      <div className="absolute left-0 right-0 top-0 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-muted-2">
        <span className="flex-none">engine.decide()</span>
        <span className="h-px flex-1 bg-border" />
        <span className="flex-none text-brand">1 priority returned</span>
      </div>

      <article
        key={priority.id}
        className="w-full max-w-[520px] rounded-2xl bg-priority-bg p-8 shadow-[var(--priority-shadow)] outline outline-1 outline-[rgba(194,65,12,0.15)] -outline-offset-1"
      >
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-priority-accent">
          {priority.eyebrow}
        </div>
        <h3
          className="mt-2.5 font-semibold tracking-[-0.02em] text-balance text-priority-fg"
          style={{ fontSize: "30px", lineHeight: 1.15 }}
        >
          {priority.title}
        </h3>
        <p className="mt-3.5 text-[16px] leading-[1.55] text-priority-fg/85">
          {priority.description}
        </p>

        <div
          className="mt-5 rounded-lg px-4 py-3.5 text-sm leading-[1.5] text-priority-muted"
          style={{ background: "rgba(194,65,12,0.06)" }}
        >
          <strong className="font-semibold text-priority-fg">Why: </strong>
          {priority.rationale}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-priority-accent px-5 py-3 text-sm font-medium text-priority-bg transition-colors hover:bg-[#A8370A]"
          >
            Show me how
            <ArrowRight size={14} />
          </button>
        </div>
      </article>
    </div>
  );
}
