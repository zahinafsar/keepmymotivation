"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Select from "@/components/Select";

type Turn = { q: string; a: string };
type Step = "goal" | "chat" | "time";
type Kind = "DAILY" | "WEEKLY" | "MONTHLY";

type FinalAgent = {
  theme: string;
  imageKeyword: string;
  subjectHint: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const KIND_LABEL: Record<Kind, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function NewGoalClient({
  allowedKinds,
  timezone,
}: {
  allowedKinds: Kind[];
  timezone: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("goal");
  const [goal, setGoal] = useState("");
  const [history, setHistory] = useState<Turn[]>([]);
  const [currentQ, setCurrentQ] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [final, setFinal] = useState<FinalAgent | null>(null);
  const [kind, setKind] = useState<Kind>(allowedKinds[0]);
  const [hour, setHour] = useState(8);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hourOptions = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, h) => {
        const period = h < 12 ? "AM" : "PM";
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return { value: h, label: `${String(h12).padStart(2, "0")}:00 ${period}` };
      }),
    []
  );

  useEffect(() => {
    if (step === "chat") inputRef.current?.focus();
  }, [step, currentQ]);

  async function askAgent(nextHistory: Turn[]) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/clarify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ goal, history: nextHistory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Agent failed");
      if (data.done) {
        setFinal({
          theme: data.theme,
          imageKeyword: data.imageKeyword,
          subjectHint: data.subjectHint,
        });
        setCurrentQ(null);
        setStep("time");
      } else {
        setCurrentQ(data.question);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function submitGoal(e: React.FormEvent) {
    e.preventDefault();
    if (goal.trim().length < 4) {
      setError("Tell us a bit more about your goal.");
      return;
    }
    setStep("chat");
    await askAgent([]);
  }

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!currentQ || !answer.trim()) return;
    const nextHistory = [...history, { q: currentQ, a: answer.trim() }];
    setHistory(nextHistory);
    setAnswer("");
    setCurrentQ(null);
    await askAgent(nextHistory);
  }

  async function save() {
    if (!final) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        goal,
        clarifyQA: history,
        theme: final.theme,
        imageKeyword: final.imageKeyword,
        subjectHint: final.subjectHint,
        kind,
        hour,
      };
      if (kind === "WEEKLY") payload.dayOfWeek = dayOfWeek;
      if (kind === "MONTHLY") payload.dayOfMonth = dayOfMonth;

      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push("/dashboard");
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <main className="flex flex-col relative">
      <div className="aurora"><span /></div>
      <div className="grid-overlay" />
      <div className="noise" />

      <div className="min-h-screen flex flex-col relative z-10">
        <header className="px-6 py-5 flex items-center justify-between max-w-5xl w-full mx-auto">
          <span className="font-bold tracking-tight text-lg fade-up text-gradient">
            KeepMyMotivation
          </span>
          <a
            href="/dashboard"
            className="text-sm text-[color:var(--muted)] hover:text-white transition-colors fade-up delay-100"
          >
            Cancel
          </a>
        </header>

        <section className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-xl">
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.05] text-center mb-4 fade-up text-gradient">
              Add a new goal
            </h1>
            <p className="text-center text-[color:var(--muted)] mb-10 fade-up delay-100">
              Tell us what you want to become. We&apos;ll tune the emails to it.
            </p>

            {step === "goal" && (
              <form onSubmit={submitGoal} className="space-y-4 fade-up delay-200">
                <div className="glass p-2">
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="I want to read 20 books this year"
                    className="w-full bg-transparent p-4 text-base outline-none resize-none placeholder:text-white/30"
                    rows={3}
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button type="submit" className="btn-3d w-full">
                  Continue
                </button>
              </form>
            )}

            {step === "chat" && (
              <div className="space-y-4">
                <div className="glass p-5 fade-up">
                  <p className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-2">
                    Your goal
                  </p>
                  <p>{goal}</p>
                </div>

                {history.map((t, i) => (
                  <div key={i} className="space-y-2 fade-up">
                    <div className="glass p-5">
                      <p className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-1">
                        Question {i + 1}
                      </p>
                      <p>{t.q}</p>
                    </div>
                    <div className="alert-soft">
                      <p className="text-xs uppercase tracking-wider text-[color:var(--accent)] mb-1">
                        You
                      </p>
                      <p>{t.a}</p>
                    </div>
                  </div>
                ))}

                {currentQ && (
                  <form onSubmit={submitAnswer} className="space-y-3 fade-up">
                    <div className="glass p-5">
                      <p className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-1">
                        Question {history.length + 1}
                      </p>
                      <p>{currentQ}</p>
                    </div>
                    <input
                      ref={inputRef}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Your answer"
                      className="input-modern"
                    />
                    <button
                      type="submit"
                      disabled={loading || !answer.trim()}
                      className="btn-3d w-full"
                    >
                      {loading ? "Thinking…" : "Send"}
                    </button>
                  </form>
                )}

                {loading && !currentQ && (
                  <div className="flex justify-center">
                    <div className="ai-thinking">
                      <span className="ai-orb" aria-hidden="true">
                        <span className="ai-orb-ring" />
                        <span className="ai-orb-core" />
                      </span>
                      <span className="ai-shimmer-text">Thinking</span>
                      <span className="ai-dots" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                  </div>
                )}
                {error && <p className="text-red-400 text-sm">{error}</p>}
              </div>
            )}

            {step === "time" && final && (
              <div className="space-y-6 fade-up">
                <div className="glass glass-hover p-6">
                  <p className="text-sm text-[color:var(--muted)] mb-1">Motivational angle</p>
                  <p className="font-semibold text-lg capitalize text-gradient">{final.theme}</p>
                </div>

                <div>
                  <label className="block text-sm text-[color:var(--muted)] mb-2">
                    Frequency
                  </label>
                  <Select<Kind>
                    value={kind}
                    onChange={setKind}
                    options={allowedKinds.map((k) => ({ value: k, label: KIND_LABEL[k] }))}
                  />
                </div>

                {kind === "MONTHLY" && (
                  <div>
                    <label className="block text-sm text-[color:var(--muted)] mb-2">
                      Day of month
                    </label>
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
                    <label className="block text-sm text-[color:var(--muted)] mb-2">
                      Day of week
                    </label>
                    <Select<number>
                      value={dayOfWeek}
                      onChange={setDayOfWeek}
                      options={WEEKDAYS.map((n, i) => ({ value: i, label: n }))}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-[color:var(--muted)] mb-2">
                    Hour of day
                  </label>
                  <Select<number>
                    value={hour}
                    onChange={setHour}
                    options={hourOptions}
                  />
                  <p className="text-xs text-[color:var(--muted)] mt-2">
                    Your timezone: {timezone}
                  </p>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button onClick={save} disabled={saving} className="btn-3d w-full">
                  {saving ? "Saving…" : "Save goal"}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
