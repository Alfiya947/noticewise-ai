# NoticeWise

**Your Personal AI Opportunity Navigator** turns student notices into structured opportunity details and conservative, evidence-grounded profile checks. The existing Next.js application and deterministic eligibility engine are retained; this upgrade adds a server-side Gemini extraction path and a multi-opportunity results dashboard.

## Run locally

Use Node.js 24 and pnpm. From the repository root:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open the local app at `http://localhost:3000`. Run `pnpm test` for the automated suite, `pnpm exec tsc --noEmit` for TypeScript, and `pnpm build` for a production build.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | For Gemini analysis | Google Gemini API key. Read only by the server route; never expose it with a `NEXT_PUBLIC_` prefix. |
| `GEMINI_MODEL` | No | Gemini model ID. Defaults to `gemini-3.6-flash`; use a Gemini 3 or 4 model supported by the Interactions API, structured output, and URL Context. Unsupported or retired IDs fall back to the default with a report warning. |

Set these in the Vercel project environment settings for the environments you use, or in a local development-only environment file. Do not commit secrets. Gemini API quota or billing may depend on the Google account and model selected.

If `GEMINI_API_KEY` is absent or Gemini is unavailable, pasted text and text-based PDFs can use the clearly labeled local fallback. Image and URL analysis require a configured Gemini key.

## Architecture and data flow

- The browser requires explicit consent before sending notice content to `/api/analyze`.
- The Node.js route validates input type, PDF/image signatures, file size, public URL shape, request origin, and a per-process rate limit. It calls Google’s `@google/genai` Interactions API with a structured JSON schema; public URLs use Gemini URL Context. If the selected model is overloaded, it retries once with an alternate supported Gemini 3 model.
- The route validates model output before returning it. Pasted-text evidence and registration URLs are checked against the submitted text. The Gemini key and student profile are not included in the browser request or model prompt.
- Student profile matching uses the existing deterministic TypeScript checker in the browser. Only supported mandatory conditions can produce a match; unrecognized or ambiguous requirements require review. Skill names are self-reported and do not demonstrate proficiency.
- The UI supports pasted text (50,000 characters maximum), JPG/PNG/WEBP images, PDFs, and public HTTP(S) pages. Image and PDF uploads are limited to 4 MB. The browser does not persist the notice, upload, profile, or checklist state.

## Accuracy, privacy, and limitations

Gemini output can be incomplete or incorrect and is not independent verification, admission approval, or an official eligibility decision. Dates are preserved as written; the local deadline checker only derives a date status when it can parse an explicit year. Unknown years, relative dates, conflicting statements, unsupported requirements, and unclear content need confirmation with the organizer. Event date, application deadline, registration status, and admission status remain separate fields.

Uploaded content and page text are treated as untrusted source data. The route instructs Gemini to ignore embedded instructions, extract facts only, and avoid inventing missing details. The app does not store notice content or profile data, but content is sent to Google Gemini after consent when AI analysis is available. Public pages behind sign-in, inaccessible URLs, low-quality scans, unusual layouts, and image text that cannot be read may produce warnings or no results. URL Context is limited to publicly accessible pages supported by Gemini.

The rate limit is an in-memory guard (12 requests per minute per observed client IP) and is not a shared distributed quota across serverless instances. This project adds no database, authentication, chatbot, or other third-party storage service. The optional chatbot is deferred until the core extraction and dashboard are validated.

## Tests

The automated tests preserve the existing eligibility regression cases and add structured response validation, evidence/link grounding, missing-year handling, and conservative profile matching. These tests cover deterministic behavior; they do not establish Gemini accuracy or real-world eligibility outcomes. The in-browser Test Lab remains a regression tool for the local fallback only.
