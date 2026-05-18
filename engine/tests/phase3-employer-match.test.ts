import { describe, expect, it } from 'vitest'
import { evaluate } from '../src/index'
import { makeAsset, makeExpense, makePaycheck, makeUserData } from './fixtures'

describe('Phase 3 — employer 401(k) match', () => {
  function readyForPhase3(overrides = {}) {
    // Starter EF satisfied so Phase 3 can be reached
    return makeUserData({
      expenses: [makeExpense({ amount: 1_000 })],
      assets: [makeAsset({ value: 5_000, isEmergencyFund: true })],
      ...overrides,
    })
  }

  it('is not_applicable when employer does not offer a match', () => {
    const userData = readyForPhase3({
      paycheck: makePaycheck({ employerOffers401kMatch: false }),
    })
    const out = evaluate(userData)
    const m = out.milestones.find((x) => x.id === 'employer_match')
    expect(m?.status).toBe('not_applicable')
  })

  it('is active when employer offers a match and user is contributing 0%', () => {
    const userData = readyForPhase3({
      paycheck: makePaycheck({
        employerOffers401kMatch: true,
        employerMatchPercentage: 5,
        contribution401kPercentage: 0,
      }),
    })
    const out = evaluate(userData)
    expect(out.currentPriority?.id).toBe('employer_match')
  })

  it('is completed when user contributes at or above match percentage', () => {
    const userData = readyForPhase3({
      paycheck: makePaycheck({
        employerOffers401kMatch: true,
        employerMatchPercentage: 5,
        contribution401kPercentage: 6,
      }),
    })
    const out = evaluate(userData)
    const m = out.milestones.find((x) => x.id === 'employer_match')
    expect(m?.status).toBe('completed')
  })

  it('computes annual lost match correctly', () => {
    const userData = readyForPhase3({
      paycheck: makePaycheck({
        grossAmount: 4_000,
        payFrequency: 'biweekly',
        employerOffers401kMatch: true,
        employerMatchPercentage: 5,
        contribution401kPercentage: 2,
      }),
    })
    const out = evaluate(userData)
    const data = out.currentPriority?.data as { annualLostMatch: number; annualSalary: number }
    // Annual salary: 4000 * 26 = 104,000. Gap: 3%. Lost: 3,120.
    expect(data.annualSalary).toBe(104_000)
    expect(data.annualLostMatch).toBeCloseTo(3_120)
  })
})
