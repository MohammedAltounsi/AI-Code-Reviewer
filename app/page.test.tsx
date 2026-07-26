import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from './page'

function fakeReport() {
  return {
    filename: 'pasted-code',
    language: 'TypeScript',
    healthScore: 90,
    summary: 'Great code',
    findings: [],
  }
}

describe('Home page', () => {
  it('submits pasted code and renders the report summary', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => fakeReport(),
    })) as unknown as typeof fetch

    render(<Home />)
    fireEvent.change(screen.getByPlaceholderText('Paste your code here…'), {
      target: { value: 'const x = 1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /review code/i }))

    await waitFor(() => expect(screen.getByText('Great code')).toBeInTheDocument())
  })

  it('switches to GitHub URL mode and submits a githubUrl payload', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => fakeReport(),
    })) as unknown as typeof fetch
    global.fetch = fetchMock

    render(<Home />)
    fireEvent.click(screen.getByRole('button', { name: /github url/i }))
    fireEvent.change(screen.getByPlaceholderText('https://github.com/owner/repo/blob/main/file.ts'), {
      target: { value: 'https://github.com/owner/repo/blob/main/file.ts' },
    })
    fireEvent.click(screen.getByRole('button', { name: /review code/i }))

    await waitFor(() => expect(screen.getByText('Great code')).toBeInTheDocument())
    const [, options] = (fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(JSON.parse((options as RequestInit).body as string)).toEqual({
      githubUrl: 'https://github.com/owner/repo/blob/main/file.ts',
    })
  })

  it('shows the error message on a failed review', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: 'Code too long — 50000 character max' }),
    })) as unknown as typeof fetch

    render(<Home />)
    fireEvent.change(screen.getByPlaceholderText('Paste your code here…'), {
      target: { value: 'const x = 1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /review code/i }))

    await waitFor(() =>
      expect(screen.getByText('Code too long — 50000 character max')).toBeInTheDocument()
    )
  })
})
