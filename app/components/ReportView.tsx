import type { CodeReviewReport, FindingCategory } from '../../lib/types'
import { ScoreGauge } from './ScoreGauge'
import { SeverityBadge } from './SeverityBadge'
import { reportToMarkdown } from '../../lib/exportMarkdown'
import { reportToCsv } from '../../lib/exportCsv'

function categoryCounts(report: CodeReviewReport): Array<[FindingCategory, number]> {
  const counts = new Map<FindingCategory, number>()
  for (const f of report.findings) {
    counts.set(f.category, (counts.get(f.category) ?? 0) + 1)
  }
  return Array.from(counts.entries())
}

export function ReportView({ report }: { report: CodeReviewReport }) {
  function handleCopyMarkdown() {
    navigator.clipboard.writeText(reportToMarkdown(report))
  }

  function handleDownloadCsv() {
    const csv = reportToCsv(report)
    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `review-${report.filename}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <section className="mt-12 space-y-8">
      <div className="stagger-in flex items-center justify-between border-b border-border pb-4 print:hidden">
        <p className="font-data text-xs uppercase tracking-widest text-fg-muted">
          Review — <span>{report.filename}</span> ({report.language})
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="font-data border border-border px-3 py-1 text-xs uppercase tracking-wide text-fg-muted transition-colors hover:border-accent hover:text-accent"
          >
            Copy Markdown
          </button>
          <button
            onClick={handleDownloadCsv}
            className="font-data border border-border px-3 py-1 text-xs uppercase tracking-wide text-fg-muted transition-colors hover:border-accent hover:text-accent"
          >
            Download CSV
          </button>
        </div>
      </div>

      <div className="stagger-in flex justify-center" style={{ animationDelay: '80ms' }}>
        <ScoreGauge label="Health Score" score={report.healthScore} size="lg" />
      </div>

      <div
        className="stagger-in flex flex-wrap justify-center gap-4 border-y border-border py-6 font-data text-sm text-fg-muted"
        style={{ animationDelay: '160ms' }}
      >
        {categoryCounts(report).map(([category, count]) => (
          <span key={category}>
            {count} {category}
          </span>
        ))}
      </div>

      <p
        className="stagger-in text-xl leading-relaxed text-fg"
        style={{ animationDelay: '240ms' }}
      >
        {report.summary}
      </p>

      <ol className="space-y-3">
        {report.findings.map((f, i) => (
          <li
            key={i}
            className="stagger-in border border-border bg-bg-elevated p-4"
            style={{ animationDelay: `${320 + i * 80}ms` }}
          >
            <div className="flex items-center gap-2">
              <SeverityBadge severity={f.severity} />
              <span className="font-data text-xs uppercase tracking-widest text-fg-muted">
                {f.category}
                {f.line !== null ? ` · line ${f.line}` : ''}
              </span>
            </div>
            <p className="mt-2 text-lg text-fg">{f.issue}</p>
            <p className="font-data mt-1 text-sm text-fg-muted">{'→'} {f.fix}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
