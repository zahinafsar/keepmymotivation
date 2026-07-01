"use client";

import { useEffect, useMemo, useState } from "react";
import Select from "@/components/Select";

export type Kind = "DAILY" | "WEEKLY" | "MONTHLY";

export type SchedulePayload = {
  prompt: string;
  kind: Kind;
  hour: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const KIND_LABEL: Record<Kind, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

const ALL_KINDS: Kind[] = ["DAILY", "WEEKLY", "MONTHLY"];

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function ScheduleComposer({
  submitLabel,
  onSubmit,
  defaultKind = "DAILY",
  defaultPrompt = "",
  examples,
}: {
  submitLabel: string;
  onSubmit: (payload: SchedulePayload) => Promise<void> | void;
  defaultKind?: Kind;
  defaultPrompt?: string;
  examples?: string[];
}) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [kind, setKind] = useState<Kind>(defaultKind);
  const [hour, setHour] = useState(8);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);

  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  const hourOptions = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, h) => {
        const period = h < 12 ? "AM" : "PM";
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return { value: h, label: `${String(h12).padStart(2, "0")}:00 ${period}` };
      }),
    []
  );

  async function runPreview() {
    if (prompt.trim().length < 4) {
      setError("Tell us a bit more about what you want emailed.");
      return;
    }
    setPreviewing(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Preview failed");
      setPreview({ subject: data.subject, html: data.html });
      setPreviewOpen(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSubmit() {
    if (prompt.trim().length < 4) {
      setError("Tell us a bit more about what you want emailed.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: SchedulePayload = { prompt: prompt.trim(), kind, hour };
      if (kind === "WEEKLY") payload.dayOfWeek = dayOfWeek;
      if (kind === "MONTHLY") payload.dayOfMonth = dayOfMonth;
      await onSubmit(payload);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 fade-up delay-200">
        <div className="glass p-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Weekly recap of NBA scores, a daily SQL interview question, a monthly book summary"
            className="w-full bg-transparent p-4 text-base outline-none resize-none placeholder:text-white/30"
            rows={3}
          />
        </div>
        {examples && examples.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center pt-1">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setPrompt(ex);
                  setError(null);
                }}
                className="chip"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={runPreview}
          disabled={previewing}
          className="btn-ghost w-full"
        >
          {previewing ? "Generating preview…" : preview ? "Regenerate preview" : "Preview email"}
        </button>
      </div>

      {previewing && (
        <div className="flex justify-center fade-up">
          <div className="ai-thinking">
            <span className="ai-orb" aria-hidden="true">
              <span className="ai-orb-ring" />
              <span className="ai-orb-core" />
            </span>
            <span className="ai-shimmer-text">Writing your email</span>
            <span className="ai-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>
        </div>
      )}

      {preview && !previewing && !previewOpen && (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="text-sm text-[color:var(--accent)] hover:underline w-full text-center"
        >
          View last preview
        </button>
      )}

      {previewOpen && preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Email preview"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setPreviewOpen(false)}
          />
          <div className="glass relative z-10 w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden p-0">
            <div className="flex items-start justify-between gap-4 p-5 border-b border-white/10">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-1">
                  Subject
                </p>
                <p className="font-medium truncate">{preview.subject}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close preview"
                className="shrink-0 text-[color:var(--muted)] hover:text-white transition-colors text-2xl leading-none -mt-1"
              >
                ×
              </button>
            </div>
            <iframe
              title="Email preview"
              srcDoc={preview.html}
              className="flex-1 w-full bg-white"
            />
            <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3">
              <p className="text-xs text-[color:var(--muted)]">
                Not quite right? Tweak the prompt and regenerate.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPreviewOpen(false);
                  runPreview();
                }}
                className="btn-ghost shrink-0"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 fade-up">
        <div>
          <label className="block text-sm text-[color:var(--muted)] mb-2">Frequency</label>
          <Select<Kind>
            value={kind}
            onChange={setKind}
            options={ALL_KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))}
          />
        </div>

        {kind === "MONTHLY" && (
          <div>
            <label className="block text-sm text-[color:var(--muted)] mb-2">Day of month</label>
            <Select<number>
              value={dayOfMonth}
              onChange={setDayOfMonth}
              options={Array.from({ length: 31 }, (_, i) => ({
                value: i + 1,
                label: ordinal(i + 1),
              }))}
            />
            <p className="text-xs text-[color:var(--muted)] mt-2">
              If month has fewer days, sends on last day.
            </p>
          </div>
        )}

        {kind === "WEEKLY" && (
          <div>
            <label className="block text-sm text-[color:var(--muted)] mb-2">Day of week</label>
            <Select<number>
              value={dayOfWeek}
              onChange={setDayOfWeek}
              options={WEEKDAYS.map((n, i) => ({ value: i, label: n }))}
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-[color:var(--muted)] mb-2">Hour of day</label>
          <Select<number> value={hour} onChange={setHour} options={hourOptions} />
          <p className="text-xs text-[color:var(--muted)] mt-2">Your timezone: {timezone}</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button onClick={handleSubmit} disabled={submitting} className="btn-3d w-full">
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </div>
  );
}
