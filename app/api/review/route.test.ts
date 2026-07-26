import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'
import { ReviewRejectedError } from '../../../lib/githubFetch'

vi.mock('../../../lib/githubFetch', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/githubFetch')>('../../../lib/githubFetch')
  return {
    ReviewRejectedError: actual.ReviewRejectedError,
    fetchGitHubFile: vi.fn(async () => ({ content: 'const x = 1', filename: 'file.ts' })),
  }
})
vi.mock('../../../lib/analyze', () => ({
  analyzeCode: vi.fn(async () => ({
    language: 'TypeScript',
    summary: 'Looks fine.',
    findings: [{ category: 'style', severity: 'low', line: 1, issue: 'x', fix: 'y' }],
  })),
}))

describe('POST /api/review', () => {
  it('returns 400 when neither code nor githubUrl is provided', async () => {
    const req = new Request('http://localhost/api/review', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for code over the length cap', async () => {
    const req = new Request('http://localhost/api/review', {
      method: 'POST',
      body: JSON.stringify({ code: 'x'.repeat(50_001) }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty/whitespace-only code', async () => {
    const req = new Request('http://localhost/api/review', {
      method: 'POST',
      body: JSON.stringify({ code: '   ' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns the assembled report for pasted code', async () => {
    const req = new Request('http://localhost/api/review', {
      method: 'POST',
      body: JSON.stringify({ code: 'const x = 1' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.filename).toBe('pasted-code')
    expect(body.language).toBe('TypeScript')
    expect(body.healthScore).toBe(98)
    expect(body.findings).toHaveLength(1)
  })

  it('returns the assembled report for a github url', async () => {
    const req = new Request('http://localhost/api/review', {
      method: 'POST',
      body: JSON.stringify({ githubUrl: 'https://github.com/owner/repo/blob/main/file.ts' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.filename).toBe('file.ts')
  })

  it('returns 400 when the github fetch is rejected as a policy violation', async () => {
    const { fetchGitHubFile } = await import('../../../lib/githubFetch')
    vi.mocked(fetchGitHubFile).mockRejectedValueOnce(new ReviewRejectedError('Only github.com file URLs are supported'))

    const req = new Request('http://localhost/api/review', {
      method: 'POST',
      body: JSON.stringify({ githubUrl: 'https://evil.example.com/x' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 502 for an upstream analysis failure', async () => {
    const { analyzeCode } = await import('../../../lib/analyze')
    vi.mocked(analyzeCode).mockRejectedValueOnce(new Error('Claude API error'))

    const req = new Request('http://localhost/api/review', {
      method: 'POST',
      body: JSON.stringify({ code: 'const x = 1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(502)
  })
})
