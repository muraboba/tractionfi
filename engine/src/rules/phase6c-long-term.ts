import type { RuleContext, RuleOutput } from '../types'

export function phase6cLongTerm(ctx: RuleContext): RuleOutput {
  const goal = ctx.userData.longTermGoal ?? 'standard_retirement'

  let description: string
  switch (goal) {
    case 'early_retirement':
      description =
        'Max your 401(k)/403(b)/employer plan, evaluate the Mega Backdoor Roth if your plan supports it, then route remaining surplus to a taxable brokerage account. Asset allocation should reflect the longer horizon and higher savings rate required.'
      break
    case 'near_term_goal':
      description =
        'For goals within 3–5 years (home down payment, vehicle, vacation, mortgage paydown), keep funds in savings or short-duration bond funds. For goals beyond 5 years, a conservative stock/bond mix is appropriate.'
      break
    case 'standard_retirement':
    default:
      description =
        'You have completed the structured part of the plan. Continue maxing tax-advantaged accounts, maintain your savings rate, and revisit allocation periodically.'
      break
  }

  return {
    rawStatus: 'needs_action',
    milestone: {
      id: 'long_term_goals',
      phase: 6,
      title: 'Long-term goals and advanced methods',
      description,
      rationale:
        'Once the structured phases are complete, the flowchart hands off to user-specific goal planning. The right strategy depends on whether you prioritize early retirement, near-term goals, or standard retirement timing.',
      data: { goal },
    },
  }
}
