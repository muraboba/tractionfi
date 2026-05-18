import { describe, expect, it } from 'vitest'
import { evaluate } from '../src/index'
import { isHighInterest } from '../src/rules/phase4a-high-interest-debt'
import { isModerateInterest } from '../src/rules/phase4c-moderate-interest-debt'
import type { DebtEntry } from '../src/types'
import { makeAsset, makeDebt, makeExpense, makeUserData } from './fixtures'

describe('Phase 4a — high-interest debt', () => {
  function readyForPhase4(debts: DebtEntry[] = []) {
    return makeUserData({
      expenses: [makeExpense({ amount: 1_000 })],
      assets: [makeAsset({ value: 5_000, isEmergencyFund: true })],
      debts,
    })
  }

  it('classifies 10% APR as high interest (canonical threshold, inclusive)', () => {
    expect(isHighInterest(makeDebt({ interestRate: 10, category: 'credit-card' }))).toBe(true)
  })

  it('classifies 9.99% APR as NOT high interest', () => {
    expect(isHighInterest(makeDebt({ interestRate: 9.99, category: 'credit-card' }))).toBe(false)
  })

  it('always excludes mortgage from high-interest, regardless of rate', () => {
    expect(isHighInterest(makeDebt({ interestRate: 25, category: 'mortgage' }))).toBe(false)
  })

  it('is active when user has any non-mortgage debt at >= 10% APR', () => {
    const userData = readyForPhase4([makeDebt({ interestRate: 18, balance: 5_000 })])
    const out = evaluate(userData)
    expect(out.currentPriority?.id).toBe('high_interest_debt')
    const data = out.currentPriority?.data as { totalBalance: number }
    expect(data.totalBalance).toBe(5_000)
  })

  it('is completed when user has no debts at all', () => {
    const out = evaluate(readyForPhase4([]))
    const m = out.milestones.find((x) => x.id === 'high_interest_debt')
    expect(m?.status).toBe('completed')
  })

  it('is completed when all debts are below 10% APR', () => {
    const userData = readyForPhase4([
      makeDebt({ interestRate: 5, category: 'auto-loan' }),
      makeDebt({ interestRate: 7, category: 'student-loan' }),
    ])
    const out = evaluate(userData)
    const m = out.milestones.find((x) => x.id === 'high_interest_debt')
    expect(m?.status).toBe('completed')
  })

  it('identifies the highest-rate debt for prioritization', () => {
    const userData = readyForPhase4([
      makeDebt({ name: 'Card A', interestRate: 12, balance: 2_000 }),
      makeDebt({ name: 'Card B', interestRate: 24, balance: 1_000 }),
      makeDebt({ name: 'Card C', interestRate: 18, balance: 3_000 }),
    ])
    const out = evaluate(userData)
    const data = out.currentPriority?.data as { highestRateDebt: { name: string; interestRate: number } }
    expect(data.highestRateDebt.name).toBe('Card B')
    expect(data.highestRateDebt.interestRate).toBe(24)
  })
})

describe('Phase 4c — moderate-interest debt', () => {
  it('classifies 4% APR as moderate (canonical threshold, inclusive)', () => {
    expect(isModerateInterest(makeDebt({ interestRate: 4, category: 'student-loan' }))).toBe(true)
  })

  it('classifies 9.99% APR as moderate (below high threshold)', () => {
    expect(isModerateInterest(makeDebt({ interestRate: 9.99, category: 'student-loan' }))).toBe(true)
  })

  it('classifies 10% APR as NOT moderate (it is high)', () => {
    expect(isModerateInterest(makeDebt({ interestRate: 10, category: 'student-loan' }))).toBe(false)
  })

  it('classifies 3.99% APR as NOT moderate (it is low)', () => {
    expect(isModerateInterest(makeDebt({ interestRate: 3.99, category: 'student-loan' }))).toBe(false)
  })

  it('always excludes mortgage from moderate-interest, regardless of rate', () => {
    expect(isModerateInterest(makeDebt({ interestRate: 7, category: 'mortgage' }))).toBe(false)
  })
})
