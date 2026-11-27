"use client";
import { useState, useRef } from "react";
import {
  FileText,
  BookOpen,
  Layers,
  ArrowRight,
  UserRound,
  GraduationCap,
  ChartNoAxesColumnIncreasing,
  CalendarDays,
  Pencil,
  ShieldCheck,
  FlaskConical,
  X,
  ChevronRight,
  Sparkles,
  ScanText,
} from "lucide-react";
import {
  samples,
  branches,
  initialProfile,
  validateProfile,
  type Profile,
} from "@/lib/checker";
import {
  createLocalReport,
  groundReportInText,
  personalizeReport,
  validateOpportunityReport,
  type InputType,
  type OpportunityReport,
} from "@/lib/opportunities";
import { extractPdfText } from "@/lib/pdf";
import { NoticeInput, type NoticePayload } from "./notice-input";
import { OpportunityDashboard } from "./opportunity-dashboard";
import { TestLab } from "./test-lab";
export default function Workspace() {
  const [text, setText] = useState(""),
    [tab, setTab] = useState<InputType>("text"),
    [profile, setProfile] = useState(initialProfile),
    [draft, setDraft] = useState<Profile>(profile),
    [result, setResult] = useState<OpportunityReport | null>(null),
    [modal, setModal] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [originalText, setOriginalText] = useState(""),
    [analysisMode, setAnalysisMode] = useState("Gemini AI"),
    [busy, setBusy] = useState(false),
    [profileError, setProfileError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  function open(m: string) {
    setModal(m);
    setProfileError("");
    setDraft({ ...profile });
    dialog.current?.showModal();
  }
  function update(s: string) {
    setText(s);
    clearReport();
  }
  function clearReport() {
    setResult(null);
    setError("");
    setNotice("");
    setOriginalText("");
  }
  function scrollToReport() {
    requestAnimationFrame(() =>
      document.getElementById("report")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }
  async function getLocalSource(payload: NoticePayload): Promise<string> {
    if (payload.inputType === "text") {
      if (!payload.text?.trim()) throw new Error("Paste a notice before analyzing.");
      return payload.text;
    }
    if (payload.inputType === "pdf" && payload.file) return extractPdfText(payload.file);
    throw new Error("Local analysis supports pasted text and text-based PDFs only.");
  }
  async function runLocal(payload: NoticePayload) {
    clearReport();
    setBusy(true);
    try {
      const source = await getLocalSource(payload);
      const report = createLocalReport(source, profile, payload.inputType === "pdf" ? "pdf" : "text");
      setResult(personalizeReport(report, profile));
      setAnalysisMode("Local text analysis");
      setNotice("This analysis ran in your browser. It checks only supported rules and does not send the notice to Gemini.");
      setOriginalText(source);
      scrollToReport();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Local text analysis could not read this notice.");
    } finally {
      setBusy(false);
    }
  }
  async function runGemini(payload: NoticePayload) {
    clearReport();
    setBusy(true);
    try {
      const form = new FormData();
      form.set("inputType", payload.inputType);
      if (payload.inputType === "text") form.set("text", payload.text || "");
      if (payload.inputType === "pdf" || payload.inputType === "image") {
        if (!payload.file) throw new Error("Choose a file before analyzing.");
        form.set("file", payload.file);
      }
      if (payload.inputType === "url") form.set("url", payload.url || "");
      const response = await fetch("/api/analyze", { method: "POST", body: form });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = body && typeof body === "object" && "error" in body && typeof body.error === "string"
          ? body.error
          : "Gemini analysis could not be completed.";
        throw new Error(message);
      }
      let report = validateOpportunityReport(body, payload.inputType);
      if (payload.inputType === "text") report = groundReportInText(report, payload.text || "");
      setResult(personalizeReport(report, profile));
      setAnalysisMode("Gemini AI");
      setNotice("Your student profile was matched in this browser and was not sent with the notice.");
      setOriginalText(payload.inputType === "text" ? payload.text || "" : "");
      scrollToReport();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Gemini analysis could not be completed.";
      if (payload.inputType === "text" || payload.inputType === "pdf") {
        try {
          const source = await getLocalSource(payload);
          const report = createLocalReport(source, profile, payload.inputType, message);
          setResult(personalizeReport(report, profile));
          setAnalysisMode("Local text-analysis fallback");
          setNotice(`${message} A local fallback is shown; it checks only supported rules and does not provide AI extraction.`);
          setOriginalText(source);
          scrollToReport();
        } catch (fallbackCause) {
          setError(`${message} ${fallbackCause instanceof Error ? fallbackCause.message : "Local fallback could not read this notice."}`);
        }
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header>
        <div className="wrap bar">
          <div className="brand" aria-label="NoticeWise AI">
            <span className="brandmark">
              <ScanText size={24} />
            </span>
            NoticeWise <span className="ai">AI</span>
          </div>
          <div className="nav">
            <span className="active">
              <Layers size={15} /> Workspace
            </span>
            <button onClick={() => open("library")}>
              <BookOpen size={16} /> Sample library
            </button>
            <button onClick={() => document.getElementById("test-lab")?.scrollIntoView({behavior:"smooth"})}><FlaskConical size={16}/> Test Lab</button>
          </div>
          <button
            className="avatar"
            aria-label="Edit student profile"
            onClick={() => open("profile")}
          >
            {profile.name
              .split(/\s+/)
              .slice(0, 2)
              .map((s) => s[0])
              .join("")
              .toUpperCase()}
          </button>
        </div>
      </header>
      <main className="wrap">
        <section className="hero">
          <div className="heroCopy">
            <div className="eyebrow">
              <i /> STUDENT TOOLKIT
            </div>
            <h1>
              Find your <em>next step.</em>
            </h1>
            <p>
              Your Personal AI Opportunity Navigator.
              <br className="desktop" /> Extract, compare, and act on campus opportunities.
            </p>
          </div>
          <div className="art">
            <img src="/notice-scan.png" alt="" />
          </div>
        </section>
        <div className="workheading">
          <h2>Your workspace</h2>
          <span className="local">
            <i /> Session only
          </span>
        </div>
        <div className="columns">
          <section className="card">
            <div className="sectiontitle">
              <span className="tile coral">
                <FileText />
              </span>
              <div>
                <small>STEP 01</small>
                <h2>Notice input</h2>
              </div>
            </div>
            <NoticeInput
              tab={tab}
              onTabChange={setTab}
              text={text}
              onTextChange={update}
              onOpenLibrary={() => open("library")}
              onInputChange={clearReport}
              onAnalyze={runGemini}
              onLocalFallback={runLocal}
              busy={busy}
              error={error}
            />
          </section>
          <aside className="card profile">
            <div className="between">
              <div className="sectiontitle">
                <span className="tile">
                  <UserRound />
                </span>
                <div>
                  <small>STEP 02</small>
                  <h2>Student profile</h2>
                </div>
              </div>
              <button className="edit" onClick={() => open("profile")}>
                <Pencil size={13} /> Edit
              </button>
            </div>
            <p className="desc">Used locally for matching. Profile details are not sent to Gemini.</p>
            <div className="identity">
              <span className="avatar big">
                {profile.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((s) => s[0])
                  .join("")
                  .toUpperCase()}
              </span>
              <div>
                <strong>{profile.name}</strong>
                <p>Student profile</p>
              </div>
            </div>
            {[
              [GraduationCap, "Branch", branches[profile.branch]],
              [ChartNoAxesColumnIncreasing, "CGPA", profile.cgpa + " / 10"],
              [CalendarDays, "Graduation year", profile.year],
              [GraduationCap, "Study year", profile.academicYear || "Not supplied"],
              [Sparkles, "Self-reported skills", profile.skills || "Not supplied"],
            ].map(([Icon, label, val]) => {
              const I = Icon as typeof GraduationCap;
              return (
                <div className="detail" key={String(label)}>
                  <I size={16} />
                  <span>{String(label)}</span>
                  <b>{String(val)}</b>
                </div>
              );
            })}
            <div className="privacy">
              <ShieldCheck size={16} /> Matched in-browser; not sent to Gemini.
            </div>
          </aside>
        </div>
        {result && (
          <OpportunityDashboard
            report={result}
            analysisMode={analysisMode}
            notice={notice}
            originalText={originalText}
            key={JSON.stringify(result)}
          />
        )}
        <TestLab />
        <footer>
          <span>NoticeWise</span>Private by design. Evidence first.
        </footer>
      </main>
      <dialog
        aria-label={
          modal === "library" ? "Sample library" : "Edit student profile"
        }
        ref={dialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
      >
        <div className="between">
          <small>
            NOTICEWISE / {modal === "library" ? "SAMPLES" : "PROFILE"}
          </small>
          <button
            className="close"
            aria-label="Close dialog"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        {modal === "library" ? (
          <>
            <h2>Sample library</h2>
            <p className="desc">Choose a notice to load into your workspace.</p>
            {samples.map((s) => (
              <button
                className="sample"
                key={s.title}
                onClick={() => {
                  update(s.text);
                  setTab("text");
                  dialog.current?.close();
                }}
              >
                <span className="tile coral">
                  <FileText />
                </span>
                <span>
                  <small>{s.category}</small>
                  <b>{s.title}</b>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const issues = validateProfile(draft);
              if (issues.length) { setProfileError(issues.join(" ")); return; }
              setProfile({ ...draft, name: draft.name.trim() });
              clearReport();
              dialog.current?.close();
            }}
          >
            <h2>Edit student profile</h2>
            <p className="desc">Changes apply to this session only.</p>
            <label>
              Student name
              <input
                required
                maxLength={45}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label>
              Branch
              <select
                value={draft.branch}
                onChange={(e) => setDraft({ ...draft, branch: e.target.value })}
              >
                {Object.entries(branches).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v} ({k})
                  </option>
                ))}
              </select>
            </label>
            <label>
              CGPA (out of 10)
              <input
                required
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={draft.cgpa}
                onChange={(e) => setDraft({ ...draft, cgpa: e.target.value })}
              />
            </label>
            <label>
              Graduation year
              <input
                required
                type="number"
                min="2000"
                max="2100"
                value={draft.year}
                onChange={(e) => setDraft({ ...draft, year: e.target.value })}
              />
            </label>
            <label>Academic year (four-year degree)<select value={draft.academicYear || ""} onChange={e=>setDraft({...draft,academicYear:e.target.value})}><option value="">Not supplied</option>{[1,2,3,4].map(y=><option key={y} value={y}>{y}</option>)}</select></label>
            <label>Self-reported skills (comma separated)<input value={draft.skills || ""} onChange={e=>setDraft({...draft,skills:e.target.value})} placeholder="Java, SQL" /></label>
            {profileError && <p role="alert" className="err">{profileError}</p>}
            <button className="primary">
              Save profile <ArrowRight size={16} />
            </button>
          </form>
        )}
      </dialog>
    </>
  );
}
