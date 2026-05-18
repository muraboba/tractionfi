import { describe, expect, it } from 'vitest'
import { evaluate } from '../src/index'
import { makeAsset, makeExpense, makePaycheck, makeUserData } from './fixtures'

describe('Phase 5 — 15% retirement savings rate', () => {
  function readyForPhase5(overrides = {}) {
    // All prior phases satisfied: starter EF, no debt, full EF, match captured
    return makeUserData({
      expenses: [makeExpense({ amount: 1_000 })],
      assets: [makeAsset({ value: 100_000, isEmergencyFund: true })],
      debts: [],
      paycheck: makePaycheck({
        grossAmount: 4_000,
        payFrequency: 'biweekly',
        employerOffers401kMatch: false,
        projected401kContribution: 0,
        contribution401kPercentage: 0,
      }),
      ...overrides,
    })
  }

  it('is active when saving < 15% of pre-tax income', () => {
    const userData = readyForPhase5({
      paycheck: makePaycheck({
        grossAmount: 4_000,
        payFrequency: 'biweekly',
        projected401kContribution: 5_000, // ~4.8% of $104k
        contribution401kPercentage: 5,
      }),
    })
    const out = evaluate(userData)
    expect(out.currentPriority?.id).toBe('retirement_15_percent')
    const data = out.currentPriority?.data as { currentRate: number }
    expect(data.currentRate).toBeCloseTo(5_000 / 104_000)
  })

  it('is completed when saving >= 15% from employee contribution alone', () => {
    const userData = readyForPhase5({
      paycheck: makePaycheck({
        grossAmount: 4_000,
        payFrequency: 'biweekly',
        projected401kContribution: 15_600, // exactly 15% of $104k
        contribution401kPercentage: 15,
      }),
    })
    const out = evaluate(userData)
    const m = out.milestones.find((x) => x.id === 'retirement_15_percent')
    expect(m?.status).toBe('completed')
  })

  it('counts employer match toward the 15% rate', () => {
    const userData = readyForPhase5({
      paycheck: makePaycheck({
        grossAmount: 4_000,
        payFrequency: 'biweekly',
        employerOffers401kMatch: true,
        employerMatchPercentage: 5,
        contribution401kPercentage: 10, // employee contributes 10%
        projected401kContribution: 10_400, // 10% of $104k
      }),
    })
    // Employee 10% + employer 5% match = 15% total
    const out = evaluate(userData)
    const m = out.milestones.find((x) => x.id === 'retirement_15_percent')
    expect(m?.status).toBe('completed')
  })

  it('caps employer match contribution at user contribution rate', () => {
    // If employer match is 6% but user only contributes 3%, employer only adds 3%, not 6%.
    // (Read the retirement milestone directly rather than via currentPriority, because
    // with user contributing below the match, employer_match is the active priority.)
    const userData = readyForPhase5({
      paycheck: makePaycheck({
        grossAmount: 4_000,
        payFrequency: 'biweekly',
        employerOffers401kMatch: true,
        employerMatchPercentage: 6,
        contribution401kPercentage: 3,
        projected401kContribution: 3_120, // 3% of $104k
      }),
    })
    const out = evaluate(userData)
    const retirement = out.milestones.find((m) => m.id === 'retirement_15_percent')
    const data = retirement?.data as { currentRate: number }
    // Employee 3% + employer 3% (capped at user rate) = 6% total
    expect(data.currentRate).toBeCloseTo(0.06, 2)
  })

  it('mentions self-employment paths when isSelfEmployed=true', () => {
    const userData = readyForPhase5({
      isSelfEmployed: true,
      paycheck: makePaycheck({
        grossAmount: 4_000,
        payFrequency: 'biweekly',
        projected401kContribution: 1_000,
      }),
    })
    const out = evaluate(userData)
    expect(out.currentPriority?.description).toMatch(/self-employed/i)
  })
})
