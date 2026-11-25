import { strict as assert } from "node:assert";
import { test } from "node:test";
import { samples, initialProfile as profile, analyze } from "../lib/checker.ts";
for (const [i, expected] of [
  "Eligible",
  "Ineligible",
  "Eligible",
  "Manual review",
].entries())
  test(samples[i].title, () => {
    const report = analyze(samples[i].text, profile);
    assert.equal(report.verdict, expected);
    assert.equal(report.category, samples[i].category);
    assert.deepEqual(report, analyze(samples[i].text, profile));
    for (const row of report.rows)
      assert.ok(samples[i].text.includes(row.quote));
  });
for (const [text, expected] of [
  ["No rules here", "Manual review"],
  ["Minimum CGPA: 7\nMinimum CGPA: 9", "Manual review"],
  ["CGPA > 8.4", "Ineligible"],
  ["Eligible branches: IT, ECE", "Ineligible"],
  ["Applicants must have a minimum CGPA of 8.4.", "Eligible"],
  ["Open to all branches\nNo active backlogs", "Manual review"],
  ["Students graduating in 2028 are eligible.", "Ineligible"],
])
  test(text, () => assert.equal(analyze(text, profile).verdict, expected));
import { cases } from "../lib/test-cases.ts";
for (const c of cases) test(c.name,()=>{
 const r=analyze(c.text,{...profile,...c.profile},"2026-11-24");
 assert.equal(r.verdict,c.expected);
 if(c.deadline) assert.equal(r.deadlineStatus,c.deadline);
 if(c.category) assert.equal(r.category,c.category);
 if(c.missing) assert.deepEqual(r.missingSkills,c.missing);
 for(const row of r.rows) {assert.ok(c.text.includes(row.quote));assert.ok(row.explanation);}
});
