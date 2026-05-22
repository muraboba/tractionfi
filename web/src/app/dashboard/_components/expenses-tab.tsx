'use client'

import { Trash2 } from 'lucide-react'

import type {
  CurrentBlob,
  ExpenseCategory,
  ExpenseEntry,
  Frequency,
} from '@tractionfi/engine'
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

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: 'essential', label: 'Essential' },
  { value: 'discretionary', label: 'Discretionary' },
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

export function ExpensesTab({ blob, update }: Props) {
  const expenses = blob.userData.expenses

  const updateRow = (id: string, patch: Partial<ExpenseEntry>) => {
    update((b) => ({
      ...b,
      userData: {
        ...b.userData,
        expenses: b.userData.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      },
    }))
  }

  const removeRow = (id: string) => {
    update((b) => ({
      ...b,
      userData: {
        ...b.userData,
        expenses: b.userData.expenses.filter((e) => e.id !== id),
      },
    }))
  }

  const addRow = () => {
    const entry: ExpenseEntry = {
      id: newId(),
      name: '',
      amount: 0,
      frequency: 'monthly',
      category: 'essential',
    }
    update((b) => ({
      ...b,
      userData: { ...b.userData, expenses: [...b.userData.expenses, entry] },
    }))
  }

  return (
    <div className="space-y-4 p-6">
      {expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No expenses yet. Add your first one to unblock recommendations.
        </p>
      ) : (
        <ul className="space-y-3">
          {expenses.map((e) => (
            <li
              key={e.id}
              className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-end"
            >
              <div className="space-y-1.5">
                <Label htmlFor={`expense-name-${e.id}`}>Name</Label>
                <Input
                  id={`expense-name-${e.id}`}
                  value={e.name}
                  placeholder="e.g. Rent"
                  onChange={(ev) => updateRow(e.id, { name: ev.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`expense-amount-${e.id}`}>Amount</Label>
                <Input
                  id={`expense-amount-${e.id}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={e.amount === 0 ? '' : e.amount}
                  placeholder="0.00"
                  onChange={(ev) =>
                    updateRow(e.id, { amount: parseMoney(ev.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`expense-freq-${e.id}`}>Frequency</Label>
                <select
                  id={`expense-freq-${e.id}`}
                  value={e.frequency}
                  onChange={(ev) =>
                    updateRow(e.id, { frequency: ev.target.value as Frequency })
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
              <div className="space-y-1.5">
                <Label htmlFor={`expense-cat-${e.id}`}>Category</Label>
                <select
                  id={`expense-cat-${e.id}`}
                  value={e.category}
                  onChange={(ev) =>
                    updateRow(e.id, { category: ev.target.value as ExpenseCategory })
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
                aria-label={`Remove ${e.name || 'expense'}`}
                onClick={() => removeRow(e.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        + Add expense
      </Button>
    </div>
  )
}
