"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlignLeft,
  FileText,
  FolderOpen,
  Image,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Globe,
} from "lucide-react";
import type { InputType } from "@/lib/opportunities";

type Tab = InputType;
export type NoticePayload = {
  inputType: InputType;
  text?: string;
  file?: File;
  url?: string;
};

type NoticeInputProps = {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  text: string;
  onTextChange: (value: string) => void;
  onOpenLibrary: () => void;
  onInputChange: () => void;
  onAnalyze: (payload: NoticePayload) => void;
  onLocalFallback: (payload: NoticePayload) => void;
  busy: boolean;
  error: string;
};

const tabs: { id: Tab; label: string; icon: typeof AlignLeft }[] = [
  { id: "text", label: "Paste text", icon: AlignLeft },
  { id: "image", label: "Image / poster", icon: Image },
  { id: "pdf", label: "PDF document", icon: FileText },
  { id: "url", label: "Website URL", icon: Globe },
];

const MAX_FILE_BYTES = 4 * 1024 * 1024;

export function NoticeInput({
  tab,
  onTabChange,
  text,
  onTextChange,
  onOpenLibrary,
  onInputChange,
  onAnalyze,
  onLocalFallback,
  busy,
  error,
}: NoticeInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [consent, setConsent] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConsent(false);
  }, [tab, text]);

  function selectTab(next: Tab) {
    onTabChange(next);
    setConsent(false);
    onInputChange();
    setSelectedFile(null);
    setFileError("");
    if (fileInput.current) fileInput.current.value = "";
  }

  function acceptFile(file?: File) {
    if (!file) return;
    setConsent(false);
    onInputChange();
    const acceptedType = tab === "pdf"
      ? file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
      : ["image/jpeg", "image/png", "image/webp"].includes(file.type)
        || /\.(?:jpe?g|png|webp)$/i.test(file.name);
    if (!acceptedType) {
      setSelectedFile(null);
      setFileError(tab === "pdf" ? "Choose a PDF document." : "Choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size === 0 || file.size > MAX_FILE_BYTES) {
      setSelectedFile(null);
      setFileError("Choose a non-empty file that is 4 MB or smaller.");
      return;
    }
    setFileError("");
    setSelectedFile(file);
  }

  function payload(): NoticePayload {
    if (tab === "text") return { inputType: tab, text };
    if (tab === "url") return { inputType: tab, url };
    return { inputType: tab, file: selectedFile ?? undefined };
  }

  const hasInput = tab === "text"
    ? Boolean(text.trim())
    : tab === "url"
      ? Boolean(url.trim())
      : Boolean(selectedFile);
  const accept = tab === "pdf" ? ".pdf,application/pdf" : ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

  return (
    <>
      <p className="desc">Paste a notice, upload a poster or PDF, or analyze a public opportunity page.</p>
      <div className="tabs" role="tablist" aria-label="Notice input type">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`notice-tab-${id}`}
            role="tab"
            type="button"
            aria-selected={tab === id}
            aria-controls="notice-input-panel"
            aria-pressed={tab === id}
            className={tab === id ? "on" : ""}
            onClick={() => selectTab(id)}
          >
            <Icon aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div id="notice-input-panel" role="tabpanel" aria-labelledby={`notice-tab-${tab}`}>
        {tab === "text" && (
          <>
            <div className="between inputlabel">
              <label htmlFor="notice">Notice text</label>
              <button className="link" type="button" onClick={onOpenLibrary}>
                <Sparkles size={14} aria-hidden="true" /> Try a sample
              </button>
            </div>
            <textarea
              id="notice"
              maxLength={50_000}
              value={text}
              onChange={(event) => onTextChange(event.target.value)}
              placeholder="Paste WhatsApp messages, a college announcement, or any opportunity notice…"
            />
            <p className="count">{text.length.toLocaleString()} / 50,000 characters</p>
          </>
        )}
        {(tab === "image" || tab === "pdf") && (
          <div
            className="drop"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (!busy) acceptFile(event.dataTransfer.files[0]);
            }}
          >
            <FolderOpen aria-hidden="true" />
            <b>{tab === "pdf" ? "Add a circular or opportunity PDF" : "Add a poster or screenshot"}</b>
            <span>{tab === "pdf" ? "PDF · Up to 4 MB" : "JPG, PNG, or WEBP · Up to 4 MB"}</span>
            <input
              ref={fileInput}
              hidden
              type="file"
              accept={accept}
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => acceptFile(event.target.files?.[0])}
            />
            <button
              type="button"
              disabled={busy}
              className="outline"
              onClick={() => fileInput.current?.click()}
            >
              <Upload size={15} aria-hidden="true" /> Choose file
            </button>
            {selectedFile && (
              <div className="selected-file">
                <FileText size={15} aria-hidden="true" />
                <span title={selectedFile.name}>{selectedFile.name}</span>
                <button
                  type="button"
                  className="remove-file"
                  aria-label={`Remove ${selectedFile.name}`}
                  onClick={() => {
                    setConsent(false);
                    onInputChange();
                    setSelectedFile(null);
                    if (fileInput.current) fileInput.current.value = "";
                  }}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            )}
            {fileError && <p className="err" role="alert">{fileError}</p>}
          </div>
        )}
        {tab === "url" && (
          <div className="url-field">
            <label htmlFor="notice-url">Public opportunity page</label>
            <input
              id="notice-url"
              type="url"
              maxLength={2000}
              inputMode="url"
              autoComplete="url"
              placeholder="https://college.edu/opportunities"
              value={url}
                  onChange={(event) => {
                    setConsent(false);
                    onInputChange();
                    setUrl(event.target.value);
                  }}
            />
            <p className="muted">The page must be publicly accessible. Sign-in pages, private networks, and some file types cannot be read.</p>
          </div>
        )}
      </div>
      <label className="consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        <span><ShieldCheck size={16} aria-hidden="true" /> I agree to send this notice to Google Gemini for AI extraction. My student profile is matched locally and is not sent.</span>
      </label>
      <button
        className="primary"
        type="button"
        disabled={busy || !hasInput || !consent}
        aria-busy={busy}
        onClick={() => onAnalyze(payload())}
      >
        <Sparkles size={17} aria-hidden="true" />
        {busy ? "Analyzing notice…" : "Analyze with Gemini"}
      </button>
      {(tab === "text" || tab === "pdf") && (
        <button
          className="local-button"
          type="button"
          disabled={busy || !hasInput}
          onClick={() => onLocalFallback(payload())}
        >
          Analyze locally instead
        </button>
      )}
      <p className="privacy-note">Gemini analysis sends the notice content only. NoticeWise does not save your uploaded file or student profile.</p>
      {error && <p role="alert" className="err input-error">{error}</p>}
    </>
  );
}
