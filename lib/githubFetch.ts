export class ReviewRejectedError extends Error {}

const GITHUB_BLOB_PATTERN = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/blob\/([\w.-]+)\/(.+)$/

const MAX_BYTES = 200_000

export async function fetchGitHubFile(url: string): Promise<{ content: string; filename: string }> {
  const match = GITHUB_BLOB_PATTERN.exec(url.trim())
  if (!match) {
    throw new ReviewRejectedError(
      'Only github.com file URLs are supported, e.g. https://github.com/owner/repo/blob/main/path/file.ts'
    )
  }
  const [, owner, repo, branch, path] = match
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`

  let res: Response
  try {
    res = await fetch(rawUrl, { signal: AbortSignal.timeout(10_000) })
  } catch {
    throw new ReviewRejectedError('Failed to fetch the file from GitHub')
  }
  if (!res.ok) {
    throw new ReviewRejectedError(`GitHub returned ${res.status} — check the URL and branch name`)
  }

  const reader = res.body?.getReader()
  if (!reader) {
    throw new ReviewRejectedError('Empty response from GitHub')
  }

  let received = 0
  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > MAX_BYTES) {
      await reader.cancel()
      throw new ReviewRejectedError('File too large — 200KB max')
    }
    chunks.push(value)
  }

  const content = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf-8')
  const filename = path.split('/').pop() ?? path
  return { content, filename }
}
