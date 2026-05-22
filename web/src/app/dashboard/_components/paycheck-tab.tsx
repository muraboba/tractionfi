'use client'

import type { CurrentBlob } from '@tractionfi/engine'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  blob: CurrentBlob
  update: (mutator: (b: CurrentBlob) => CurrentBlob) => void
}

export function PaycheckTab({ blob, update }: Props) {
  const grossAmount = blob.userData.paycheck.grossAmount

  return (
    <div className="space-y-4 p-6">
      <div className="space-y-2 max-w-xs">
        <Label htmlFor="paycheck-gross">Gross paycheck amount</Label>
        <Input
          id="paycheck-gross"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={grossAmount === 0 ? '' : grossAmount}
          placeholder="0.00"
          onChange={(e) => {
            const raw = e.target.value
            const next = raw === '' ? 0 : Number.parseFloat(raw)
            const safe = Number.isFinite(next) ? next : 0
            update((b) => ({
              ...b,
              userData: {
                ...b.userData,
                paycheck: { ...b.userData.paycheck, grossAmount: safe },
              },
            }))
          }}
        />
        <p className="text-xs text-muted-foreground">
          One paycheck before tax. Pay frequency editor coming in the full Step 5.4 fan-out.
        </p>
      </div>
    </div>
  )
}
