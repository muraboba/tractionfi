import { THRESHOLDS } from '../constants'
import type { RuleContext, RuleOutput } from '../types'

export function phase5Retirement(ctx: RuleContext): RuleOutput {
  const { annualGrossIncome, userData } = ctx
  const { paycheck } = userData

  // Annual retirement contribution from paycheck-tracked 401(k):
  //   - employee projected contribution
  //   - employer match (estimated as match% of salary, capped at what user is actually contributing)
  const annualEmployeeContribution = paycheck.projected401kContribution
  const effectiveMatchPct = paycheck.employerOffers401kMatch
    ? Math.min(paycheck.contribution401kPercentage, paycheck.employerMatchPercentage)
    : 0
  const annualEmployerContribution = (effectiveMatchPct / 100) * annualGrossIncome
  const totalRetirementContribution = annualEmployeeContribution + annualEmployerContribution

  const currentRate = annualGrossIncome > 0 ? totalRetirementContribution / annualGrossIncome : 0
  const isComplete = currentRate >= THRESHOLDS.RETIREMENT_SAVINGS_RATE

  const targetAnnualContribution = THRESHOLDS.RETIREMENT_SAVINGS_RATE * annualGrossIncome
  const annualGap = Math.max(0, targetAnnualContribution - totalRetirementContribution)

  return {
    rawStatus: isComplete ? 'completed' : 'needs_action',
    milestone: {
      id: 'retirement_15_percent',
      phase: 5,
      title: 'Save at least 15% of pre-tax income for retirement',
      description: isComplete
        ? `You are saving ${(currentRate * 100).toFixed(1)}% of your pre-tax income for retirement, meeting the 15% target.`
        : `You are saving ${(currentRate * 100).toFixed(1)}% of pre-tax income for retirement. Increase contributions by ~$${annualGap.toFixed(0)}/year (across 401(k), IRA, or — if no tax-advantaged room — a taxable account) to reach the 15% target. ${userData.isSelfEmployed ? 'As a self-employed worker, consider an Individual 401(k), SEP-IRA, or SIMPLE IRA.' : ''}`.trim(),
      rationale:
        'Saving 15% of pre-tax income through your career generally produces enough to retire comfortably at a standard age. Below that, you risk under-saving; above that, you accelerate toward earlier optionality.',
      data: {
        currentRate,
        targetRate: THRESHOLDS.RETIREMENT_SAVINGS_RATE,
        annualEmployeeContribution,
        annualEmployerContribution,
        totalRetirementContribution,
        targetAnnualContribution,
        annualGap,
        isSelfEmployed: userData.isSelfEmployed ?? false,
      },
    },
  }
}
