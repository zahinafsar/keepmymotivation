"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Turn = { q: string; a: string };
type Step = "goal" | "chat" | "time";

type FinalAgent = {
  theme: string;
  imageKeyword: string;
  subjectHint: string;
};

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("goal");
  const [goal, setGoal] = useState("");
  const [history, setHistory] = useState<Turn[]>([]);
  const [currentQ, setCurrentQ] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [final, setFinal] = useState<FinalAgent | null>(null);
  const [sendHour, setSendHour] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  function goToSignup() {
    if (!final) return;
    const payload = {
      goal,
      clarifyQA: history,
      theme: final.theme,
      imageKeyword: final.imageKeyword,
      subjectHint: final.subjectHint,
      sendHour,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    sessionStorage.setItem("kmm_onboarding", JSON.stringify(payload));
    router.push("/signup");
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[color:var(--accent)] flex items-center justify-center font-bold text-[color:var(--background)]">
            K
          </span>
          <span className="font-semibold tracking-tight">KeepMyMotivation</span>
        </div>
        <a href="/login" className="text-sm text-[color:var(--muted)] hover:text-white">
          Log in
        </a>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-center mb-3">
            What do you want to become?
          </h1>
          <p className="text-center text-[color:var(--muted)] mb-10">
            One goal. A motivational email on your schedule. Words + imagery tuned to what actually moves you.
          </p>

          {step === "goal" && (
            <form onSubmit={submitGoal} className="space-y-3">
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="I want to go to gym regularly"
                className="w-full rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-4 text-base outline-none focus:border-[color:var(--accent)] resize-none"
                rows={3}
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[color:var(--accent)] text-[color:var(--background)] font-semibold hover:opacity-90"
              >
                Continue
              </button>
            </form>
          )}

          {step === "chat" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-4">
                <p className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-2">
                  Your goal
                </p>
                <p>{goal}</p>
              </div>

              {history.map((t, i) => (
                <div key={i} className="space-y-2">
                  <div className="rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-4">
                    <p className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-1">
                      Question {i + 1}
                    </p>
                    <p>{t.q}</p>
                  </div>
                  <div className="rounded-xl bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-[color:var(--accent)] mb-1">
                      You
                    </p>
                    <p>{t.a}</p>
                  </div>
                </div>
              ))}

              {currentQ && (
                <form onSubmit={submitAnswer} className="space-y-3">
                  <div className="rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-4">
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
                    className="w-full rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-4 outline-none focus:border-[color:var(--accent)]"
                  />
                  <button
                    type="submit"
                    disabled={loading || !answer.trim()}
                    className="w-full py-3 rounded-xl bg-[color:var(--accent)] text-[color:var(--background)] font-semibold disabled:opacity-50"
                  >
                    {loading ? "Thinking…" : "Send"}
                  </button>
                </form>
              )}

              {loading && !currentQ && (
                <p className="text-center text-[color:var(--muted)]">Thinking…</p>
              )}
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          )}

          {step === "time" && final && (
            <div className="space-y-6">
              <div className="rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-5">
                <p className="text-sm text-[color:var(--muted)] mb-1">Motivational angle</p>
                <p className="font-medium capitalize">{final.theme}</p>
              </div>
              <div>
                <label className="block text-sm text-[color:var(--muted)] mb-2">
                  When should we send your emails?
                </label>
                <select
                  value={sendHour}
                  onChange={(e) => setSendHour(Number(e.target.value))}
                  className="w-full rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-4 outline-none focus:border-[color:var(--accent)]"
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[color:var(--muted)] mt-2">
                  Your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>
              <button
                onClick={goToSignup}
                className="w-full py-3 rounded-xl bg-[color:var(--accent)] text-[color:var(--background)] font-semibold"
              >
                Create account
              </button>
            </div>
          )}
        </div>
      </section>

      <footer className="py-6 text-center text-xs text-[color:var(--muted)]">
        Spark (free · monthly) · Boost ($1/mo · weekly) · Drive ($5/mo · daily)
      </footer>
    </main>
  );
}
