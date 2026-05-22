'use client'

import type {
  Blocker,
  BlockerTab,
  CurrentBlob,
  EngineOutput,
  Milestone,
  MilestoneStatus,
} from '@tractionfi/engine'

import { Button } from '@/components/ui/button'

type Props = {
  output: EngineOutput
  blob: CurrentBlob
  update: (mutator: (b: CurrentBlob) => CurrentBlob) => void
  onNavigateToTab?: (tab: BlockerTab) => void
}

export function RecommendationsTab({ output, blob, update, onNavigateToTab }: Props) {
  if (output.currentPriority?.id === 'complete_budget') {
    return (
      <BlockedView
        milestone={output.currentPriority}
        blockers={output.blockers}
        onNavigateToTab={onNavigateToTab}
      />
    )
  }
  return <ActiveView output={output} blob={blob} update={update} />
}

function BlockedView({
  milestone,
  blockers,
  onNavigateToTab,
}: {
  milestone: Milestone
  blockers: Blocker[]
  onNavigateToTab?: (tab: BlockerTab) => void
}) {
  return (
    <div className="space-y-6 p-6">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Set up your budget to start
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{milestone.description}</p>

        <ul className="mt-5 space-y-2">
          {blockers.map((b) => (
            <li
              key={b.code}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm"
            >
              <span className="text-foreground">{b.message}</span>
              {onNavigateToTab ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 cursor-pointer"
                  onClick={() => onNavigateToTab(b.tab)}
                >
                  Go to {capitalize(b.tab)} →
                </Button>
              ) : (
                <a
                  href={`#tab-${b.tab}`}
                  className="shrink-0 rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-surface"
                >
                  Go to {capitalize(b.tab)} →
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function ActiveView({ output, blob, update }: { output: EngineOutput; blob: CurrentBlob; update: Props['update'] }) {
  const m = output.currentPriority
  if (!m) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          All milestones complete or skipped.
        </p>
      </div>
    )
  }

  const handleSkip = () => {
    if (typeof window !== 'undefined' && !window.confirm(`Skip "${m.title}"? You can revisit it later.`)) {
      return
    }
    update((b) => ({
      ...b,
      settings: {
        ...b.settings,
        skippedMilestones: [...b.settings.skippedMilestones, m.id],
      },
    }))
  }

  const handleRevisit = (id: string) => {
    update((b) => ({
      ...b,
      settings: {
        ...b.settings,
        skippedMilestones: b.settings.skippedMilestones.filter((s) => s !== id),
      },
    }))
  }

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-2xl bg-priority-bg p-6 shadow-[var(--priority-shadow)] ring-1 ring-priority-accent/15">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-priority-accent">
              Phase {m.phase} · Your next step
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-priority-fg">
              {m.title}
            </h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSkip}
            className="shrink-0 cursor-pointer border-priority-accent/30 bg-transparent text-priority-fg hover:bg-priority-accent/10"
          >
            Skip
          </Button>
        </div>

        <p className="mt-3 text-priority-fg/90">{m.description}</p>

        <MilestoneDataView data={m.data} />

        <details className="mt-4 text-sm text-priority-muted">
          <summary className="cursor-pointer text-priority-fg/80 hover:text-priority-fg">
            Why this matters
          </summary>
          <p className="mt-2 text-priority-fg/80">{m.rationale}</p>
        </details>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Roadmap
        </h3>
        <ol className="mt-3 space-y-1.5">
          {output.milestones.map((mm) => {
            const skipped = blob.settings.skippedMilestones.includes(mm.id)
            return (
              <li
                key={mm.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2 text-foreground">
                  <StatusPill status={mm.status} />
                  {mm.title}
                </span>
                {skipped ? (
                  <button
                    type="button"
                    onClick={() => handleRevisit(mm.id)}
                    className="cursor-pointer text-xs text-brand underline-offset-2 hover:underline"
                  >
                    Revisit
                  </button>
                ) : null}
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}

function StatusPill({ status }: { status: MilestoneStatus }) {
  const config: Record<MilestoneStatus, { glyph: string; tone: string; label: string }> = {
    completed: { glyph: '✓', tone: 'text-[var(--success-fg)]', label: 'completed' },
    active: { glyph: '●', tone: 'text-brand', label: 'active' },
    not_started: { glyph: '○', tone: 'text-muted-foreground', label: 'not started' },
    not_applicable: { glyph: '–', tone: 'text-muted-foreground', label: 'not applicable' },
    skipped: { glyph: '⤼', tone: 'text-muted-foreground', label: 'skipped' },
    blocked: { glyph: '⚙', tone: 'text-[var(--danger-fg)]', label: 'blocked' },
  }
  const c = config[status]
  return (
    <span
      aria-label={c.label}
      className={`inline-flex h-5 w-5 items-center justify-center text-xs ${c.tone}`}
    >
      {c.glyph}
    </span>
  )
}

const PROGRESS_KEYS = new Set(['progress'])
const MONEY_KEYS = new Set([
  'currentAmount',
  'targetAmount',
  'totalBalance',
  'monthlyExpenses',
  'annualEmployeeContribution',
  'annualEmployerContribution',
  'totalRetirementContribution',
])

function MilestoneDataView({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([k, v]) => {
    if (k === 'blockers') return false
    if (v === null || v === undefined) return false
    return typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string'
  })
  if (entries.length === 0) return null
  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-3">
          <dt className="text-priority-muted">{formatKey(k)}</dt>
          <dd className="text-priority-fg">{formatValue(k, v as number | string | boolean)}</dd>
        </div>
      ))}
    </dl>
  )
}

function formatKey(k: string): string {
  return k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}

function formatValue(k: string, v: number | string | boolean): string {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'string') return v
  if (PROGRESS_KEYS.has(k)) return `${Math.round(v * 100)}%`
  if (MONEY_KEYS.has(k)) return `$${v.toLocaleString()}`
  if (k.toLowerCase().includes('rate') || k.toLowerCase().includes('percentage')) {
    return `${v}%`
  }
  return v.toLocaleString()
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
