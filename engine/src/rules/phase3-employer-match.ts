import { payPeriodsPerYear } from '../frequency'
import type { RuleContext, RuleOutput } from '../types'

export function phase3EmployerMatch(ctx: RuleContext): RuleOutput {
  const { paycheck } = ctx.userData

  if (!paycheck.employerOffers401kMatch || paycheck.employerMatchPercentage <= 0) {
    return {
      rawStatus: 'not_applicable',
      milestone: {
        id: 'employer_match',
        phase: 3,
        title: 'Capture your full employer 401(k) match',
        description: 'Your employer does not offer a retirement match, so this step is not applicable.',
        rationale:
          'An employer match is essentially a guaranteed return on your contribution. If yours does not offer one, you skip directly to higher-interest debt and the rest of the plan.',
        data: { applicable: false },
      },
    }
  }

  const currentPct = paycheck.contribution401kPercentage
  const matchPct = paycheck.employerMatchPercentage
  const isComplete = currentPct >= matchPct

  const annualSalary = paycheck.grossAmount * payPeriodsPerYear(paycheck.payFrequency)
  const matchPctGap = Math.max(0, matchPct - currentPct)
  const annualLostMatch = (matchPctGap / 100) * annualSalary
  const perPaycheckIncrease = (matchPctGap / 100) * paycheck.grossAmount

  return {
    rawStatus: isComplete ? 'completed' : 'needs_action',
    milestone: {
      id: 'employer_match',
      phase: 3,
      title: 'Capture your full employer 401(k) match',
      description: isComplete
        ? `You are contributing ${currentPct.toFixed(2)}%, which captures the full ${matchPct.toFixed(2)}% match.`
        : `Increase your 401(k) contribution from ${currentPct.toFixed(2)}% to at least ${matchPct.toFixed(2)}% to capture the full employer match.`,
      rationale:
        'Your employer match is free money. Failing to contribute enough to capture it has a guaranteed negative return — every percentage point below the match is income you have already earned but are choosing not to keep.',
      data: {
        applicable: true,
        currentContributionPercentage: currentPct,
        employerMatchPercentage: matchPct,
        annualLostMatch,
        perPaycheckIncrease,
        annualSalary,
      },
    },
  }
}
