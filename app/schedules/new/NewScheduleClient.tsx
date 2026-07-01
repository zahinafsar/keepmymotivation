"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ScheduleComposer, { type SchedulePayload } from "@/components/ScheduleComposer";

export default function NewScheduleClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome") === "1";
  const [defaultPrompt, setDefaultPrompt] = useState<string | null>(null);

  useEffect(() => {
    setDefaultPrompt(sessionStorage.getItem("kmm_prompt") ?? "");
  }, []);

  async function save(payload: SchedulePayload) {
    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed");
    sessionStorage.removeItem("kmm_prompt");
    router.push(welcome ? "/dashboard?welcome=1" : "/dashboard");
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
              New scheduled email
            </h1>
            <p className="text-center text-[color:var(--muted)] mb-10 fade-up delay-100">
              Tell us what you want to receive. Preview it, then we&apos;ll send it on your schedule.
            </p>

            {defaultPrompt !== null && (
              <ScheduleComposer
                submitLabel="Save schedule"
                onSubmit={save}
                defaultPrompt={defaultPrompt}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
