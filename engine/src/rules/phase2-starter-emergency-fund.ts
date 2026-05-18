import { THRESHOLDS } from '../constants'
import type { RuleContext, RuleOutput } from '../types'

export function phase2StarterEmergencyFund(ctx: RuleContext): RuleOutput {
  const { monthlyExpenses, emergencyFundBalance } = ctx
  const target = Math.max(THRESHOLDS.STARTER_EMERGENCY_FUND_MIN, monthlyExpenses)
  const progress = target > 0 ? Math.min(1, emergencyFundBalance / target) : 0
  const isComplete = emergencyFundBalance >= target

  return {
    rawStatus: isComplete ? 'completed' : 'needs_action',
    milestone: {
      id: 'starter_emergency_fund',
      phase: 2,
      title: 'Build a starter emergency fund',
      description: `Save the greater of $1,000 or one month of expenses ($${target.toFixed(0)}) in a savings or checking account.`,
      rationale:
        'An emergency fund prevents a single unexpected expense (car repair, medical bill, lost income) from forcing you into high-interest debt. The flowchart prioritizes this before tackling debt aggressively, because without it you will end up borrowing again the next time something breaks.',
      data: {
        currentAmount: emergencyFundBalance,
        targetAmount: target,
        monthlyExpenses,
        progress,
      },
    },
  }
}
