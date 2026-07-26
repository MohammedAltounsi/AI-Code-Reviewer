import type { CodeReviewReport } from './types'

export function reportToMarkdown(report: CodeReviewReport): string {
  const lines = [
    `# Code Review — ${report.filename}`,
    '',
    `**Health Score:** ${report.healthScore}/100`,
    `**Language:** ${report.language}`,
    '',
    report.summary,
    '',
    '## Findings',
    '',
  ]

  for (const f of report.findings) {
    lines.push(`### [${f.severity.toUpperCase()}] ${f.issue}`)
    lines.push(`- **Category:** ${f.category}`)
    if (f.line !== null) {
      lines.push(`- **Line:** ${f.line}`)
    }
    lines.push(`- **Fix:** ${f.fix}`)
    lines.push('')
  }

  return lines.join('\n')
}
