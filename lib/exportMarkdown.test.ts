import { describe, it, expect } from 'vitest'
import { reportToMarkdown } from './exportMarkdown'
import type { CodeReviewReport } from './types'

const report: CodeReviewReport = {
  filename: 'file.ts',
  language: 'TypeScript',
  healthScore: 85,
  summary: 'Mostly solid, one security issue.',
  findings: [
    { category: 'security', severity: 'critical', line: 12, issue: 'Unsanitized input passed to eval', fix: 'Remove eval, parse the input explicitly' },
    { category: 'style', severity: 'low', line: null, issue: 'Inconsistent quote style', fix: 'Run Prettier' },
  ],
}

describe('reportToMarkdown', () => {
  it('includes the filename, score, language, and summary', () => {
    const md = reportToMarkdown(report)
    expect(md).toContain('# Code Review — file.ts')
    expect(md).toContain('**Health Score:** 85/100')
    expect(md).toContain('**Language:** TypeScript')
    expect(md).toContain('Mostly solid, one security issue.')
  })

  it('renders each finding with severity, category, line, and fix', () => {
    const md = reportToMarkdown(report)
    expect(md).toContain('### [CRITICAL] Unsanitized input passed to eval')
    expect(md).toContain('- **Category:** security')
    expect(md).toContain('- **Line:** 12')
    expect(md).toContain('- **Fix:** Remove eval, parse the input explicitly')
  })

  it('omits the line field when line is null', () => {
    const md = reportToMarkdown(report)
    expect(md).toContain('### [LOW] Inconsistent quote style')
    expect(md).not.toContain('- **Line:** null')
  })
})
