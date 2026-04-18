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
    <main className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[color:var(--accent)] flex items-center justify-center font-bold text-[color:var(--background)]">
            K
          </span>
          <span className="font-semibold">KeepMyMotivation</span>
        </div>
        <button onClick={logout} className="text-sm text-[color:var(--muted)] hover:text-white">
          Log out
        </button>
      </header>

      {(props.welcome || props.upgraded) && (
        <div className="mb-6 rounded-xl bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 p-4">
          {props.welcome && (
            <p>
              You&apos;re in, {props.user.fullname.split(" ")[0]}. Your first motivational email is
              on its way — check your inbox.
            </p>
          )}
          {props.upgraded && <p>Plan upgraded. Next email goes out on your schedule.</p>}
        </div>
      )}

      <section className="grid gap-6 sm:grid-cols-2 mb-10">
        <div className="rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-6">
          <p className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-2">Your goal</p>
          <p className="text-lg">{props.goal?.goalText ?? "—"}</p>
          <p className="text-sm text-[color:var(--muted)] mt-3">
            Send time: {String(props.goal?.sendHour ?? 0).padStart(2, "0")}:00 ·{" "}
            {props.user.timezone}
          </p>
        </div>
        <div className="rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-6">
          <p className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-2">
            Current plan
          </p>
          <p className="text-lg font-semibold">{PLAN_INFO[plan].name}</p>
          <p className="text-sm text-[color:var(--muted)]">{PLAN_INFO[plan].desc}</p>
          {props.lastEmailAt && (
            <p className="text-xs text-[color:var(--muted)] mt-3">
              Last email: {new Date(props.lastEmailAt).toLocaleString()}
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Plans</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.keys(PLAN_INFO) as Plan[]).map((p) => {
            const info = PLAN_INFO[p];
            const current = p === plan;
            return (
              <div
                key={p}
                className={`rounded-xl border p-5 ${
                  current
                    ? "bg-[color:var(--accent)]/5 border-[color:var(--accent)]/40"
                    : "bg-[color:var(--panel)] border-[color:var(--panel-border)]"
                }`}
              >
                <p className="font-semibold text-lg">{info.name}</p>
                <p className="text-[color:var(--muted)] text-sm mb-4">{info.desc}</p>
                <p className="text-2xl font-bold mb-4">{info.price}</p>
                {p === "SPARK" ? (
                  <button
                    disabled
                    className="w-full py-2 rounded-lg border border-[color:var(--panel-border)] text-sm text-[color:var(--muted)]"
                  >
                    {current ? "Current plan" : "Default tier"}
                  </button>
                ) : current ? (
                  <button
                    disabled
                    className="w-full py-2 rounded-lg border border-[color:var(--panel-border)] text-sm text-[color:var(--muted)]"
                  >
                    Current plan
                  </button>
                ) : (
                  <button
                    onClick={() => upgrade(p as Exclude<Plan, "SPARK">)}
                    disabled={upgrading !== null}
                    className="w-full py-2 rounded-lg bg-[color:var(--accent)] text-[color:var(--background)] font-semibold text-sm disabled:opacity-50"
                  >
                    {upgrading === p ? "Redirecting…" : "Upgrade"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
