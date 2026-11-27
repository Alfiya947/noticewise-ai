"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  Check,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  MapPin,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import type { Opportunity, OpportunityReport } from "@/lib/opportunities";

type OpportunityDashboardProps = {
  report: OpportunityReport;
  analysisMode: string;
  notice?: string;
  originalText?: string;
};

function labelForStatus(status: string) {
  const labels: Record<string, string> = {
    met: "Matches profile",
    not_met: "Does not match",
    needs_review: "Needs review",
    unknown: "Not confirmed",
    not_stated: "Not stated",
    open: "Open",
    closed: "Closed",
    expired: "Expired",
    eligible: "Meets listed requirements",
    ineligible: "Unmet requirement found",
    manual_review: "Manual review needed",
  };
  return labels[status] || status.replaceAll("_", " ");
}

function formatDeadlineStatus(opportunity: Opportunity) {
  if (!opportunity.deadline) {
    if (opportunity.deadline_status === "closed") return "Closed (stated in notice)";
    return "No deadline stated";
  }
  if (opportunity.deadline_status === "closed") return "Closed (stated in notice)";
  if (opportunity.deadline_status === "expired") return "Passed (check the year and cutoff)";
  if (opportunity.deadline_status === "open") return "Open (check the year and cutoff)";
  return "Date needs confirmation";
}

