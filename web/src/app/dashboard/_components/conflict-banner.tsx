'use client'

import type { CurrentBlob } from '@tractionfi/engine'

type Props = {
  conflictBlob: CurrentBlob
  conflictVersion: number
  onAcceptServer: () => void
  onKeepMine: () => void
}

export function ConflictBanner({ conflictVersion, onAcceptServer, onKeepMine }: Props) {
  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-[var(--warning-fg)]/20 bg-[var(--warning-bg)] p-4"
    >
      <h2 className="text-sm font-semibold text-[var(--warning-fg)]">
        Your data was updated in another tab
      </h2>
      <p className="mt-1 text-xs text-[var(--warning-fg)]/90">
        Server is at version {conflictVersion}. Choose which copy to keep —
        accepting the server will discard your unsaved changes.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onAcceptServer}
          className="rounded-lg border border-[var(--warning-fg)]/30 bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:border-border-strong"
        >
          Accept server
        </button>
        <button
          type="button"
          onClick={onKeepMine}
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:bg-brand-hover"
        >
          Keep mine
        </button>
      </div>
    </div>
  )
}
