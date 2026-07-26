import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReportView } from './ReportView'
import type { CodeReviewReport } from '../../lib/types'

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

describe('ReportView', () => {
  beforeEach(() => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      now += 1000
      cb(now)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders the hero health score, filename, summary, and findings', () => {
    render(<ReportView report={report} />)
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('Health Score')).toBeInTheDocument()
    expect(screen.getByText('file.ts')).toBeInTheDocument()
    expect(screen.getByText('Mostly solid, one security issue.')).toBeInTheDocument()
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('Unsanitized input passed to eval')).toBeInTheDocument()
  })

  it('renders a category count for each finding category present', () => {
    render(<ReportView report={report} />)
    expect(screen.getByText('1 security')).toBeInTheDocument()
    expect(screen.getByText('1 style')).toBeInTheDocument()
  })

  it('renders download buttons for markdown and csv', () => {
    render(<ReportView report={report} />)
    expect(screen.getByRole('button', { name: /copy markdown/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument()
  })
})
