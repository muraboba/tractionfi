'use client'

import type { CurrentBlob, EngineOutput } from '@tractionfi/engine'

type Props = {
  output: EngineOutput
  blob: CurrentBlob
  update: (mutator: (b: CurrentBlob) => CurrentBlob) => void
}

export function RecommendationsTab({ output }: Props) {
  const { currentPriority, blockers, milestones } = output
  const blocked = blockers.length > 0

  return (
    <div className="space-y-6 p-6 text-sm">
      <p className="text-muted-foreground">
        Full Recommendations UI lands in Step 5.5. This is a smoke-test view.
      </p>

      {blocked ? (
        <section className="rounded-xl border border-[var(--danger-fg)]/20 bg-[var(--danger-bg)] p-4">
          <h2 className="text-sm font-semibold text-[var(--danger-fg)]">
            Complete your budget first ({blockers.length} blocker
            {blockers.length === 1 ? '' : 's'})
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--danger-fg)]/90">
            {blockers.map((b) => (
              <li key={b.code}>{b.message}</li>
            ))}
          </ul>
        </section>
      ) : currentPriority ? (
        <section className="rounded-2xl bg-priority-bg p-6 shadow-[var(--priority-shadow)] ring-1 ring-priority-accent/15">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-priority-accent">
            Your next step
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-priority-fg">
            {currentPriority.title}
          </h2>
          <p className="mt-3 text-priority-fg/90">{currentPriority.description}</p>
          <p className="mt-3 text-priority-muted">
            <strong className="text-priority-fg">Why: </strong>
            {currentPriority.rationale}
          </p>
        </section>
      ) : null}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Roadmap
        </h3>
        <ol className="mt-2 space-y-1 text-xs">
          {milestones.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 rounded border border-border px-3 py-2">
              <span className="text-foreground">{m.title}</span>
              <span className="text-muted-foreground">{m.status}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
