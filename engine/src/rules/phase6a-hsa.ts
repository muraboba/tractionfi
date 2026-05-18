import { CURRENT_LIMITS } from '../constants'
import type { RuleContext, RuleOutput } from '../types'

export function phase6aHSA(ctx: RuleContext): RuleOutput {
  const constants = CURRENT_LIMITS

  if (!ctx.userData.hasHDHP) {
    return {
      rawStatus: 'not_applicable',
      milestone: {
        id: 'hsa_contributions',
        phase: 6,
        title: 'Max your HSA contributions',
        description: 'HSAs are only available with a qualified High-Deductible Health Plan, which you do not currently have.',
        rationale:
          'A Health Savings Account is the most tax-advantaged account available in the US system (triple tax benefit: deductible going in, tax-free growth, tax-free withdrawal for qualified medical). But it requires enrollment in a qualified HDHP.',
        data: { applicable: false, taxYear: constants.taxYear },
      },
    }
  }

  return {
    rawStatus: 'needs_action',
    milestone: {
      id: 'hsa_contributions',
      phase: 6,
      title: 'Max your HSA contributions',
      description: `You have a qualified HDHP, so you are eligible for an HSA. Max contributions for ${constants.taxYear}: $${constants.contributionHSAIndividual.toLocaleString()} individual, $${constants.contributionHSAFamily.toLocaleString()} family ($${constants.contributionHSACatchUp55Plus.toLocaleString()} catch-up if 55+).`,
      rationale:
        'The HSA is the only account in the US tax code with triple tax advantage: contributions are deductible, growth is tax-free, and qualified withdrawals are tax-free. After age 65, withdrawals for any purpose are taxed like a traditional IRA, making it functionally a retirement account on top of its medical-spend role.',
      data: {
        applicable: true,
        taxYear: constants.taxYear,
        individualLimit: constants.contributionHSAIndividual,
        familyLimit: constants.contributionHSAFamily,
        catchUpLimit: constants.contributionHSACatchUp55Plus,
      },
    },
  }
}
