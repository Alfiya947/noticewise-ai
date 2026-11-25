"use client";
import { ClipboardCheck, Download, Check, X, AlertCircle } from "lucide-react";
import type { Result } from "@/lib/checker";
export function Report({ result: r }: { result: Result }) {
  const download = () => {
    const u = URL.createObjectURL(
      new Blob([JSON.stringify(r, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = "noticewise-report.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  };
  return (
    <section className="card report" id="report" aria-live="polite">
      <div className="between">
        <div className="sectiontitle">
          <span className="tile">
            <ClipboardCheck />
          </span>
          <h2>Analysis report</h2>
        </div>
        <button className="outline" onClick={download}>
          <Download size={15} /> Export JSON
        </button>
      </div>
      <div className={"verdict " + (r.verdict === "Eligible" ? "green" : "")}>
        <strong>{r.verdict}</strong>
        <span>{r.category} · Academic profile check</span>
      </div>
      {r.rows.map((x, i) => (
        <div className="evidence" key={i}>
          {x.match ? <Check size={16} /> : <X size={16} />}
          <div>
            <b>
              {x.field} · {x.explanation.startsWith("Invalid student") ? "Not verified" : x.match ? "Match" : "Mismatch"}
            </b>
            <p>
              “{x.quote}” — Your profile: {x.profile}
            </p><p>{x.explanation}
            </p>
          </div>
        </div>
      ))}
      {r.verdict === "Manual review" && (
        <div className="warning">
          <AlertCircle size={18} />
          <div>
            <b>Check the original notice</b>
            <p>
              {r.rows.length
                ? "Some wording could not be verified."
                : "No supported eligibility rules found."}
            </p>
            {r.review.map((s, i) => (
              <p key={i}>“{s}”</p>
            ))}
          </div>
        </div>
      )}
      <div className="reportfoot">
        <div>
          <small>DEADLINE</small>
          <p>{r.deadline}</p><p className={r.deadlineStatus === "Expired" ? "err" : "muted"}>{r.deadlineStatus}</p>
        </div>
        <div>
          <small>DOCUMENT CHECKLIST</small>
          {r.docs.length ? (
            r.docs.map((d, i) => (
              <label key={i}>
                <input type="checkbox" /> {d}
              </label>
            ))
          ) : (
            <p>Not stated</p>
          )}
        </div>
      </div>
      {r.missingSkills.length > 0 && <div className="warning"><AlertCircle size={18}/><div><b>Skill gaps / unconfirmed skills</b><p>{r.missingSkills.join(", ")}</p></div></div>}
      <p className="muted">
        Supported criteria only. An expired deadline does not change the academic verdict. Confirm deadlines, documents and final eligibility
        with the organizer.
      </p>
    </section>
  );
}