function downloadReport(report: OpportunityReport, analysisMode: string) {
  const file = new Blob([JSON.stringify({ analysis_mode: analysisMode, ...report }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "noticewise-opportunities.json";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function OpportunityCard({ opportunity, index }: { opportunity: Opportunity; index: number }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const status = opportunity.eligibility_status;
  const verdictClass = status === "eligible" ? "eligible" : status === "ineligible" ? "ineligible" : "review";
  const visibleDetails = [
    opportunity.event_date ? { label: "Event date", value: opportunity.event_date, icon: CalendarDays } : null,
    { label: "Deadline", value: opportunity.deadline ? `${opportunity.deadline} · ${formatDeadlineStatus(opportunity)}` : formatDeadlineStatus(opportunity), icon: CalendarDays },
    { label: "Registration", value: labelForStatus(opportunity.registration_status), icon: ClipboardCheck },
    { label: "Admission", value: labelForStatus(opportunity.admission_status), icon: ClipboardCheck },
    opportunity.location ? { label: "Location", value: opportunity.location, icon: MapPin } : null,
    opportunity.mode ? { label: "Mode", value: opportunity.mode, icon: Sparkles } : null,
    opportunity.fees ? { label: "Fees", value: opportunity.fees, icon: Wallet } : null,
    opportunity.organizer ? { label: "Organizer", value: opportunity.organizer, icon: FileText } : null,
  ].filter((item): item is { label: string; value: string; icon: typeof CalendarDays } => item !== null);

  return (
    <article className="opportunity-card">
      <div className="opportunity-heading">
        <div>
          <p className="opportunity-kicker">OPPORTUNITY {String(index + 1).padStart(2, "0")}</p>
          <h3>{opportunity.title}</h3>
        </div>
        <span className="category-tag">{opportunity.category}</span>
      </div>
      <p className="opportunity-summary">{opportunity.summary}</p>

      <div className={`eligibility-verdict ${verdictClass}`}>
        {status === "eligible" ? <Check aria-hidden="true" /> : status === "ineligible" ? <X aria-hidden="true" /> : <AlertCircle aria-hidden="true" />}
        <div>
          <strong>{labelForStatus(status)}</strong>
          <p>{status === "eligible"
            ? "All explicitly listed mandatory requirements checked by the local rules matched your profile. The organizer makes the official decision."
            : status === "ineligible"
              ? "At least one explicitly listed mandatory requirement did not match the profile details you provided. Confirm with the organizer."
              : "One or more requirements are missing, ambiguous, or outside the supported local checks. Do not treat this as an eligibility decision."}</p>
        </div>
      </div>

      {visibleDetails.length > 0 && (
        <dl className="opportunity-details">
          {visibleDetails.map(({ label, value, icon: Icon }) => (
            <div className="opportunity-detail" key={label}>
              <dt><Icon size={15} aria-hidden="true" />{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {opportunity.eligibility_requirements.length > 0 && (
        <section className="opportunity-section" aria-label="Eligibility requirements">
          <h4>Requirement-by-requirement check</h4>
          <div className="requirement-list">
            {opportunity.eligibility_requirements.map((requirement, requirementIndex) => (
              <div className="requirement-row" key={`${requirement.requirement}-${requirementIndex}`}>
                <span className={`requirement-status ${requirement.status}`}>
                  {requirement.status === "met" ? <Check size={14} aria-hidden="true" /> : requirement.status === "not_met" ? <X size={14} aria-hidden="true" /> : <AlertCircle size={14} aria-hidden="true" />}
                  {labelForStatus(requirement.status)}
                </span>
                <div>
                  <b>{requirement.requirement}</b>
                  {requirement.evidence && <p className="source-quote">“{requirement.evidence}”</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {opportunity.benefits.length > 0 && (
        <section className="opportunity-section">
          <h4>Benefits and highlights</h4>
          <ul className="detail-list">{opportunity.benefits.map((benefit, itemIndex) => <li key={`${benefit}-${itemIndex}`}>{benefit}</li>)}</ul>
        </section>
      )}

      {opportunity.required_documents.length > 0 && (
        <section className="opportunity-section">
          <h4>Required documents</h4>
          <div className="checklist">
            {opportunity.required_documents.map((document, itemIndex) => (
              <label className="checklist-item" key={`${document}-${itemIndex}`}>
                <input
                  type="checkbox"
                  checked={Boolean(checked[-(itemIndex + 1)])}
                  onChange={(event) => setChecked((previous) => ({ ...previous, [-(itemIndex + 1)]: event.target.checked }))}
                />
                <span>{document}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {opportunity.recommended_actions.length > 0 && (
        <section className="opportunity-section">
          <h4>Recommended next steps</h4>
          <div className="checklist">
            {opportunity.recommended_actions.map((action, itemIndex) => (
              <label className="checklist-item" key={`${action}-${itemIndex}`}>
                <input
                  type="checkbox"
                  checked={Boolean(checked[itemIndex])}
                  onChange={(event) => setChecked((previous) => ({ ...previous, [itemIndex]: event.target.checked }))}
                />
                <span>{action}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {opportunity.registration_links.length > 0 && (
        <div className="registration-links">
          {opportunity.registration_links.map((link, itemIndex) => (
            <a key={`${link}-${itemIndex}`} href={link} target="_blank" rel="noreferrer noopener">
              <ExternalLink size={15} aria-hidden="true" /> Open registration page <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          ))}
        </div>
      )}

      {(opportunity.missing_information.length > 0 || opportunity.warnings.length > 0) && (
        <div className="notice-callouts">
          {opportunity.missing_information.length > 0 && (
            <div className="notice-callout missing">
              <AlertCircle size={17} aria-hidden="true" />
              <div><b>Information to confirm</b><ul>{opportunity.missing_information.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}</ul></div>
            </div>
          )}
          {opportunity.warnings.length > 0 && (
            <div className="notice-callout">
              <AlertCircle size={17} aria-hidden="true" />
              <div><b>Warnings</b><ul>{opportunity.warnings.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}</ul></div>
            </div>
          )}
        </div>
      )}

      {opportunity.additional_details.length > 0 && (
        <section className="opportunity-section additional-details">
          <h4>Other details</h4>
          <dl>{opportunity.additional_details.map((detail, itemIndex) => <div key={`${detail.label}-${itemIndex}`}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl>
        </section>
      )}

      {opportunity.source_evidence.length > 0 && (
        <details className="source-details">
          <summary>View source evidence <span>{opportunity.source_evidence.length} excerpts</span></summary>
          <ul>{opportunity.source_evidence.map((evidence, itemIndex) => <li key={`${evidence}-${itemIndex}`}>{evidence}</li>)}</ul>
        </details>
      )}
    </article>
  );
}

export function OpportunityDashboard({ report, analysisMode, notice, originalText }: OpportunityDashboardProps) {
  const allWarnings = report.warnings;
  return (
    <section className="card opportunity-report" id="report" aria-live="polite">
      <div className="between report-toolbar">
        <div className="sectiontitle">
          <span className="tile coral"><ClipboardCheck aria-hidden="true" /></span>
          <div><small>NOTICEWISE ANALYSIS</small><h2>Opportunity report</h2></div>
        </div>
        <button className="outline" type="button" onClick={() => downloadReport(report, analysisMode)}>
          <Download size={15} aria-hidden="true" /> Export JSON
        </button>
      </div>
      <div className="report-meta">
        <span className="analysis-mode"><Sparkles size={14} aria-hidden="true" />{analysisMode}</span>
        <span>{report.opportunities.length} {report.opportunities.length === 1 ? "opportunity" : "opportunities"} found</span>
      </div>
      {notice && <p className="analysis-notice" role="status">{notice}</p>}
      {allWarnings.length > 0 && (
        <div className="notice-callout report-warning">
          <AlertCircle size={17} aria-hidden="true" />
          <ul>{allWarnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul>
        </div>
      )}
      {report.opportunities.length > 0 ? report.opportunities.map((opportunity, index) => (
        <OpportunityCard key={`${opportunity.title}-${index}`} opportunity={opportunity} index={index} />
      )) : (
        <div className="empty-opportunities">
          <AlertCircle aria-hidden="true" />
          <div><b>No opportunities could be extracted</b><p>Check the source, try a clearer image or document, or paste the notice text.</p></div>
        </div>
      )}
      {originalText && (
        <details className="source-details original-source">
          <summary>View original notice text</summary>
          <pre>{originalText}</pre>
        </details>
      )}
      <p className="report-disclaimer">AI extraction can be incomplete or incorrect. NoticeWise does not independently verify these details or approve admission. Confirm dates, requirements, fees, links, and final eligibility with the official organizer.</p>
    </section>
  );
}
