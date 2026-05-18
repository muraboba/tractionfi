import type { RuleContext, RuleOutput } from '../types'

export function phase6bCollege(ctx: RuleContext): RuleOutput {
  if (!ctx.userData.hasCollegeBoundChildren) {
    return {
      rawStatus: 'not_applicable',
      milestone: {
        id: 'college_savings',
        phase: 6,
        title: 'Save for college (529 plan)',
        description: 'You have indicated you do not have children whose college expenses you want to help fund.',
        rationale:
          '529 plans offer tax-advantaged growth for education expenses. Only relevant if you want to pay some or all of a child’s college costs.',
        data: { applicable: false },
      },
    }
  }

  return {
    rawStatus: 'needs_action',
    milestone: {
      id: 'college_savings',
      phase: 6,
      title: 'Save for college (529 plan)',
      description:
        'Evaluate a 529 plan (or alternative like an UTMA/UTMA or Coverdell ESA) and contribute according to your goal and timeline. Many states offer a deduction or credit for 529 contributions.',
      rationale:
        'A 529 plan grows tax-free when used for qualified education expenses. Even if you do not plan to cover full tuition, partial funding reduces the debt burden your children take on. Contribute only after your own retirement is on track — your retirement cannot be funded with loans, but their education can.',
      data: { applicable: true },
    },
  }
}
