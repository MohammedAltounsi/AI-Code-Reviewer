import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchGitHubFile, ReviewRejectedError } from './githubFetch'

describe('fetchGitHubFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects a non-github.com URL', async () => {
    await expect(fetchGitHubFile('https://evil.example.com/owner/repo/blob/main/file.ts')).rejects.toThrow(
      ReviewRejectedError
    )
  })

  it('rejects a github.com URL that is not a blob URL', async () => {
    await expect(fetchGitHubFile('https://github.com/owner/repo')).rejects.toThrow(ReviewRejectedError)
  })

  it('fetches raw.githubusercontent.com built from the parsed path, never the user-given host', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toBe('https://raw.githubusercontent.com/owner/repo/main/src/file.ts')
      return {
        ok: true,
        body: {
          getReader: () => {
            let done = false
            return {
              read: async () => {
                if (done) return { done: true, value: undefined }
                done = true
                return { done: false, value: new TextEncoder().encode('const x = 1') }
              },
              cancel: async () => {},
            }
          },
        },
      } as unknown as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchGitHubFile('https://github.com/owner/repo/blob/main/src/file.ts')
    expect(result).toEqual({ content: 'const x = 1', filename: 'file.ts' })
  })

  it('rejects a response over the 200KB cap', async () => {
    const bigChunk = new Uint8Array(250_000)
    const fetchMock = vi.fn(async () => ({
      ok: true,
      body: {
        getReader: () => {
          let done = false
          return {
            read: async () => {
              if (done) return { done: true, value: undefined }
              done = true
              return { done: false, value: bigChunk }
            },
            cancel: async () => {},
          }
        },
      },
    })) as unknown as typeof fetch
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchGitHubFile('https://github.com/owner/repo/blob/main/big.ts')).rejects.toThrow(
      ReviewRejectedError
    )
  })

  it('rejects when GitHub returns a non-ok status', async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 404 })) as unknown as typeof fetch
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchGitHubFile('https://github.com/owner/repo/blob/main/missing.ts')).rejects.toThrow(
      ReviewRejectedError
    )
  })
})
