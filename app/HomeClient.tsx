"use client";

import { useRouter } from "next/navigation";
import ScheduleComposer, { type SchedulePayload } from "@/components/ScheduleComposer";

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

export default function HomeClient() {
  const router = useRouter();

  function startSignup(payload: SchedulePayload) {
    const onboarding = {
      ...payload,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    sessionStorage.setItem("kmm_onboarding", JSON.stringify(onboarding));
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

            <ScheduleComposer submitLabel="Create account" onSubmit={startSignup} />
          </div>
        </section>
      </div>

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
                Tell the AI what you want emailed — no forms, no questions. One prompt is enough.
              </p>
            </article>
            <article className="glass p-5">
              <h3 className="font-semibold mb-2">Preview before you commit</h3>
              <p className="text-sm text-[color:var(--muted)]">
                Generate a real email instantly and tweak the prompt until it&apos;s exactly right.
              </p>
            </article>
            <article className="glass p-5">
              <h3 className="font-semibold mb-2">Fresh every send</h3>
              <p className="text-sm text-[color:var(--muted)]">
                Each email is generated from scratch against your prompt, so it stays relevant
                instead of repeating.
              </p>
            </article>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 text-gradient">Pricing</h2>
          <div className="max-w-sm mx-auto">
            <article className="plan-card flex flex-col h-full relative ring-1 ring-[color:var(--accent)]/40">
              <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full bg-[color:var(--accent)]/15 text-[color:var(--accent)]">
                7-day free trial
              </span>

              <div className="mb-4">
                <p className="font-semibold text-lg">{PLAN.name}</p>
                <p className="text-[color:var(--muted)] text-xs">{PLAN.tagline}</p>
              </div>

              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gradient">{PLAN.price}</span>
                <span className="text-[color:var(--muted)] text-sm">{PLAN.period}</span>
              </div>
              <p className="text-xs text-[color:var(--accent)] mb-5">{PLAN.trial}</p>

              <ul className="space-y-2 mb-6 text-sm">
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

              <div className="mt-auto">
                <button
                  onClick={() => router.push("/signup")}
                  className="btn-3d w-full text-sm"
                >
                  Start free trial
                </button>
              </div>
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
                generated from your own prompt, so it&apos;s built for you and stays fresh
                across sends.
              </p>
            </details>
            <details className="glass p-5">
              <summary className="font-semibold cursor-pointer">
                How does the free trial work?
              </summary>
              <p className="mt-3 text-[color:var(--muted)]">
                Every account starts with a 7-day free trial — no card required. After that, it&apos;s
                $5/month for everything. Cancel anytime from your dashboard.
              </p>
            </details>
          </div>
        </section>
      </aside>

      <footer className="relative z-10 py-6 text-center text-xs text-[color:var(--muted)]">
        7-day free trial, then $5/mo · daily, weekly & monthly emails · unlimited schedules · cancel anytime
      </footer>
    </main>
  );
}
