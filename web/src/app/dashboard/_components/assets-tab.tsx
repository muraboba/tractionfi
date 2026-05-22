'use client'

import { Trash2 } from 'lucide-react'

import type {
  AssetCategory,
  AssetEntry,
  CurrentBlob,
} from '@tractionfi/engine'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  blob: CurrentBlob
  update: (mutator: (b: CurrentBlob) => CurrentBlob) => void
}

const CATEGORY_OPTIONS: { value: AssetCategory; label: string }[] = [
  { value: 'cash', label: 'Cash / savings' },
  { value: 'investments', label: 'Investments (taxable)' },
  { value: 'retirement', label: 'Retirement (401k / IRA)' },
  { value: 'property', label: 'Property' },
  { value: 'vehicle', label: 'Vehicle' },
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

export function AssetsTab({ blob, update }: Props) {
  const assets = blob.userData.assets

  const updateRow = (id: string, patch: Partial<AssetEntry>) => {
    update((b) => ({
      ...b,
      userData: {
        ...b.userData,
        assets: b.userData.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      },
    }))
  }

  const removeRow = (id: string) => {
    update((b) => ({
      ...b,
      userData: {
        ...b.userData,
        assets: b.userData.assets.filter((a) => a.id !== id),
      },
    }))
  }

  const addRow = () => {
    const entry: AssetEntry = {
      id: newId(),
      name: '',
      value: 0,
      category: 'cash',
      isEmergencyFund: false,
    }
    update((b) => ({
      ...b,
      userData: { ...b.userData, assets: [...b.userData.assets, entry] },
    }))
  }

  return (
    <div className="space-y-4 p-6">
      {assets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No assets yet. Add cash, investments, retirement accounts, etc.
        </p>
      ) : (
        <ul className="space-y-3">
          {assets.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.5fr_1fr_1.2fr_auto] md:items-end">
                <div className="space-y-1.5">
                  <Label htmlFor={`asset-name-${a.id}`}>Name</Label>
                  <Input
                    id={`asset-name-${a.id}`}
                    value={a.name}
                    placeholder="e.g. Chase savings"
                    onChange={(ev) => updateRow(a.id, { name: ev.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`asset-value-${a.id}`}>Value</Label>
                  <Input
                    id={`asset-value-${a.id}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={a.value === 0 ? '' : a.value}
                    placeholder="0.00"
                    onChange={(ev) =>
                      updateRow(a.id, { value: parseMoney(ev.target.value) })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`asset-cat-${a.id}`}>Category</Label>
                  <select
                    id={`asset-cat-${a.id}`}
                    value={a.category}
                    onChange={(ev) =>
                      updateRow(a.id, { category: ev.target.value as AssetCategory })
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
                  aria-label={`Remove ${a.name || 'asset'}`}
                  onClick={() => removeRow(a.id)}
                >
                  <Trash2 />
                </Button>
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                <Checkbox
                  id={`asset-ef-${a.id}`}
                  checked={a.isEmergencyFund}
                  onCheckedChange={(checked) =>
                    updateRow(a.id, { isEmergencyFund: checked === true })
                  }
                />
                <Label htmlFor={`asset-ef-${a.id}`} className="cursor-pointer text-sm">
                  This is part of my emergency fund
                </Label>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        + Add asset
      </Button>

      <p className="text-xs text-muted-foreground">
        Only assets you explicitly mark as emergency fund count toward that
        milestone. Name matching is not used.
      </p>
    </div>
  )
}
