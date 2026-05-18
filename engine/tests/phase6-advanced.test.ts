import { describe, expect, it } from 'vitest'
import { evaluate } from '../src/index'
import { CURRENT_LIMITS } from '../src/constants'
import { makeAsset, makeExpense, makePaycheck, makeUserData } from './fixtures'

describe('Phase 6 — advanced methods', () => {
  function readyForPhase6(overrides = {}) {
    return makeUserData({
      expenses: [makeExpense({ amount: 1_000 })],
      assets: [makeAsset({ value: 100_000, isEmergencyFund: true })],
      debts: [],
      paycheck: makePaycheck({
        grossAmount: 4_000,
        payFrequency: 'biweekly',
        projected401kContribution: 20_000, // > 15%
        contribution401kPercentage: 19.2,
      }),
      ...overrides,
    })
  }

  describe('Phase 6a — HSA', () => {
    it('is not_applicable when user does not have HDHP', () => {
      const userData = readyForPhase6({ hasHDHP: false })
      const out = evaluate(userData)
      const m = out.milestones.find((x) => x.id === 'hsa_contributions')
      expect(m?.status).toBe('not_applicable')
    })

    it('is active when user has HDHP', () => {
      const userData = readyForPhase6({ hasHDHP: true })
      const out = evaluate(userData)
      expect(out.currentPriority?.id).toBe('hsa_contributions')
    })

    it('uses current-year contribution limits from CURRENT_LIMITS', () => {
      const userData = readyForPhase6({ hasHDHP: true })
      const out = evaluate(userData)
      const m = out.milestones.find((x) => x.id === 'hsa_contributions')
      const data = m?.data as { individualLimit: number; familyLimit: number; taxYear: number }
      expect(data.individualLimit).toBe(CURRENT_LIMITS.contributionHSAIndividual)
      expect(data.familyLimit).toBe(CURRENT_LIMITS.contributionHSAFamily)
      expect(data.taxYear).toBe(CURRENT_LIMITS.taxYear)
    })
  })

  describe('Phase 6b — college savings', () => {
    it('is not_applicable when user has no college-bound children', () => {
      const userData = readyForPhase6({ hasCollegeBoundChildren: false })
      const out = evaluate(userData)
      const m = out.milestones.find((x) => x.id === 'college_savings')
      expect(m?.status).toBe('not_applicable')
    })

    it('is active when user has college-bound children', () => {
      const userData = readyForPhase6({
        hasHDHP: false, // make sure HSA is not_applicable first
        hasCollegeBoundChildren: true,
      })
      const out = evaluate(userData)
      expect(out.currentPriority?.id).toBe('college_savings')
    })
  })

  describe('Phase 6c — long-term goals', () => {
    it('returns standard retirement messaging by default', () => {
      const userData = readyForPhase6({ hasHDHP: false, hasCollegeBoundChildren: false })
      const out = evaluate(userData)
      expect(out.currentPriority?.id).toBe('long_term_goals')
      const data = out.currentPriority?.data as { goal: string }
      expect(data.goal).toBe('standard_retirement')
    })

    it('returns early retirement messaging when goal=early_retirement', () => {
      const userData = readyForPhase6({
        hasHDHP: false,
        hasCollegeBoundChildren: false,
        longTermGoal: 'early_retirement',
      })
      const out = evaluate(userData)
      expect(out.currentPriority?.description).toMatch(/Mega Backdoor Roth/i)
    })

    it('returns near-term goal messaging when goal=near_term_goal', () => {
      const userData = readyForPhase6({
        hasHDHP: false,
        hasCollegeBoundChildren: false,
        longTermGoal: 'near_term_goal',
      })
      const out = evaluate(userData)
      expect(out.currentPriority?.description).toMatch(/3–5 years/i)
    })
  })

  describe('current-year constants', () => {
    it('exposes current 401(k) and IRA limits', () => {
      expect(typeof CURRENT_LIMITS.contribution401k).toBe('number')
      expect(typeof CURRENT_LIMITS.contributionIRA).toBe('number')
      expect(CURRENT_LIMITS.contribution401k).toBeGreaterThan(20_000)
      expect(CURRENT_LIMITS.contributionIRA).toBeGreaterThan(6_000)
    })

    it('stamps the current taxYear on engine output', () => {
      const out = evaluate(makeUserData())
      expect(out.taxYear).toBe(CURRENT_LIMITS.taxYear)
    })
  })
})
