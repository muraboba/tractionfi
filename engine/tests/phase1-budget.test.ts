import { describe, expect, it } from 'vitest'
import { evaluate } from '../src/index'
import { makeAsset, makeExpense, makePaycheck, makeUserData } from './fixtures'

describe('Phase 1 — complete budget gate', () => {
  it('blocks when user has no income at all', () => {
    const userData = makeUserData({
      paycheck: makePaycheck({ grossAmount: 0, netAmount: 0 }),
      incomes: [],
    })
    const out = evaluate(userData)
    expect(out.blockers.length).toBeGreaterThan(0)
    expect(out.currentPriority?.id).toBe('complete_budget')
    expect(out.currentPriority?.status).toBe('blocked')
  })

  it('blocks when user has no expenses entered', () => {
    const userData = makeUserData({ expenses: [] })
    const out = evaluate(userData)
    expect(out.blockers.length).toBeGreaterThan(0)
    expect(out.currentPriority?.id).toBe('complete_budget')
  })

  it('blocks when user has cash assets but none designated as emergency fund', () => {
    const userData = makeUserData({
      assets: [makeAsset({ name: 'Checking', value: 5_000, isEmergencyFund: false })],
    })
    const out = evaluate(userData)
    expect(out.blockers.some((b) => b.includes('emergency fund'))).toBe(true)
  })

  it('does NOT block when user has cash but it is designated as emergency fund', () => {
    const userData = makeUserData() // baseline already has designated EF
    const out = evaluate(userData)
    expect(out.blockers).toEqual([])
    expect(out.currentPriority?.id).not.toBe('complete_budget')
  })

  it('does NOT block when user has no cash assets at all (nothing to designate)', () => {
    const userData = makeUserData({ assets: [] })
    const out = evaluate(userData)
    expect(out.blockers).toEqual([])
  })

  it('accepts gross-only income (e.g., 1099 worker pre-tax tracking)', () => {
    const userData = makeUserData({
      paycheck: makePaycheck({ grossAmount: 4_000, netAmount: 0 }),
    })
    const out = evaluate(userData)
    expect(out.blockers).toEqual([])
  })

  it('returns expected metrics even when blocked', () => {
    const userData = makeUserData({
      paycheck: makePaycheck({ grossAmount: 0, netAmount: 0 }),
      expenses: [makeExpense({ amount: 2_000 })],
    })
    const out = evaluate(userData)
    expect(out.metrics.monthlyExpenses).toBe(2_000)
    expect(out.metrics.monthlyIncome).toBe(0)
  })
})
