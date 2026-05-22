'use client'

export function OfflineBanner() {
  return (
    <div
      role="status"
      className="mb-4 rounded-xl border border-[var(--danger-fg)]/20 bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger-fg)]"
    >
      Saving is paused — we couldn&apos;t reach the server. Your changes are
      kept locally and will retry on the next edit.
    </div>
  )
}
