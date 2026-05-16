"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Select from "@/components/Select";

type Turn = { q: string; a: string };
type Step = "prompt" | "chat" | "time";
type Plan = "SPARK" | "BOOST" | "DRIVE";

type FinalAgent = {
  brief: string;
  imageKeyword: string;
  subjectHint: string;
};

const PLAN_INFO: Record<
  Plan,
  { name: string; tagline: string; price: string; period: string; features: string[] }
> = {
  SPARK: {
    name: "Spark",
    tagline: "Try the habit",
    price: "Free",
    period: "",
    features: ["Monthly email", "1 schedule", "No card required"],
  },
  BOOST: {
    name: "Boost",
    tagline: "Weekly rhythm",
    price: "$1",
    period: "/ month",
    features: ["Monthly + weekly emails", "1 schedule", "Cancel anytime"],
  },
  DRIVE: {
    name: "Drive",
    tagline: "Daily drive",
    price: "$5",
    period: "/ month",
    features: ["Monthly + weekly + daily emails", "Up to 5 schedules", "Cancel anytime"],
  },
};

export default function HomeClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("prompt");
  const [prompt, setPrompt] = useState("");
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
        body: JSON.stringify({ prompt, history: nextHistory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Agent failed");
      if (data.done) {
        setFinal({
          brief: data.brief,
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

  async function submitPrompt(e: React.FormEvent) {
    e.preventDefault();
    if (prompt.trim().length < 4) {
      setError("Tell us a bit more about what you want emailed.");
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
      prompt,
      clarifyQA: history,
      brief: final.brief,
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
          <h1 className="text-3xl sm:text-4xl font-bold leading-[1.15] text-center text-balance mb-10 fade-up text-gradient mx-auto">
            Ask what you need.
            <br />
            Let AI decide how to deliver.
          </h1>

          {step === "prompt" && (
            <form onSubmit={submitPrompt} className="space-y-4 fade-up delay-200">
              <div className="glass p-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Weekly NBA recap. Daily SQL drill. Morning nudge. Anything…"
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
                  Your prompt
                </p>
                <p>{prompt}</p>
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
                <p className="text-sm text-[color:var(--muted)] mb-2">What we&apos;ll send</p>
                <p className="text-[15px] leading-relaxed">{final.brief}</p>
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

      {step === "prompt" && (
        <aside className="relative z-10 max-w-5xl w-full mx-auto px-6 py-16 space-y-16">
          <section>
            <h2 className="text-2xl font-bold mb-2 text-gradient">
              Any email. On your schedule. Written by AI.
            </h2>
            <p className="text-[color:var(--muted)] max-w-2xl mb-8">
              KeepMyMotivation turns one prompt into a recurring email. News recaps, study reminders,
              recipe ideas, motivational nudges, prayer prompts, daily challenges — if you can
              describe it, we can send it daily, weekly, or monthly.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <article className="glass p-5">
                <h3 className="font-semibold mb-2">Describe it once</h3>
                <p className="text-sm text-[color:var(--muted)]">
                  Tell the AI what you want emailed. It asks at most two questions to lock in tone
                  and scope.
                </p>
              </article>
              <article className="glass p-5">
                <h3 className="font-semibold mb-2">Your schedule</h3>
                <p className="text-sm text-[color:var(--muted)]">
                  Pick daily, weekly, or monthly, plus the hour of day — delivered in your timezone.
                </p>
              </article>
              <article className="glass p-5">
                <h3 className="font-semibold mb-2">Fresh every send</h3>
                <p className="text-sm text-[color:var(--muted)]">
                  Each email is generated from scratch against your brief, so it stays relevant
                  instead of repeating.
                </p>
              </article>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-gradient">Plans</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {(Object.keys(PLAN_INFO) as Plan[]).map((p) => {
                const pi = PLAN_INFO[p];
                const featured = p === "DRIVE";
                return (
                  <article
                    key={p}
                    className={`plan-card flex flex-col h-full relative ${
                      featured ? "ring-1 ring-[color:var(--accent)]/40" : ""
                    }`}
                  >
                    {featured && (
                      <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full bg-[color:var(--accent)]/15 text-[color:var(--accent)]">
                        Popular
                      </span>
                    )}

                    <div className="mb-4">
                      <p className="font-semibold text-lg">{pi.name}</p>
                      <p className="text-[color:var(--muted)] text-xs">{pi.tagline}</p>
                    </div>

                    <div className="mb-5 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gradient">{pi.price}</span>
                      {pi.period && (
                        <span className="text-[color:var(--muted)] text-sm">{pi.period}</span>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6 text-sm">
                      {pi.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mt-[3px] shrink-0 text-[color:var(--accent)]"
                            aria-hidden="true"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto">
                      <button
                        onClick={() => router.push("/signup")}
                        className="btn-3d w-full text-sm"
                      >
                        Choose {pi.name}
                      </button>
                    </div>
                  </article>
                );
              })}
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
                  A scheduled-email service. You describe what you want sent — anything from news
                  recaps to study reminders to motivational nudges — and AI writes and delivers it
                  on a daily, weekly, or monthly cadence.
                </p>
              </details>
              <details className="glass p-5">
                <summary className="font-semibold cursor-pointer">
                  What kind of emails can I create?
                </summary>
                <p className="mt-3 text-[color:var(--muted)]">
                  Any recurring email. Daily SQL question, weekly NBA scores, monthly book summary,
                  morning prayer reminder, fitness nudge, language-learning drill, market recap — if
                  you can describe it in a sentence, the AI can produce it.
                </p>
              </details>
              <details className="glass p-5">
                <summary className="font-semibold cursor-pointer">
                  How is this different from a normal newsletter?
                </summary>
                <p className="mt-3 text-[color:var(--muted)]">
                  Normal newsletters broadcast the same content to everyone. Here, every email is
                  generated from your own prompt and brief, so it&apos;s built for you and stays fresh
                  across sends.
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
        Spark (free · monthly) · Boost ($1/mo · +weekly) · Drive ($5/mo · +daily, 5 schedules)
      </footer>
    </main>
  );
}
