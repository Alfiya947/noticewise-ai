import { strict as assert } from "node:assert";
import { test } from "node:test";
import { initialProfile } from "../lib/checker.ts";
import {
  createLocalReport,
  groundReportInText,
  personalizeReport,
  validateOpportunityReport,
} from "../lib/opportunities.ts";

function makeOpportunity(overrides = {}) {
  return {
    title: "Summer research program",
    category: "Internship",
    organizer: null,
    summary: "A student research placement.",
    event_date: null,
    deadline: null,
    deadline_status: "unknown",
    registration_status: "not_stated",
    admission_status: "not_stated",
    location: null,
    mode: null,
    fees: null,
    eligibility_status: "unknown",
    eligibility_requirements: [],
    benefits: [],
    registration_links: [],
    required_documents: [],
    recommended_actions: [],
    missing_information: [],
    source_evidence: [],
    additional_details: [],
    warnings: [],
    ...overrides,
  };
}

function makeReport(opportunities = [makeOpportunity()]) {
  return { input_type: "text", opportunities, warnings: [] };
}

test("validates a multi-opportunity structured response and keeps unavailable values null", () => {
  const report = validateOpportunityReport({
    input_type: "text",
    warnings: [],
    opportunities: [
      makeOpportunity(),
      makeOpportunity({ title: "Merit award", category: "Scholarship", fees: "No fee stated" }),
    ],
  }, "text");
  assert.equal(report.opportunities.length, 2);
  assert.equal(report.opportunities[0].organizer, null);
  assert.deepEqual(report.opportunities[0].benefits, []);
});

test("rejects an invalid input type, incomplete requirement, or unsafe link", () => {
  assert.throws(() => validateOpportunityReport({ input_type: "video", opportunities: [], warnings: [] }));
  assert.throws(() => validateOpportunityReport(makeReport([
    makeOpportunity({ eligibility_requirements: [{ requirement: "CGPA", status: "maybe", evidence: "CGPA 7", mandatory: true }] }),
  ])));
  assert.throws(() => validateOpportunityReport(makeReport([
    makeOpportunity({ registration_links: ["javascript:alert(1)"] }),
  ])));
});

test("requires returned input type to match the uploaded source", () => {
  assert.throws(() => validateOpportunityReport(makeReport(), "pdf"));
});

test("removes pasted-text links and quotes that cannot be grounded exactly", () => {
  const report = makeReport([
    makeOpportunity({
      registration_links: ["https://college.example/apply", "https://invented.example/apply"],
      source_evidence: ["Minimum CGPA: 7.5", "A made-up source quote"],
      eligibility_requirements: [{
        requirement: "Minimum CGPA of 7.5",
        status: "unknown",
        evidence: "Minimum CGPA: 7.5",
        mandatory: true,
      }],
    }),
  ]);
  const grounded = groundReportInText(report, "Minimum CGPA: 7.5\nhttps://college.example/apply");
  assert.deepEqual(grounded.opportunities[0].registration_links, ["https://college.example/apply"]);
  assert.deepEqual(grounded.opportunities[0].source_evidence, ["Minimum CGPA: 7.5"]);
  assert.equal(grounded.opportunities[0].eligibility_requirements[0].evidence, "Minimum CGPA: 7.5");
  assert.equal(grounded.warnings.length, 1);
});

test("does not claim Gemini failed for an intentional local-only analysis", () => {
  const report = createLocalReport("Minimum CGPA: 7.5", initialProfile);
  assert.equal(report.input_type, "text");
  assert.doesNotMatch(report.opportunities[0].summary, /Gemini was unavailable/i);
});

test("matches explicit supported requirements locally without sending a profile to Gemini", () => {
  const report = makeReport([
    makeOpportunity({
      eligibility_requirements: [{
        requirement: "Minimum CGPA of 7.5",
        status: "unknown",
        evidence: "Minimum CGPA: 7.5",
        mandatory: true,
      }],
    }),
  ]);
  const result = personalizeReport(report, initialProfile);
  assert.equal(result.opportunities[0].eligibility_status, "eligible");
  assert.equal(result.opportunities[0].eligibility_requirements[0].status, "met");
});

test("does not mark a student eligible while a mandatory condition is unknown", () => {
  const report = makeReport([
    makeOpportunity({
      eligibility_requirements: [{
        requirement: "A qualification that the local checker cannot verify",
        status: "unknown",
        evidence: "Applicants should demonstrate outstanding leadership.",
        mandatory: true,
      }],
    }),
  ]);
  const result = personalizeReport(report, initialProfile);
  assert.equal(result.opportunities[0].eligibility_status, "manual_review");
  assert.equal(result.opportunities[0].eligibility_requirements[0].status, "needs_review");
});

test("reports a supported mandatory mismatch without approving or rejecting admission", () => {
  const report = makeReport([
    makeOpportunity({
      eligibility_requirements: [{
        requirement: "Minimum CGPA of 9.0",
        status: "unknown",
        evidence: "Minimum CGPA: 9.0",
        mandatory: true,
      }],
    }),
  ]);
  const result = personalizeReport(report, initialProfile);
  assert.equal(result.opportunities[0].eligibility_status, "ineligible");
  assert.equal(result.opportunities[0].admission_status, "not_stated");
});

test("does not assume a missing deadline year", () => {
  const report = makeReport([
    makeOpportunity({ deadline: "15 December", deadline_status: "open" }),
  ]);
  const result = personalizeReport(report, initialProfile);
  assert.equal(result.opportunities[0].deadline_status, "unknown");
});

test("does not infer programming proficiency from listed skills", () => {
  const report = makeReport([
    makeOpportunity({
      eligibility_requirements: [{
        requirement: "Required programming skills",
        status: "unknown",
        evidence: "Required skills: Java, SQL",
        mandatory: true,
      }],
    }),
  ]);
  const result = personalizeReport(report, { ...initialProfile, skills: "Java, SQL" });
  assert.equal(result.opportunities[0].eligibility_status, "manual_review");
  assert.equal(result.opportunities[0].eligibility_requirements[0].status, "needs_review");
});
