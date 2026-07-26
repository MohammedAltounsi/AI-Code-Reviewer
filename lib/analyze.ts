import Anthropic from '@anthropic-ai/sdk'
import type { CodeReviewFinding } from './types'

const REVIEW_TOOL = {
  name: 'submit_code_review',
  description: 'Submit a structured code review report',
  input_schema: {
    type: 'object' as const,
    properties: {
      language: { type: 'string', description: 'The detected programming language' },
      summary: { type: 'string', description: '2-3 sentence plain-English overview of code quality' },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['security', 'bug', 'performance', 'style', 'best-practices'],
            },
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            line: { type: ['number', 'null'], description: 'Line number if known, else null' },
            issue: { type: 'string' },
            fix: { type: 'string' },
          },
          required: ['category', 'severity', 'line', 'issue', 'fix'],
        },
      },
    },
    required: ['language', 'summary', 'findings'],
  },
}

export async function analyzeCode(
  code: string,
  filename: string,
  client: Anthropic = new Anthropic()
): Promise<{ language: string; summary: string; findings: CodeReviewFinding[] }> {
  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2048,
    tools: [REVIEW_TOOL],
    tool_choice: { type: 'tool', name: 'submit_code_review' },
    messages: [
      {
        role: 'user',
        content: `Review this file (${filename}) for bugs, security issues, performance problems, style issues, and best-practice violations. Be specific and cite line numbers where you can.\n\n\`\`\`\n${code}\n\`\`\``,
      },
    ],
  })

  const toolUse = message.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return a tool_use block')
  }

  return toolUse.input as { language: string; summary: string; findings: CodeReviewFinding[] }
}
