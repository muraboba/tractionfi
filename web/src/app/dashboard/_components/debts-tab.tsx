'use client'

import type { CurrentBlob } from '@tractionfi/engine'

type Props = {
  blob: CurrentBlob
  update: (mutator: (b: CurrentBlob) => CurrentBlob) => void
}

export function DebtsTab(_props: Props) {
  return (
    <div className="p-6 text-sm text-muted-foreground">
      Debts — coming in Step 5.4.
    </div>
  )
}
