import { describe, it, expect } from 'vitest'
import { reportToCsv } from './exportCsv'
import type { CodeReviewReport } from './types'

const report: CodeReviewReport = {
  filename: 'file.ts',
  language: 'TypeScript',
  healthScore: 90,
  summary: 'Great code',
  findings: [
    { category: 'style', severity: 'low', line: 4, issue: 'Missing trailing comma', fix: 'Run Prettier' },
  ],
}

describe('reportToCsv', () => {
  it('produces a header row plus one row per finding', () => {
    const csv = reportToCsv(report)
    const lines = csv.split('\n')
    expect(lines[0]).toBe('Category,Severity,Line,Issue,Fix')
    expect(lines[1]).toBe('"style","low","4","Missing trailing comma","Run Prettier"')
  })

  it('renders a null line as an empty field', () => {
    const withNullLine: CodeReviewReport = {
      ...report,
      findings: [{ category: 'style', severity: 'low', line: null, issue: 'x', fix: 'y' }],
    }
    const csv = reportToCsv(withNullLine)
    expect(csv.split('\n')[1]).toBe('"style","low","","x","y"')
  })

  it('escapes embedded quotes', () => {
    const withQuote: CodeReviewReport = {
      ...report,
      findings: [{ category: 'bug', severity: 'medium', line: 1, issue: 'Uses "any" everywhere', fix: 'Add real types' }],
    }
    const csv = reportToCsv(withQuote)
    expect(csv).toContain('"Uses ""any"" everywhere"')
  })

  it('neutralizes CSV formula injection on fields starting with = + - @', () => {
    const withFormula: CodeReviewReport = {
      ...report,
      findings: [{ category: 'bug', severity: 'critical', line: 1, issue: '=1+1', fix: '+cmd|" /C calc"!A1' }],
    }
    const csv = reportToCsv(withFormula)
    const lines = csv.split('\n')
    expect(lines[1]).toBe(`"bug","critical","1","'=1+1","'+cmd|"" /C calc""!A1"`)
  })
})
