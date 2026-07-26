import type { CodeReviewFinding, Severity } from './types'

const DEDUCTIONS: Record<Severity, number> = {
  critical: 25,
  high: 15,
  medium: 7,
  low: 2,
}

export function computeHealthScore(findings: CodeReviewFinding[]): number {
  const totalDeduction = findings.reduce((sum, f) => sum + DEDUCTIONS[f.severity], 0)
  return Math.max(0, 100 - totalDeduction)
}
