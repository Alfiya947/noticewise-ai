# NoticeWise AI 2.0

A browser-based student notice checker. Paste text or upload a text-based PDF/TXT, edit the sample profile, analyze, and inspect quoted evidence, skill gaps, deadlines and document checklist. Export JSON if needed. The original orange/cream v0 design is retained.

## Run in GitHub Codespaces

Use Node 24 and pnpm (the package manager version is specified in package.json). From the repository root:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev --hostname 0.0.0.0
```

Open forwarded port 3000. Run `pnpm test` for automated tests, `pnpm exec tsc --noEmit` for project type checking, and `pnpm build` for production verification. Vercel can import the repository as a Next.js project; no environment variables are required. Hosting and Codespaces quotas may apply.

## Architecture

Text/PDF → local PDF.js extraction → TypeScript TF-IDF / multinomial Naive Bayes classifier → conservative regex extraction → deterministic profile comparison → evidence report. Classification is independent of eligibility. Six categories use 60 synthetic training snippets; unknown inputs may be unclassified. No Python backend, paid API, database or hosted inference is used. Profile and notice stay in browser memory; refreshing clears them. Exported JSON contains the profile and original notice, so share it carefully.

## Supported checks

CGPA (0–10), branch, graduation year, academic year (four-year degree), explicit mandatory skill lists, date-only deadlines and document lists. Deadline status is separate from academic matching; same-day deadlines require confirmation of time and time zone. Unknown rules, alternative skills, contradictions and invalid data require manual review. Skill matching is case-insensitive exact matching, not proficiency assessment. Empty skills mean unknown. The first short non-rule line may be treated as a heading; always check the original. Document checklist is manual, not proof of possession.

## Testing

37 automated regression tests (11 original + 26 additional) passed with Node 22.16. The visible Test Lab runs the 26 additional fixtures in the browser with a fixed date of 2026-11-24. Tests use synthetic notices, not independent real-world accuracy data. Full Next.js build, browser UI and PDF upload were not verified in the upgrade environment; run the commands above before submission.

## Limitations

English only; one criterion per line or sentence works best. Mixed clauses, unsupported rules, scanned PDFs, relative dates, and complex exceptions may need manual review. PDF limit 5 MB / 50 pages, notice limit 50,000 characters. No OCR, calendar integration, authentication or persistent storage. An Eligible result means supported extracted criteria match, not guaranteed eligibility or an open application.

## Development disclosure

Original prototype generated using v0 by Vercel. This upgrade used ChatGPT to modify the existing source, expand synthetic training data, add regression fixtures and improve documentation. NotebookLM was used for planning. The participant should review the code, run the app, validate results and accurately describe their own contributions before submitting. No claim of real-world accuracy or unverified participant work is made.
