"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Plan = "SPARK" | "BOOST" | "DRIVE";

type Props = {
  user: { fullname: string; email: string; timezone: string };
  goal: { goalText: string; sendHour: number } | null;
  subscription: { plan: Plan; status: string; currentPeriodEnd: string | null } | null;
  lastEmailAt: string | null;
  welcome: boolean;
  upgraded: boolean;
};

const PLAN_INFO: Record<Plan, { name: string; desc: string; price: string }> = {
  SPARK: { name: "Spark", desc: "1 email per month", price: "Free" },
  BOOST: { name: "Boost", desc: "1 email per week", price: "$1 / month" },
  DRIVE: { name: "Drive", desc: "1 email per day", price: "$5 / month" },
};

export default function DashboardClient(props: Props) {
  const router = useRouter();
  const [upgrading, setUpgrading] = useState<Plan | null>(null);

  const plan = props.subscription?.plan ?? "SPARK";

  async function upgrade(target: Exclude<Plan, "SPARK">) {
    setUpgrading(target);
    try {
      const r = await fetch("/api/lemonsqueezy/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: target }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      window.location.href = data.url;
    } catch (e) {
      alert((e as Error).message);
      setUpgrading(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <main className="min-h-screen px-6 py-8 relative">
      <div className="aurora"><span /></div>
      <div className="grid-overlay" />
      <div className="noise" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-10 fade-up">
          <span className="font-bold tracking-tight text-lg text-gradient">
            KeepMyMotivation
          </span>
          <button onClick={logout} className="btn-ghost text-sm py-2 px-4">
            Log out
          </button>
        </header>

        {(props.welcome || props.upgraded) && (
          <div className="alert-soft mb-8 fade-up delay-100">
            {props.welcome && (
              <p>
                You&apos;re in, {props.user.fullname.split(" ")[0]}. Your first motivational email
                is on its way — check your inbox.
              </p>
            )}
            {props.upgraded && <p>Plan upgraded. Next email goes out on your schedule.</p>}
          </div>
        )}

        <section className="grid gap-6 sm:grid-cols-2 mb-12">
          <div className="glass glass-hover p-6 fade-up delay-100">
            <p className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-2">
              Your goal
            </p>
            <p className="text-lg">{props.goal?.goalText ?? "—"}</p>
            <p className="text-sm text-[color:var(--muted)] mt-3">
              Send time: {(() => {
                const h = props.goal?.sendHour ?? 0;
                const period = h < 12 ? "AM" : "PM";
                const h12 = h % 12 === 0 ? 12 : h % 12;
                return `${String(h12).padStart(2, "0")}:00 ${period}`;
              })()}{" · "}
              {props.user.timezone}
            </p>
          </div>
          <div className="glass glass-hover p-6 fade-up delay-200">
            <p className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-2">
              Current plan
            </p>
            <p className="text-lg font-semibold text-gradient">{PLAN_INFO[plan].name}</p>
            <p className="text-sm text-[color:var(--muted)]">{PLAN_INFO[plan].desc}</p>
            {props.lastEmailAt && (
              <p className="text-xs text-[color:var(--muted)] mt-3">
                Last email: {new Date(props.lastEmailAt).toLocaleString()}
              </p>
            )}
          </div>
        </section>

        <section className="fade-up delay-300">
          <h2 className="text-xl font-semibold mb-4">Plans</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {(Object.keys(PLAN_INFO) as Plan[]).map((p) => {
              const info = PLAN_INFO[p];
              const current = p === plan;
              return (
                <div key={p} className={`plan-card ${current ? "current" : ""}`}>
                  <p className="font-semibold text-lg">{info.name}</p>
                  <p className="text-[color:var(--muted)] text-sm mb-4">{info.desc}</p>
                  <p className="text-3xl font-bold mb-5 text-gradient">{info.price}</p>
                  {p === "SPARK" ? (
                    <button disabled className="btn-ghost w-full text-sm">
                      {current ? "Current plan" : "Default tier"}
                    </button>
                  ) : current ? (
                    <button disabled className="btn-ghost w-full text-sm">
                      Current plan
                    </button>
                  ) : (
                    <button
                      onClick={() => upgrade(p as Exclude<Plan, "SPARK">)}
                      disabled={upgrading !== null}
                      className="btn-3d w-full text-sm"
                    >
                      {upgrading === p ? "Redirecting…" : "Upgrade"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
