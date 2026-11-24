# NoticeWise AI

A stateless student workspace for checking campus notices against a profile. Open the sample library, choose a notice, edit the student profile, then select **Analyze notice**. The report shows field-by-field source excerpts, an academic verdict, a document checklist and a JSON download.

## Local setup

Use Node 24 and pnpm. Run `pnpm install --frozen-lockfile`, then `pnpm dev` and open localhost:3000. After installation no model downloads, API credentials, database or hosted inference service are needed. Documents and profile fields are held in memory; refreshing clears your edits.

## Pipeline

1. The Next.js frontend accepts pasted text, TXT and text-based PDF. PDF.js extracts text with a bundled local worker. Limits: 5 MB, 50 PDF pages and 50,000 characters. No OCR.
2. A small TypeScript TF-IDF and multinomial Naive Bayes classifier trained on twelve illustrative snippets labels notices as internship, scholarship, hackathon, workshop or unclassified. No generative AI is used. The predicted category does not decide eligibility.
3. Anchored rule patterns in `lib/checker.ts` compare explicit CGPA, branch and graduation-year criteria while retaining the original evidence. Unrecognized wording or conflicting rules trigger manual review. Results are **academic matches only**: they do not confirm deadlines are still open or documents are available.
4. Explicitly labeled deadlines and required documents appear separately from the verdict.

## Reliability

Run `node --experimental-strip-types --test tests/checker.mjs` and `pnpm exec tsc --noEmit`. Fixtures cover all sample categories, strict versus inclusive cutoffs, missing rules, unsupported conditions, contradictions, field mismatches, quoted evidence and repeatability. These are synthetic checks, not a real-world accuracy benchmark.

## Limits

Use English notices with one criterion per line or sentence. Unknown titles, mixed clauses and PDF extraction artifacts can require manual review. Supported branches are CSE, IT, ECE, EE, ME and CE. Check the original notice with the organizer before applying. The classifier uses a small seed corpus, not a validated institutional dataset.
