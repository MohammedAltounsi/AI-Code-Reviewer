import { describe, it, expect } from 'vitest'
import { computeHealthScore } from './score'
import type { CodeReviewFinding } from './types'

function finding(severity: CodeReviewFinding['severity']): CodeReviewFinding {
  return { category: 'bug', severity, line: 1, issue: 'x', fix: 'y' }
}

describe('computeHealthScore', () => {
  it('returns 100 for no findings', () => {
    expect(computeHealthScore([])).toBe(100)
  })

  it('deducts 25 for a critical finding', () => {
    expect(computeHealthScore([finding('critical')])).toBe(75)
  })

  it('deducts 15 for a high finding', () => {
    expect(computeHealthScore([finding('high')])).toBe(85)
  })

  it('deducts 7 for a medium finding', () => {
    expect(computeHealthScore([finding('medium')])).toBe(93)
  })

  it('deducts 2 for a low finding', () => {
    expect(computeHealthScore([finding('low')])).toBe(98)
  })

  it('sums deductions across multiple findings', () => {
    expect(computeHealthScore([finding('critical'), finding('high'), finding('low')])).toBe(58)
  })

  it('floors at 0 instead of going negative', () => {
    const many = Array.from({ length: 10 }, () => finding('critical'))
    expect(computeHealthScore(many)).toBe(0)
  })
})
