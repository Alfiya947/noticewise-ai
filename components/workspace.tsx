"use client";
import { useState, useRef } from "react";
import {
  ScanLine,
  FileText,
  BookOpen,
  Layers,
  ArrowRight,
  Upload,
  AlignLeft,
  UserRound,
  GraduationCap,
  ChartNoAxesColumnIncreasing,
  CalendarDays,
  Pencil,
  ShieldCheck,
  FlaskConical,
  X,
  FolderOpen,
  ChevronRight,
  Sparkles,
  ScanText,
} from "lucide-react";
import {
  samples,
  branches,
  analyze,
  initialProfile,
  validateProfile,
  type Profile,
  type Result,
} from "@/lib/checker";
import { TestLab } from "./test-lab";
import { Report } from "./report";
export default function Workspace() {
  const [text, setText] = useState(samples[0].text),
    [profile, setProfile] = useState(initialProfile),
    [draft, setDraft] = useState<Profile>(profile),
    [result, setResult] = useState<Result | null>(null),
    [tab, setTab] = useState("text"),
    [modal, setModal] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [profileError, setProfileError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    file = useRef<HTMLInputElement>(null);
  function open(m: string) {
    setModal(m);
    setProfileError("");
    setDraft({ ...profile });
    dialog.current?.showModal();
  }
  function update(s: string) {
    setText(s);
    setResult(null);
    setError("");
  }
  async function ingest(f?: File) {
    if (!f) return;
    setBusy(true);
    setError("");
    try {
      if (f.size > 5 * 1024 * 1024) throw Error("Choose a file under 5 MB.");
      let value = "";
      if (/\.pdf$/i.test(f.name)) {
        const pdf = await import("pdfjs-dist");
        pdf.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        const task = pdf.getDocument({ data: await f.arrayBuffer() });
        const doc = await task.promise;
        try {
          if (doc.numPages > 50)
            throw Error("Choose a PDF with 50 pages or fewer.");
          for (let i = 1; i <= doc.numPages; i++) {
            const c = await (await doc.getPage(i)).getTextContent();
            value +=
              c.items
                .map((t) => ("str" in t ? t.str + (t.hasEOL ? "\n" : " ") : ""))
                .join("") + "\n";
          }
        } finally {
          await task.destroy();
        }
      } else if (/\.txt$/i.test(f.name)) value = await f.text();
      else throw Error("Choose a PDF or TXT file.");
      if (!value.trim())
        throw Error(
          "No readable text found. For a scanned PDF, paste a transcription.",
        );
      if (value.length > 50000)
        throw Error(
          "Notice exceeds 50,000 characters. Paste the relevant section.",
        );
      update(value.trim());
      setTab("text");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not read the file. Try pasting its text.",
      );
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }
  function run() {
    if (!text.trim()) {
      setError("Paste a notice or choose a sample first.");
      return;
    }
    setResult(analyze(text, profile));
    requestAnimationFrame(() =>
      document
        .querySelector("#report")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }
  return (
    <>
      <header>
        <div className="wrap bar">
          <a href="#" className="brand">
            <span className="brandmark">
              <ScanText size={24} />
            </span>
            NoticeWise <span className="ai">AI</span>
          </a>
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
              Notice, <em>decoded.</em>
            </h1>
            <p>
              Turn campus notices into clear eligibility checks,
              <br className="desktop" /> backed by evidence from the source.
            </p>
          </div>
          <div className="art">
            <img src="/notice-scan.png" alt="" />
          </div>
        </section>
        <div className="workheading">
          <h2>Your workspace</h2>
          <span className="local">
            <i /> Local session
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
            <p className="desc">
              Add a campus notice to check your eligibility.
            </p>
            <div className="tabs">
              <button
                aria-pressed={tab === "text"}
                className={tab === "text" ? "on" : ""}
                onClick={() => setTab("text")}
              >
                <AlignLeft /> Paste text
              </button>
              <button
                aria-pressed={tab === "file"}
                className={tab === "file" ? "on" : ""}
                onClick={() => setTab("file")}
              >
                <Upload /> Upload file
              </button>
            </div>
            {tab === "text" ? (
              <>
                <div className="between inputlabel">
                  <label htmlFor="notice">Notice text</label>
                  <button className="link" onClick={() => open("library")}>
                    <FlaskConical size={14} /> Try a sample
                  </button>
                </div>
                <textarea
                  id="notice"
                  maxLength={50000}
                  value={text}
                  onChange={(e) => update(e.target.value)}
                  placeholder="Paste the full notice here…"
                />
                <p className="count">
                  {text.length.toLocaleString()} characters
                </p>
              </>
            ) : (
              <div
                className="drop"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!busy) ingest(e.dataTransfer.files[0]);
                }}
              >
                <FolderOpen />
                <b>Drop your notice here</b>
                <span>Text-based PDF or TXT · Up to 5 MB</span>
                <button
                  disabled={busy}
                  className="outline"
                  onClick={() => file.current?.click()}
                >
                  {busy ? "Reading file…" : "Choose file"}
                </button>
              </div>
            )}
            <input
              ref={file}
              hidden
              type="file"
              accept=".pdf,.txt"
              onChange={(e) => ingest(e.target.files?.[0])}
            />
            {error && (
              <p role="alert" className="err">
                {error}
              </p>
            )}
            <button className="primary" disabled={busy} onClick={run}>
              <ScanLine size={18} /> Analyze notice <ArrowRight size={17} />
            </button>
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
            <p className="desc">Your details, used for matching.</p>
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
              [Sparkles, "Skills", profile.skills || "Not supplied"],
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
              <ShieldCheck size={16} /> Your profile stays in this session.
            </div>
          </aside>
        </div>
        {result && <Report result={result} key={JSON.stringify(result)} />}
        <TestLab />
        <footer>
          <span>NoticeWise AI</span>Private by design. Evidence first.
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
              setResult(null);
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
            <label>Skills (comma separated)<input value={draft.skills || ""} onChange={e=>setDraft({...draft,skills:e.target.value})} placeholder="Java, SQL" /></label>
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
