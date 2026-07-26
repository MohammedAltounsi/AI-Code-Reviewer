import { describe, it, expect, vi } from 'vitest'
import { analyzeCode } from './analyze'

function fakeClient(toolInput: unknown) {
  return {
    messages: {
      create: vi.fn(async () => ({
        content: [{ type: 'tool_use', name: 'submit_code_review', input: toolInput }],
      })),
    },
  } as any
}

describe('analyzeCode', () => {
  it('returns the parsed tool_use input', async () => {
    const expected = { language: 'TypeScript', summary: 'Looks fine.', findings: [] }
    const result = await analyzeCode('const x = 1', 'file.ts', fakeClient(expected))
    expect(result).toEqual(expected)
  })

  it('throws when Claude does not call the tool', async () => {
    const client = {
      messages: { create: vi.fn(async () => ({ content: [{ type: 'text', text: 'oops' }] })) },
    } as any
    await expect(analyzeCode('const x = 1', 'file.ts', client)).rejects.toThrow('tool_use')
  })
})
