'use client'

import type { CurrentBlob, PayFrequency } from '@tractionfi/engine'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  blob: CurrentBlob
  update: (mutator: (b: CurrentBlob) => CurrentBlob) => void
}

const PAY_FREQUENCY_OPTIONS: { value: PayFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly (every 2 weeks)' },
  { value: 'semi-monthly', label: 'Semi-monthly (twice a month)' },
  { value: 'monthly', label: 'Monthly' },
]

function parseMoney(raw: string): number {
  if (raw === '') return 0
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) ? n : 0
}

export function PaycheckTab({ blob, update }: Props) {
  const p = blob.userData.paycheck

  const setPaycheck = <K extends keyof typeof p>(key: K, value: (typeof p)[K]) => {
    update((b) => ({
      ...b,
      userData: {
        ...b.userData,
        paycheck: { ...b.userData.paycheck, [key]: value },
      },
    }))
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="paycheck-gross">Gross paycheck amount</Label>
          <Input
            id="paycheck-gross"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={p.grossAmount === 0 ? '' : p.grossAmount}
            placeholder="0.00"
            onChange={(e) => setPaycheck('grossAmount', parseMoney(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Before tax, per paycheck.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paycheck-net">Net paycheck amount</Label>
          <Input
            id="paycheck-net"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={p.netAmount === 0 ? '' : p.netAmount}
            placeholder="0.00"
            onChange={(e) => setPaycheck('netAmount', parseMoney(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Take-home, per paycheck.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paycheck-frequency">Pay frequency</Label>
          <select
            id="paycheck-frequency"
            value={p.payFrequency}
            onChange={(e) => setPaycheck('payFrequency', e.target.value as PayFrequency)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          >
            {PAY_FREQUENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paycheck-401k">401(k) contribution per paycheck</Label>
          <Input
            id="paycheck-401k"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={p.contribution401k === 0 ? '' : p.contribution401k}
            placeholder="0.00"
            onChange={(e) => setPaycheck('contribution401k', parseMoney(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Dollar amount, not percent.</p>
        </div>
      </div>

      <div className="space-y-3 max-w-2xl">
        <div className="flex items-center gap-2">
          <Checkbox
            id="paycheck-employer-match"
            checked={p.employerOffers401kMatch}
            onCheckedChange={(checked) =>
              setPaycheck('employerOffers401kMatch', checked === true)
            }
          />
          <Label htmlFor="paycheck-employer-match" className="cursor-pointer">
            My employer offers a 401(k) match
          </Label>
        </div>

        {p.employerOffers401kMatch ? (
          <div className="space-y-2 max-w-xs pl-6">
            <Label htmlFor="paycheck-match-pct">Employer match (% of salary)</Label>
            <Input
              id="paycheck-match-pct"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.1"
              value={p.employerMatchPercentage === 0 ? '' : p.employerMatchPercentage}
              placeholder="e.g. 5"
              onChange={(e) =>
                setPaycheck('employerMatchPercentage', parseMoney(e.target.value))
              }
            />
            <p className="text-xs text-muted-foreground">
              Max % of your salary your employer will match.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
