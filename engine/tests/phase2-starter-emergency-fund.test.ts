import { describe, expect, it } from 'vitest'
import { evaluate } from '../src/index'
import { makeAsset, makeExpense, makeUserData } from './fixtures'

describe('Phase 2 — starter emergency fund', () => {
  it('is active when EF < $1,000 and monthly expenses < $1,000', () => {
    const userData = makeUserData({
      expenses: [makeExpense({ amount: 500 })],
      assets: [makeAsset({ value: 200, isEmergencyFund: true })],
    })
    const out = evaluate(userData)
    expect(out.currentPriority?.id).toBe('starter_emergency_fund')
    const data = out.currentPriority?.data as { targetAmount: number }
    expect(data.targetAmount).toBe(1_000) // floor
  })

  it('targets one month of expenses when expenses > $1,000', () => {
    const userData = makeUserData({
      expenses: [makeExpense({ amount: 3_500 })],
      assets: [makeAsset({ value: 0, isEmergencyFund: true })],
    })
    const out = evaluate(userData)
    const data = out.currentPriority?.data as { targetAmount: number }
    expect(data.targetAmount).toBe(3_500)
  })

  it('is completed when EF >= target', () => {
    const userData = makeUserData({
      expenses: [makeExpense({ amount: 2_000 })],
      assets: [makeAsset({ value: 2_500, isEmergencyFund: true })],
    })
    const out = evaluate(userData)
    const starter = out.milestones.find((m) => m.id === 'starter_emergency_fund')
    expect(starter?.status).toBe('completed')
    // Should advance to next applicable milestone
    expect(out.currentPriority?.id).not.toBe('starter_emergency_fund')
  })

  it('only counts assets with isEmergencyFund=true', () => {
    const userData = makeUserData({
      expenses: [makeExpense({ amount: 1_000 })],
      assets: [
        makeAsset({ value: 50_000, isEmergencyFund: false }), // ignored
        makeAsset({ value: 500, isEmergencyFund: true }),
      ],
    })
    const out = evaluate(userData)
    expect(out.currentPriority?.id).toBe('starter_emergency_fund')
    const data = out.currentPriority?.data as { currentAmount: number }
    expect(data.currentAmount).toBe(500)
  })

  it('sums multiple EF-designated assets', () => {
    const userData = makeUserData({
      expenses: [makeExpense({ amount: 800 })],
      assets: [
        makeAsset({ value: 600, isEmergencyFund: true }),
        makeAsset({ value: 600, isEmergencyFund: true }),
      ],
    })
    const out = evaluate(userData)
    const starter = out.milestones.find((m) => m.id === 'starter_emergency_fund')
    expect(starter?.status).toBe('completed')
  })
})
