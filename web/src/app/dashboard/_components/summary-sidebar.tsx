'use client'

import type { EngineOutput } from '@tractionfi/engine'

type Props = {
  metrics: EngineOutput['metrics']
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function SummarySidebar({ metrics }: Props) {
  const cashFlowTone =
    metrics.monthlyCashFlow > 0
      ? 'text-[var(--success-fg)]'
      : metrics.monthlyCashFlow < 0
        ? 'text-[var(--danger-fg)]'
        : 'text-foreground'

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Summary
      </h2>
      <Row label="Monthly income" value={formatUSD(metrics.monthlyIncome)} />
      <Row label="Monthly expenses" value={formatUSD(metrics.monthlyExpenses)} />
      <Row
        label="Monthly cash flow"
        value={formatUSD(metrics.monthlyCashFlow)}
        valueClass={cashFlowTone}
      />
      <Row label="Net worth" value={formatUSD(metrics.netWorth)} />
      <Row label="Emergency fund" value={formatUSD(metrics.emergencyFundBalance)} />
      <Row label="Annual gross" value={formatUSD(metrics.annualGrossIncome)} />
    </div>
  )
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tracking-tight ${valueClass ?? 'text-foreground'}`}>
        {value}
      </p>
    </div>
  )
}
