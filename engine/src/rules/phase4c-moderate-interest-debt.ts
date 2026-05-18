import { THRESHOLDS } from '../constants'
import type { DebtEntry, RuleContext, RuleOutput } from '../types'

export function isModerateInterest(debt: DebtEntry): boolean {
  if (debt.category === 'mortgage') return false
  return (
    debt.interestRate >= THRESHOLDS.MODERATE_INTEREST_APR &&
    debt.interestRate < THRESHOLDS.HIGH_INTEREST_APR
  )
}

export function phase4cModerateInterestDebt(ctx: RuleContext): RuleOutput {
  const debts = ctx.userData.debts.filter(isModerateInterest)
  const hasAny = debts.length > 0
  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0)

  return {
    rawStatus: hasAny ? 'needs_action' : 'completed',
    milestone: {
      id: 'moderate_interest_debt',
      phase: 4,
      title: 'Pay off moderate-interest debt',
      description: hasAny
        ? `You have $${totalBalance.toFixed(0)} in debt with APR between ${THRESHOLDS.MODERATE_INTEREST_APR}% and ${THRESHOLDS.HIGH_INTEREST_APR}% (excluding mortgage). Apply Avalanche or Snowball to clear it.`
        : `You have no debt in the ${THRESHOLDS.MODERATE_INTEREST_APR}–${THRESHOLDS.HIGH_INTEREST_APR}% APR range. Skip to retirement savings.`,
      rationale:
        'Moderate-interest debt is less urgent than high-interest debt, but paying it down still yields a guaranteed return equal to the APR. At this stage in the plan, you have a full emergency fund and are capturing your employer match, so accelerating payoff is a sound use of additional cash.',
      data: {
        thresholdLow: THRESHOLDS.MODERATE_INTEREST_APR,
        thresholdHigh: THRESHOLDS.HIGH_INTEREST_APR,
        debts,
        totalBalance,
      },
    },
  }
}
