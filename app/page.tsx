'use client'

import { useState } from 'react'
import { ReportView } from './components/ReportView'
import { ScanningLoader } from './components/ScanningLoader'
import type { CodeReviewReport } from '../lib/types'

export default function Home() {
  const [mode, setMode] = useState<'paste' | 'github'>('paste')
  const [code, setCode] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [report, setReport] = useState<CodeReviewReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setReport(null)

    try {
      const payload = mode === 'github' ? { githubUrl } : { code }
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()

      if (!res.ok) {
        setError(body.error ?? 'Review failed')
      } else {
        setReport(body)
      }
    } catch {
      setError('Review failed — check your connection and try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 md:py-24">
      <p className="font-data text-xs uppercase tracking-[0.2em] text-accent print:hidden">
        system // code reviewer
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-fg md:text-6xl">
        Run a full diagnostic
        <br />
        on any code.
      </h1>

      <div className="mt-10 flex gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setMode('paste')}
          className={`font-data border px-3 py-1 text-xs uppercase tracking-widest ${
            mode === 'paste' ? 'border-accent text-accent' : 'border-border text-fg-muted'
          }`}
        >
          Paste Code
        </button>
        <button
          type="button"
          onClick={() => setMode('github')}
          className={`font-data border px-3 py-1 text-xs uppercase tracking-widest ${
            mode === 'github' ? 'border-accent text-accent' : 'border-border text-fg-muted'
          }`}
        >
          GitHub URL
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 print:hidden">
        {mode === 'paste' ? (
          <textarea
            required
            placeholder="Paste your code here…"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={12}
            className="font-data w-full border border-border bg-bg-elevated p-4 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-accent"
          />
        ) : (
          <div className="flex items-stretch border border-border bg-bg-elevated focus-within:border-accent">
            <span aria-hidden className="font-data flex items-center pl-4 text-accent">
              &gt;
            </span>
            <input
              type="url"
              required
              placeholder="https://github.com/owner/repo/blob/main/file.ts"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="font-data w-full bg-transparent px-3 py-4 text-fg outline-none placeholder:text-fg-muted"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="font-data mt-3 bg-accent px-6 py-3 text-sm font-bold uppercase tracking-widest text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? 'Scanning' : 'Review Code'}
        </button>
      </form>

      {loading && <ScanningLoader />}
      {error && (
        <p className="font-data mt-6 border border-sev-critical/40 bg-sev-critical/10 px-4 py-3 text-sm text-sev-critical">
          {error}
        </p>
      )}
      {report && <ReportView report={report} />}
    </main>
  )
}
