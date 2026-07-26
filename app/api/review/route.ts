import { analyzeCode } from '../../../lib/analyze'
import { computeHealthScore } from '../../../lib/score'
import { fetchGitHubFile, ReviewRejectedError } from '../../../lib/githubFetch'
import type { CodeReviewReport } from '../../../lib/types'

export const maxDuration = 60

const MAX_CODE_LENGTH = 50_000

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, githubUrl } = body as { code?: unknown; githubUrl?: unknown }

    let source: { content: string; filename: string }

    if (typeof githubUrl === 'string' && githubUrl.trim().length > 0) {
      source = await fetchGitHubFile(githubUrl)
    } else if (typeof code === 'string' && code.trim().length > 0) {
      if (code.length > MAX_CODE_LENGTH) {
        return Response.json({ error: `Code too long — ${MAX_CODE_LENGTH} character max` }, { status: 400 })
      }
      source = { content: code, filename: 'pasted-code' }
    } else {
      return Response.json({ error: 'Paste some code or provide a GitHub file URL' }, { status: 400 })
    }

    const { language, summary, findings } = await analyzeCode(source.content, source.filename)
    const healthScore = computeHealthScore(findings)

    const report: CodeReviewReport = { filename: source.filename, language, healthScore, summary, findings }
    return Response.json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Code review failed'
    const status = err instanceof ReviewRejectedError ? 400 : 502
    return Response.json({ error: message }, { status })
  }
}
