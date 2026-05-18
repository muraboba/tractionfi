import { describe, expect, it } from 'vitest'
import { ENGINE_VERSION, evaluate } from '../src/index'
import { makeAsset, makeDebt, makeExpense, makePaycheck, makeUserData } from './fixtures'

describe('integration — orchestrator behavior', () => {
  it('stamps engine version on every output', () => {
    const out = evaluate(makeUserData())
    expect(out.engineVersion).toBe(ENGINE_VERSION)
  })

  it('walks phases in order and only the first incomplete is active', () => {
    // No starter EF, no debt, no match offered → starter_emergency_fund should be active
    const userData = makeUserData({
      expenses: [makeExpense({ amount: 2_000 })],
      assets: [makeAsset({ value: 0, isEmergencyFund: true })],
    })
    const out = evaluate(userData)
    expect(out.currentPriority?.id).toBe('starter_emergency_fund')

    // Everything after the active milestone is either:
    //   - not_started (sequential — user hasn't reached it yet)
    //   - not_applicable (doesn't apply to this user)
    //   - completed (descriptively true of reality — e.g., "no high-interest debt" is a fact
    //     regardless of where the user is in the flowchart progression)
    const starterIdx = out.milestones.findIndex((m) => m.id === 'starter_emergency_fund')
    const after = out.milestones.slice(starterIdx + 1)
    for (const m of after) {
      expect(['not_started', 'not_applicable', 'completed']).toContain(m.status)
    }
    // No other milestone can be 'active' — there is exactly one active at a time
    expect(after.filter((m) => m.status === 'active')).toHaveLength(0)
  })

  it('respects skippedMilestones option to advance past a milestone', () => {
    const userData = makeUserData({
      expenses: [makeExpense({ amount: 2_000 })],
      assets: [makeAsset({ value: 0, isEmergencyFund: true })],
      debts: [makeDebt({ interestRate: 18, balance: 5_000 })],
    })

    const without = evaluate(userData)
    expect(without.currentPriority?.id).toBe('starter_emergency_fund')

    const withSkip = evaluate(userData, { skippedMilestones: ['starter_emergency_fund'] })
    // After skipping starter EF, next active should be high_interest_debt
    // (no employer match offered, so phase 3 is not_applicable)
    expect(withSkip.currentPriority?.id).toBe('high_interest_debt')

    const skippedMilestone = withSkip.milestones.find((m) => m.id === 'starter_emergency_fund')
    expect(skippedMilestone?.status).toBe('skipped')
  })

  it('computes metrics correctly', () => {
    const userData = makeUserData({
      paycheck: makePaycheck({ grossAmount: 4_000, netAmount: 3_000, payFrequency: 'biweekly' }),
      expenses: [
        makeExpense({ amount: 2_000, frequency: 'monthly' }),
        makeExpense({ amount: 600, frequency: 'annually' }), // = $50/mo
      ],
      assets: [
        makeAsset({ value: 5_000, isEmergencyFund: true }),
        makeAsset({ value: 50_000, isEmergencyFund: false, category: 'investments' }),
      ],
      debts: [makeDebt({ balance: 10_000 })],
    })
    const out = evaluate(userData)
    expect(out.metrics.monthlyIncome).toBeCloseTo((3_000 * 26) / 12)
    expect(out.metrics.monthlyExpenses).toBeCloseTo(2_050)
    expect(out.metrics.totalAssets).toBe(55_000)
    expect(out.metrics.totalDebts).toBe(10_000)
    expect(out.metrics.netWorth).toBe(45_000)
    expect(out.metrics.emergencyFundBalance).toBe(5_000)
    expect(out.metrics.annualGrossIncome).toBe(104_000)
  })

  it('is deterministic — same inputs produce identical outputs', () => {
    const userData = makeUserData({
      expenses: [makeExpense({ amount: 1_500 })],
      assets: [makeAsset({ value: 800, isEmergencyFund: true })],
      debts: [makeDebt({ interestRate: 12, balance: 3_000 })],
    })
    const a = evaluate(userData)
    const b = evaluate(userData)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('always returns one milestone per phase ID in the same order', () => {
    const out = evaluate(makeUserData())
    const ids = out.milestones.map((m) => m.id)
    expect(ids).toEqual([
      'starter_emergency_fund',
      'employer_match',
      'high_interest_debt',
      'full_emergency_fund',
      'moderate_interest_debt',
      'retirement_15_percent',
      'hsa_contributions',
      'college_savings',
      'long_term_goals',
    ])
  })

  it('full happy path — user has completed everything', () => {
    const userData = makeUserData({
      paycheck: makePaycheck({
        grossAmount: 4_000,
        payFrequency: 'biweekly',
        employerOffers401kMatch: true,
        employerMatchPercentage: 5,
        contribution401kPercentage: 15,
        projected401kContribution: 15_600,
      }),
      expenses: [makeExpense({ amount: 2_000 })],
      assets: [makeAsset({ value: 50_000, isEmergencyFund: true })], // > 6 months
      debts: [], // no debt at all
      hasHDHP: false,
      hasCollegeBoundChildren: false,
      longTermGoal: 'standard_retirement',
    })
    const out = evaluate(userData)
    // Only long_term_goals should remain active; everything before either completed or not_applicable
    expect(out.currentPriority?.id).toBe('long_term_goals')
    const completedOrNA = out.milestones
      .filter((m) => m.id !== 'long_term_goals')
      .every((m) => m.status === 'completed' || m.status === 'not_applicable')
    expect(completedOrNA).toBe(true)
  })
})
