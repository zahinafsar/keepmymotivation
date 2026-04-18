"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Select from "@/components/Select";

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
            href="/login"
            className="text-sm text-[color:var(--muted)] hover:text-white transition-colors fade-up delay-100"
          >
            Log in
          </a>
        </header>

        <section className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.05] text-center mb-4 fade-up text-gradient">
            What do you want to become?
          </h1>
          <p className="text-center text-[color:var(--muted)] mb-10 fade-up delay-100">
            One goal. A motivational email on your schedule. Words + imagery tuned to what actually moves you.
          </p>

          {step === "goal" && (
            <form onSubmit={submitGoal} className="space-y-4 fade-up delay-200">
              <div className="glass p-2">
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="I want to go to gym regularly"
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
                  When should we send your emails?
                </label>
                <Select
                  value={sendHour}
                  onChange={setSendHour}
                  options={hourOptions}
                />

                <p className="text-xs text-[color:var(--muted)] mt-2">
                  Your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>
              <button onClick={goToSignup} className="btn-3d w-full">
                Create account
              </button>
            </div>
          )}
        </div>
      </section>
      </div>

      {step === "goal" && (
        <aside className="relative z-10 max-w-5xl w-full mx-auto px-6 py-16 space-y-16">
          <section>
            <h2 className="text-2xl font-bold mb-2 text-gradient">
              A motivational newsletter built around your goal
            </h2>
            <p className="text-[color:var(--muted)] max-w-2xl mb-8">
              KeepMyMotivation is an AI-powered motivational email service. Tell us what you
              want to become — get started with fitness, career, study, or habit goals — and
              we send personalized motivation on your schedule. Think of it as auto-motivation
              on autopilot.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <article className="glass p-5">
                <h3 className="font-semibold mb-2">Personalized emails</h3>
                <p className="text-sm text-[color:var(--muted)]">
                  Every motivational email is tailored to your goal, tone, and the motivational
                  angle that actually moves you.
                </p>
              </article>
              <article className="glass p-5">
                <h3 className="font-semibold mb-2">Your schedule</h3>
                <p className="text-sm text-[color:var(--muted)]">
                  Pick the time of day. Receive daily motivation, a weekly boost, or a monthly
                  spark — all in your timezone.
                </p>
              </article>
              <article className="glass p-5">
                <h3 className="font-semibold mb-2">Imagery + words</h3>
                <p className="text-sm text-[color:var(--muted)]">
                  Each inspirational email pairs AI-crafted copy with relevant imagery to make
                  motivation stick.
                </p>
              </article>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-gradient">Plans</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <article className="plan-card">
                <h3 className="font-semibold text-lg">Spark</h3>
                <p className="text-[color:var(--muted)] text-sm mb-3">
                  1 motivational email per month
                </p>
                <p className="text-2xl font-bold text-gradient">Free</p>
              </article>
              <article className="plan-card">
                <h3 className="font-semibold text-lg">Boost</h3>
                <p className="text-[color:var(--muted)] text-sm mb-3">
                  1 motivational email per week
                </p>
                <p className="text-2xl font-bold text-gradient">$1 / month</p>
              </article>
              <article className="plan-card">
                <h3 className="font-semibold text-lg">Drive</h3>
                <p className="text-[color:var(--muted)] text-sm mb-3">
                  1 motivational email per day
                </p>
                <p className="text-2xl font-bold text-gradient">$5 / month</p>
              </article>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-gradient">Frequently asked</h2>
            <div className="space-y-4">
              <details className="glass p-5">
                <summary className="font-semibold cursor-pointer">
                  What is KeepMyMotivation?
                </summary>
                <p className="mt-3 text-[color:var(--muted)]">
                  A motivational email subscription. Share your goal, and we deliver
                  AI-personalized motivational emails — daily, weekly, or monthly — to help
                  you stay on track.
                </p>
              </details>
              <details className="glass p-5">
                <summary className="font-semibold cursor-pointer">
                  How is this different from a regular newsletter?
                </summary>
                <p className="mt-3 text-[color:var(--muted)]">
                  Regular newsletters broadcast the same content to everyone. Our motivation
                  newsletter adapts each email to your specific goal, preferred motivational
                  angle, and imagery keywords.
                </p>
              </details>
              <details className="glass p-5">
                <summary className="font-semibold cursor-pointer">
                  What goals can I track?
                </summary>
                <p className="mt-3 text-[color:var(--muted)]">
                  Any goal. Fitness motivation, career motivation, study habits, creative
                  projects, quitting bad habits, building new ones — if you want to stay
                  motivated, we build the emails around it.
                </p>
              </details>
              <details className="glass p-5">
                <summary className="font-semibold cursor-pointer">
                  Can I pause or cancel anytime?
                </summary>
                <p className="mt-3 text-[color:var(--muted)]">
                  Yes. Switch plans or cancel from your dashboard at any time.
                </p>
              </details>
            </div>
          </section>
        </aside>
      )}

      <footer className="relative z-10 py-6 text-center text-xs text-[color:var(--muted)]">
        Spark (free · monthly) · Boost ($1/mo · weekly) · Drive ($5/mo · daily)
      </footer>
    </main>
  );
}
