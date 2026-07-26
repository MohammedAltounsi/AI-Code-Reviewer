import type { CodeReviewReport } from './types'

function escapeCsvField(value: string): string {
  const escaped = value.replace(/"/g, '""')
  const safe = /^[=+\-@]/.test(escaped) ? `'${escaped}` : escaped
  return `"${safe}"`
}

export function reportToCsv(report: CodeReviewReport): string {
  const header = 'Category,Severity,Line,Issue,Fix'
  const rows = report.findings.map((f) =>
    [f.category, f.severity, f.line?.toString() ?? '', f.issue, f.fix].map(escapeCsvField).join(',')
  )
  return [header, ...rows].join('\n')
}
