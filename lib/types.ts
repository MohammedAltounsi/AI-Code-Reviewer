export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type FindingCategory = 'security' | 'bug' | 'performance' | 'style' | 'best-practices'

export interface CodeReviewFinding {
  category: FindingCategory
  severity: Severity
  line: number | null
  issue: string
  fix: string
}

export interface CodeReviewReport {
  filename: string
  language: string
  healthScore: number
  summary: string
  findings: CodeReviewFinding[]
}
