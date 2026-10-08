<div align="right">

**English** · [العربية](README.ar.md)

</div>

<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="AI Code Reviewer: paste a file or a GitHub URL, get severity-ranked findings with a fix for each, and a Health Score computed in code (100 minus 77 equals 23 in the sample shown)">
</p>

<p align="center">
  <a href="https://ai-code-reviewer-coral-five.vercel.app"><img src="https://img.shields.io/badge/live_demo-open-ff7a1a?style=flat" alt="Live demo"></a>
  <img src="https://img.shields.io/badge/Next.js-16-000?style=flat&logo=nextdotjs&logoColor=white" alt="Next.js 16">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Anthropic_API-forced_tool--use-191919?style=flat&logo=anthropic&logoColor=white" alt="Anthropic API with forced tool-use">
  <img src="https://img.shields.io/badge/tested_with-Vitest-6E9F18?style=flat&logo=vitest&logoColor=white" alt="Tested with Vitest">
</p>

Paste code or a GitHub file URL. You get back a Code Health Score, findings grouped by category (security, bugs, performance, style, best-practices), ranked by severity, each with a specific fix. Export the review as Markdown for a PR comment, or as CSV.

**[Open the live app →](https://ai-code-reviewer-coral-five.vercel.app)**

## A real review

<p align="center">
  <img src="./assets/readme/proof-review.png" width="100%" alt="Live app output: Health Score 23 for a pasted JavaScript handler, with a critical SQL injection finding on line 3 and a high-severity unchecked error on line 4, each with a suggested fix">
</p>

A seven-line Express handler went in. Nine findings came out, led by a critical SQL injection on line 3, and the score landed at 23. [Full screenshot of all nine findings](screenshots/review.png).

## Why the score can be trusted

The model never writes the Health Score. Claude decides what is wrong and how severe it is. A fixed formula in [`lib/score.ts`](lib/score.ts) turns that into a number, the same way every time:

| Severity | Points off |
|---|---:|
| critical | −25 |
| high | −15 |
| medium | −7 |
| low | −2 |

The score starts at 100 and floors at 0. The companion project, [AI Website Auditor](https://github.com/MohammedAltounsi/AI-Website-Auditor), follows the same rule. Here there is no external scoring API to average, so the deduction table carries the whole weight.

## How it works

```mermaid
flowchart LR
  A[Pasted code] --> C
  B[GitHub file URL] --> G[githubFetch<br/>strict regex, fixed host]
  G --> C[analyze<br/>Claude, forced tool-use]
  C --> S[score<br/>fixed deductions]
  S --> R[api/review<br/>one JSON report]
  R --> U[UI<br/>gauge, findings, MD / CSV export]
```

<details>
<summary><b>File by file</b></summary>

1. **`lib/githubFetch.ts`** parses a GitHub file URL with a strict regex into `owner`/`repo`/`branch`/`path`, then fetches from `raw.githubusercontent.com`. The code builds that host itself; it never comes from user input. That removes the SSRF problem class: there is no arbitrary-host fetch to defend, because the code fixes the destination, not the request.
2. **`lib/analyze.ts`** sends the code to Claude with forced tool-use (`tool_choice: { type: 'tool' }`), so the response is always a validated structured object, never free text to parse.
3. **`lib/score.ts`** computes the Health Score from the findings list.
4. **`app/api/review/route.ts`** runs the pipeline, caps pasted code at 50 KB and GitHub fetches at 200 KB, and returns one JSON report.
5. **`app/page.tsx` + `app/components/*`** hold the paste-code / GitHub-URL toggle, the animated Health Score gauge, category counts, severity-badged findings, and Markdown and CSV export.

</details>

## Run it locally

```bash
npm install
cp .env.local.example .env.local   # then set ANTHROPIC_API_KEY (console.anthropic.com)
npm run dev
```

Tests:

```bash
npm test
```

**Stack:** Next.js (App Router), TypeScript, Tailwind, Anthropic API (`claude-sonnet-5`, forced tool-use), Vitest and Testing Library.

## Scope and limits

> [!NOTE]
> Your code is never executed. It goes to Claude as text for static analysis only. No sandbox, no repo cloning.

- Reviews one file at a time: a pasted snippet or a single GitHub blob URL.
- The GitHub URL regex assumes the branch name has no `/`. That covers `main`, `master`, `develop` and most feature branches. A branch like `feature/x` returns a clear 400 error instead of a wrong parse.

<details>
<summary><b>Possible next steps</b></summary>

- Full-repo review (walk the tree, pick files, handle rate limits). That is a much bigger product than this one.
- Syntax highlighting in the paste box (CodeMirror or Monaco).
- Per-IP rate limiting (Vercel KV) once real traffic arrives.
- Diff-aware review: paste a diff instead of a whole file.

</details>

---

<p align="center">Built and designed end to end by <b>Mohammed Altounsi</b> · <a href="https://www.linkedin.com/in/mohammed-altounsi/">LinkedIn</a></p>
