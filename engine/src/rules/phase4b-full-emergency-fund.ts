import { THRESHOLDS } from '../constants'
import type { RuleContext, RuleOutput } from '../types'

export function phase4bFullEmergencyFund(ctx: RuleContext): RuleOutput {
  const { monthlyExpenses, emergencyFundBalance } = ctx
  const target = monthlyExpenses * THRESHOLDS.FULL_EMERGENCY_FUND_MONTHS
  const progress = target > 0 ? Math.min(1, emergencyFundBalance / target) : 0
  const isComplete = monthlyExpenses > 0 && emergencyFundBalance >= target

  return {
    rawStatus: isComplete ? 'completed' : 'needs_action',
    milestone: {
      id: 'full_emergency_fund',
      phase: 4,
      title: 'Grow your emergency fund to 3–6 months of expenses',
      description: `Expand your emergency fund to cover ${THRESHOLDS.FULL_EMERGENCY_FUND_MONTHS} months of expenses ($${target.toFixed(0)}).`,
      rationale:
        'A full emergency fund is your insurance against a major life event (job loss, medical issue, home repair) that the starter fund cannot cover. Sized at 3–6 months of expenses based on income stability and family situation.',
      data: {
        currentAmount: emergencyFundBalance,
        targetAmount: target,
        monthlyExpenses,
        targetMonths: THRESHOLDS.FULL_EMERGENCY_FUND_MONTHS,
        progress,
      },
    },
  }
}
