'use client'

import { Trash2 } from 'lucide-react'

import type {
  CurrentBlob,
  DebtCategory,
  DebtEntry,
} from '@tractionfi/engine'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  blob: CurrentBlob
  update: (mutator: (b: CurrentBlob) => CurrentBlob) => void
}

const CATEGORY_OPTIONS: { value: DebtCategory; label: string }[] = [
  { value: 'credit-card', label: 'Credit card' },
  { value: 'student-loan', label: 'Student loan' },
  { value: 'auto-loan', label: 'Auto loan' },
  { value: 'personal-loan', label: 'Personal loan' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'other', label: 'Other' },
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

export function DebtsTab({ blob, update }: Props) {
  const debts = blob.userData.debts

  const updateRow = (id: string, patch: Partial<DebtEntry>) => {
    update((b) => ({
      ...b,
      userData: {
        ...b.userData,
        debts: b.userData.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      },
    }))
  }

  const removeRow = (id: string) => {
    update((b) => ({
      ...b,
      userData: {
        ...b.userData,
        debts: b.userData.debts.filter((d) => d.id !== id),
      },
    }))
  }

  const addRow = () => {
    const entry: DebtEntry = {
      id: newId(),
      name: '',
      balance: 0,
      interestRate: 0,
      minimumPayment: 0,
      category: 'credit-card',
    }
    update((b) => ({
      ...b,
      userData: { ...b.userData, debts: [...b.userData.debts, entry] },
    }))
  }

  return (
    <div className="space-y-4 p-6">
      {debts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No debts. Add credit cards, loans, or other balances.
        </p>
      ) : (
        <ul className="space-y-3">
          {debts.map((d) => (
            <li
              key={d.id}
              className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-[1.4fr_1fr_0.8fr_1fr_1.2fr_auto] md:items-end"
            >
              <div className="space-y-1.5">
                <Label htmlFor={`debt-name-${d.id}`}>Name</Label>
                <Input
                  id={`debt-name-${d.id}`}
                  value={d.name}
                  placeholder="e.g. Chase Sapphire"
                  onChange={(ev) => updateRow(d.id, { name: ev.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`debt-balance-${d.id}`}>Balance</Label>
                <Input
                  id={`debt-balance-${d.id}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={d.balance === 0 ? '' : d.balance}
                  placeholder="0.00"
                  onChange={(ev) =>
                    updateRow(d.id, { balance: parseMoney(ev.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`debt-apr-${d.id}`}>APR %</Label>
                <Input
                  id={`debt-apr-${d.id}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="0.01"
                  value={d.interestRate === 0 ? '' : d.interestRate}
                  placeholder="0.00"
                  onChange={(ev) =>
                    updateRow(d.id, { interestRate: parseMoney(ev.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`debt-min-${d.id}`}>Min payment</Label>
                <Input
                  id={`debt-min-${d.id}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={d.minimumPayment === 0 ? '' : d.minimumPayment}
                  placeholder="0.00"
                  onChange={(ev) =>
                    updateRow(d.id, { minimumPayment: parseMoney(ev.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`debt-cat-${d.id}`}>Category</Label>
                <select
                  id={`debt-cat-${d.id}`}
                  value={d.category}
                  onChange={(ev) =>
                    updateRow(d.id, { category: ev.target.value as DebtCategory })
                  }
                  className={selectClass}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
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
                aria-label={`Remove ${d.name || 'debt'}`}
                onClick={() => removeRow(d.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        + Add debt
      </Button>

      <p className="text-xs text-muted-foreground">
        Mortgages are excluded from the debt-priority milestones. High-interest
        debt = APR ≥ 10%; moderate = 4–10%.
      </p>
    </div>
  )
}
