import { THRESHOLDS } from '../constants'
import type { DebtEntry, RuleContext, RuleOutput } from '../types'

export function isHighInterest(debt: DebtEntry): boolean {
  if (debt.category === 'mortgage') return false
  return debt.interestRate >= THRESHOLDS.HIGH_INTEREST_APR
}

export function phase4aHighInterestDebt(ctx: RuleContext): RuleOutput {
  const highInterestDebts = ctx.userData.debts.filter(isHighInterest)
  const hasAny = highInterestDebts.length > 0

  const totalBalance = highInterestDebts.reduce((sum, d) => sum + d.balance, 0)
  const highest = highInterestDebts.reduce<DebtEntry | null>(
    (acc, d) => (acc === null || d.interestRate > acc.interestRate ? d : acc),
    null,
  )

  return {
    rawStatus: hasAny ? 'needs_action' : 'completed',
    milestone: {
      id: 'high_interest_debt',
      phase: 4,
      title: 'Pay off high-interest debt',
      description: hasAny
        ? `You have $${totalBalance.toFixed(0)} in debt with APR at or above ${THRESHOLDS.HIGH_INTEREST_APR}%. Attack this with either the Avalanche method (highest rate first) or the Snowball method (smallest balance first).`
        : `You have no debt at or above ${THRESHOLDS.HIGH_INTEREST_APR}% APR. Skip to the next step.`,
      rationale: `Debt above ${THRESHOLDS.HIGH_INTEREST_APR}% APR compounds faster than almost any investment return you can reliably earn. Eliminating it is a guaranteed return equal to the APR — risk-free.`,
      data: {
        threshold: THRESHOLDS.HIGH_INTEREST_APR,
        debts: highInterestDebts,
        totalBalance,
        highestRateDebt: highest,
      },
    },
  }
}
