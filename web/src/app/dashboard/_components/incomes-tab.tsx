'use client'

import { Trash2 } from 'lucide-react'

import type { CurrentBlob, Frequency, IncomeEntry } from '@tractionfi/engine'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  blob: CurrentBlob
  update: (mutator: (b: CurrentBlob) => CurrentBlob) => void
}

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
]

function parseMoney(raw: string): number {
  if (raw === '') return 0
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) ? n : 0
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

const selectClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm'

export function IncomesTab({ blob, update }: Props) {
  const incomes = blob.userData.incomes

  const updateRow = (id: string, patch: Partial<IncomeEntry>) => {
    update((b) => ({
      ...b,
      userData: {
        ...b.userData,
        incomes: b.userData.incomes.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      },
    }))
  }

  const removeRow = (id: string) => {
    update((b) => ({
      ...b,
      userData: {
        ...b.userData,
        incomes: b.userData.incomes.filter((i) => i.id !== id),
      },
    }))
  }

  const addRow = () => {
    const entry: IncomeEntry = {
      id: newId(),
      name: '',
      amount: 0,
      frequency: 'monthly',
    }
    update((b) => ({
      ...b,
      userData: { ...b.userData, incomes: [...b.userData.incomes, entry] },
    }))
  }

  return (
    <div className="space-y-4 p-6">
      <p className="text-sm text-muted-foreground">
        Income beyond your primary paycheck — side gigs, rental income, dividends, etc.
      </p>

      {incomes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No additional income sources.</p>
      ) : (
        <ul className="space-y-3">
          {incomes.map((i) => (
            <li
              key={i.id}
              className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-end"
            >
              <div className="space-y-1.5">
                <Label htmlFor={`income-name-${i.id}`}>Source</Label>
                <Input
                  id={`income-name-${i.id}`}
                  value={i.name}
                  placeholder="e.g. Freelance"
                  onChange={(ev) => updateRow(i.id, { name: ev.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`income-amount-${i.id}`}>Amount</Label>
                <Input
                  id={`income-amount-${i.id}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={i.amount === 0 ? '' : i.amount}
                  placeholder="0.00"
                  onChange={(ev) =>
                    updateRow(i.id, { amount: parseMoney(ev.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`income-freq-${i.id}`}>Frequency</Label>
                <select
                  id={`income-freq-${i.id}`}
                  value={i.frequency}
                  onChange={(ev) =>
                    updateRow(i.id, { frequency: ev.target.value as Frequency })
                  }
                  className={selectClass}
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${i.name || 'income'}`}
                onClick={() => removeRow(i.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        + Add income source
      </Button>
    </div>
  )
}
