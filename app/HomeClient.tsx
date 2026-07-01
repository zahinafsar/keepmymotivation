"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLAN = {
  name: "Pro",
  tagline: "Everything, after a free trial",
  price: "$5",
  period: "/ month",
  trial: "7-day free trial · no card required",
  features: [
    "Daily, weekly & monthly emails",
    "Unlimited schedules",
    "Cancel anytime",
  ],
};

const EXAMPLES = [
  "Daily SQL interview question",
  "Weekly NBA scores recap",
  "Monthly book summary",
  "Morning motivation nudge",
  "Daily language drill",
];

const STEPS = [
  {
    title: "Describe it once",
    body: "Tell the AI what you want emailed — no forms, no questions. One prompt is enough.",
  },
  {
    title: "Preview before you commit",
    body: "Generate a real email instantly and tweak the prompt until it's exactly right.",
  },
  {
    title: "Fresh every send",
    body: "Each email is generated from scratch against your prompt, so it stays relevant instead of repeating.",
  },
];

export default function HomeClient() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  function startAuth() {
    if (prompt.trim().length < 4) {
      setError("Tell us a bit more about what you want emailed.");
      return;
    }
    sessionStorage.setItem("kmm_prompt", prompt.trim());
    router.push("/login");
  }

  return (
    <main className="min-h-screen flex flex-col relative">
      <div className="aurora">
        <span />
      </div>
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
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-bold leading-[1.1] text-center text-balance mb-4 fade-up delay-100 text-gradient mx-auto">
              Ask what you need.
              <br />
              Let AI decide how to deliver.
            </h1>

            <div className="space-y-3 fade-up delay-200">
              <div className="glass p-2">
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. Weekly recap of NBA scores, a daily SQL interview question, a monthly book summary"
                  className="w-full bg-transparent p-4 text-base outline-none resize-none placeholder:text-white/30"
                  rows={3}
                />
              </div>

              <div className="flex flex-wrap gap-2 justify-center pt-1">
                {EXAMPLES.map((ex) => (
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

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <button
                type="button"
                onClick={startAuth}
                className="btn-3d w-full"
              >
                Get started
              </button>
            </div>
          </div>
        </section>
      </div>

      <aside className="relative z-10 max-w-5xl w-full mx-auto px-6 py-16 space-y-16">
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gradient">
            Any email. On your schedule. Written by AI.
          </h2>
          <p className="text-[color:var(--muted)] max-w-2xl mb-8">
            KeepMyMotivation turns one prompt into a recurring email. News
            recaps, study reminders, recipe ideas, motivational nudges, prayer
            prompts, daily challenges — if you can describe it, we can send it
            daily, weekly, or monthly.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <article key={s.title} className="glass glass-hover p-5">
                <span className="step-num mb-4">{i + 1}</span>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-[color:var(--muted)]">{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gradient">
            One plan. Everything included.
          </h2>
          <article className="plan-card current relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <span className="absolute top-4 right-4 md:hidden text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full bg-[color:var(--accent)]/15 text-[color:var(--accent)]">
              7-day free trial
            </span>

            {/* Price block */}
            <div className="md:pr-8 md:border-r md:border-white/10">
              <p className="font-semibold text-lg">{PLAN.name}</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold text-gradient">
                  {PLAN.price}
                </span>
                <span className="text-[color:var(--muted)] text-sm">
                  {PLAN.period}
                </span>
              </div>
              <p className="text-xs text-[color:var(--accent)] mt-1">
                {PLAN.trial}
              </p>
            </div>

            {/* Description + features */}
            <div>
              <p className="text-[color:var(--muted)] text-sm mb-4">
                {PLAN.tagline}
              </p>
              <ul className="grid gap-2.5 text-sm sm:grid-cols-2 md:grid-cols-1">
                {PLAN.features.map((f) => (
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
            </div>
          </article>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gradient">
            Frequently asked
          </h2>
          <div className="space-y-4">
            <details className="glass p-5">
              <summary className="font-semibold cursor-pointer">
                What is KeepMyMotivation?
              </summary>
              <p className="mt-3 text-[color:var(--muted)]">
                A scheduled-email service. You describe what you want sent —
                anything from news recaps to study reminders to motivational
                nudges — and AI writes and delivers it on a daily, weekly, or
                monthly cadence.
              </p>
            </details>
            <details className="glass p-5">
              <summary className="font-semibold cursor-pointer">
                What kind of emails can I create?
              </summary>
              <p className="mt-3 text-[color:var(--muted)]">
                Any recurring email. Daily SQL question, weekly NBA scores,
                monthly book summary, morning prayer reminder, fitness nudge,
                language-learning drill, market recap — if you can describe it
                in a sentence, the AI can produce it.
              </p>
            </details>
            <details className="glass p-5">
              <summary className="font-semibold cursor-pointer">
                How is this different from a normal newsletter?
              </summary>
              <p className="mt-3 text-[color:var(--muted)]">
                Normal newsletters broadcast the same content to everyone. Here,
                every email is generated from your own prompt, so it&apos;s
                built for you and stays fresh across sends.
              </p>
            </details>
            <details className="glass p-5">
              <summary className="font-semibold cursor-pointer">
                How does the free trial work?
              </summary>
              <p className="mt-3 text-[color:var(--muted)]">
                Every account starts with a 7-day free trial — no card required.
                After that, it&apos;s $5/month for everything. Cancel anytime
                from your dashboard.
              </p>
            </details>
          </div>
        </section>
      </aside>

      <footer className="relative z-10 py-6 text-center text-xs text-[color:var(--muted)]">
        7-day free trial, then $5/mo · daily, weekly & monthly emails ·
        unlimited schedules · cancel anytime
      </footer>
    </main>
  );
}
