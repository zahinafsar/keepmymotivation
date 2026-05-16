"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Select from "@/components/Select";
import AnalogClock from "@/components/AnalogClock";

type Plan = "SPARK" | "BOOST" | "DRIVE";
type Kind = "DAILY" | "WEEKLY" | "MONTHLY";

type Schedule = {
  id: string;
  prompt: string;
  kind: Kind;
  hour: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  active: boolean;
};

type Props = {
  user: { fullname: string; email: string; timezone: string };
  subscription: { plan: Plan; status: string; currentPeriodEnd: string | null } | null;
  schedules: Schedule[];
  lastEmailAt: string | null;
  welcome: boolean;
  upgraded: boolean;
};

const PLAN_INFO: Record<
  Plan,
  { name: string; tagline: string; price: string; period: string; features: string[]; max: number }
> = {
  SPARK: {
    name: "Spark",
    tagline: "Start the habit",
    price: "Free",
    period: "",
    features: ["Monthly email", "1 schedule", "No card required"],
    max: 1,
  },
  BOOST: {
    name: "Boost",
    tagline: "Weekly rhythm",
    price: "$1",
    period: "/ month",
    features: ["Monthly + weekly emails", "1 schedule", "Cancel anytime"],
    max: 1,
  },
  DRIVE: {
    name: "Drive",
    tagline: "Daily drive",
    price: "$5",
    period: "/ month",
    features: ["Monthly + weekly + daily emails", "Up to 5 schedules", "Cancel anytime"],
    max: 5,
  },
};

const PLAN_ALLOWED: Record<Plan, Kind[]> = {
  SPARK: ["MONTHLY"],
  BOOST: ["MONTHLY", "WEEKLY"],
  DRIVE: ["MONTHLY", "WEEKLY", "DAILY"],
};

const PLAN_RANK: Record<Plan, number> = { SPARK: 0, BOOST: 1, DRIVE: 2 };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const KIND_LABEL: Record<Kind, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

function formatHour(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:00 ${period}`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function describeSchedule(s: Schedule): string {
  if (s.kind === "DAILY") return `Daily at ${formatHour(s.hour)}`;
  if (s.kind === "WEEKLY") {
    const d = s.dayOfWeek ?? 0;
    return `Every ${WEEKDAYS[d]} at ${formatHour(s.hour)}`;
  }
  const d = s.dayOfMonth ?? 1;
  return `Monthly on the ${ordinal(d)} at ${formatHour(s.hour)}`;
}

export default function DashboardClient(props: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>(props.schedules);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [planAction, setPlanAction] = useState<{
    target: Plan;
    label: "Cancel" | "Downgrade" | "Upgrade";
  } | null>(null);

  const plan = props.subscription?.plan ?? "SPARK";
  const info = PLAN_INFO[plan];
  const allowedKinds = PLAN_ALLOWED[plan];
  const activeSchedules = schedules.filter((s) => s.active);
  const activeCount = activeSchedules.length;

  async function upgrade(target: Exclude<Plan, "SPARK">) {
    setBusy("upgrade");
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
      setBusy(null);
    }
  }

  async function changePlan(target: Plan) {
    setBusy("change");
    try {
      const r = await fetch("/api/lemonsqueezy/change-plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: target }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
      setPlanAction(null);
    }
  }

  async function deleteSchedule(id: string) {
    if (!confirm("Delete this schedule?")) return;
    const r = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      alert(d.error ?? "Failed");
      return;
    }
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }

  async function setActive(schedule: Schedule, active: boolean) {
    setBusy(schedule.id);
    try {
      const payload: Record<string, unknown> = {
        active,
        kind: schedule.kind,
        hour: schedule.hour,
      };
      if (schedule.kind === "WEEKLY") payload.dayOfWeek = schedule.dayOfWeek;
      if (schedule.kind === "MONTHLY") payload.dayOfMonth = schedule.dayOfMonth;

      const r = await fetch(`/api/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      setSchedules((prev) => prev.map((s) => (s.id === schedule.id ? { ...s, ...data.schedule } : s)));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  function buttonFor(p: Plan): {
    label: "Current plan" | "Default tier" | "Cancel" | "Downgrade" | "Upgrade";
    action: () => void;
    disabled: boolean;
  } {
    const current = p === plan;
    if (current) {
      if (p === "SPARK") {
        return { label: "Default tier", action: () => {}, disabled: true };
      }
      return {
        label: "Cancel",
        action: () => setPlanAction({ target: "SPARK", label: "Cancel" }),
        disabled: busy !== null,
      };
    }
    if (PLAN_RANK[p] > PLAN_RANK[plan]) {
      if (plan === "SPARK") {
        return {
          label: "Upgrade",
          action: () => upgrade(p as Exclude<Plan, "SPARK">),
          disabled: busy !== null,
        };
      }
      return {
        label: "Upgrade",
        action: () => setPlanAction({ target: p, label: "Upgrade" }),
        disabled: busy !== null,
      };
    }
    return {
      label: "Downgrade",
      action: () => setPlanAction({ target: p, label: "Downgrade" }),
      disabled: busy !== null,
    };
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
                You&apos;re in, {props.user.fullname.split(" ")[0]}. Your first scheduled email
                is on its way — check your inbox.
              </p>
            )}
            {props.upgraded && <p>Plan upgraded. Next email goes out on your schedule.</p>}
          </div>
        )}

        <section className="glass glass-hover p-6 mb-10 fade-up delay-100 flex items-center gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-2">
              Current plan
            </p>
            <p className="text-lg font-semibold text-gradient">{info.name}</p>
            <p className="text-sm text-[color:var(--muted)]">
              {info.features[0]} · {activeCount}/{info.max} active schedules
            </p>
            <p className="text-xs text-[color:var(--muted)] mt-3">
              Timezone: {props.user.timezone}
            </p>
            {props.lastEmailAt && (
              <p className="text-xs text-[color:var(--muted)]">
                Last email: {new Date(props.lastEmailAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <AnalogClock timezone={props.user.timezone} size={160} />
          </div>
        </section>

        <section className="fade-up delay-200 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Schedules <span className="text-[color:var(--muted)] text-sm font-normal">({activeCount}/{info.max} active)</span>
            </h2>
            <button
              onClick={() => router.push("/schedules/new")}
              disabled={activeCount >= info.max}
              className="btn-3d text-sm py-2 px-4 disabled:opacity-50"
            >
              + Add schedule
            </button>
          </div>

          <div className="grid gap-3">
            {schedules.map((s) => {
              const kindBlocked = !allowedKinds.includes(s.kind);
              return (
                <div key={s.id} className="glass p-4 flex items-center justify-between overflow-hidden gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{s.prompt}</p>
                      {!s.active && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-[color:var(--muted)] shrink-0">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[color:var(--muted)]">{describeSchedule(s)}</p>
                    {kindBlocked && (
                      <p className="text-xs text-[color:var(--muted)] mt-1">
                        {KIND_LABEL[s.kind]} not available on {info.name}. Edit to change frequency.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {s.active ? (
                      <button
                        onClick={() => setActive(s, false)}
                        disabled={busy === s.id}
                        className="btn-ghost text-xs py-1 px-3"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (kindBlocked) setEditing(s);
                          else setActive(s, true);
                        }}
                        disabled={busy === s.id}
                        className="btn-ghost text-xs py-1 px-3"
                      >
                        Activate
                      </button>
                    )}
                    <button onClick={() => setEditing(s)} className="btn-ghost text-xs py-1 px-3">
                      Edit
                    </button>
                    <button onClick={() => deleteSchedule(s.id)} className="btn-ghost text-xs py-1 px-3">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
            {schedules.length === 0 && (
              <p className="text-[color:var(--muted)] text-sm">No schedules yet. Add one to start receiving emails.</p>
            )}
          </div>
        </section>

        <section className="fade-up delay-300">
          <h2 className="text-xl font-semibold mb-4">Plans</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {(Object.keys(PLAN_INFO) as Plan[]).map((p) => {
              const pi = PLAN_INFO[p];
              const current = p === plan;
              const featured = p === "DRIVE";
              const btn = buttonFor(p);
              return (
                <div
                  key={p}
                  className={`plan-card flex flex-col h-full relative ${current ? "current" : ""} ${featured && !current ? "ring-1 ring-[color:var(--accent)]/40" : ""}`}
                >
                  {current && (
                    <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full bg-[color:var(--accent)]/15 text-[color:var(--accent)]">
                      Current
                    </span>
                  )}
                  {featured && !current && (
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
                      onClick={btn.action}
                      disabled={btn.disabled}
                      className={`${btn.label === "Current plan" || btn.label === "Default tier" || btn.label === "Cancel" || btn.label === "Downgrade" ? "btn-ghost" : "btn-3d"} w-full text-sm disabled:opacity-50`}
                    >
                      {btn.label}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {editing && (
        <ScheduleForm
          allowedKinds={allowedKinds}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(s) => {
            setSchedules((prev) => prev.map((x) => (x.id === s.id ? { ...x, ...s } : x)));
            setEditing(null);
          }}
        />
      )}

      {planAction && (
        <PlanChangeModal
          action={planAction}
          schedules={schedules}
          onClose={() => setPlanAction(null)}
          onConfirm={() => changePlan(planAction.target)}
          busy={busy !== null}
        />
      )}
    </main>
  );
}

function PlanChangeModal({
  action,
  schedules,
  onClose,
  onConfirm,
  busy,
}: {
  action: { target: Plan; label: "Cancel" | "Downgrade" | "Upgrade" };
  schedules: Schedule[];
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  const targetAllowed = PLAN_ALLOWED[action.target];
  const affected = schedules.filter((s) => s.active && !targetAllowed.includes(s.kind));
  const targetName = PLAN_INFO[action.target].name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-2">
          {action.label} to {targetName}?
        </h3>

        {action.label === "Cancel" && (
          <p className="text-sm text-[color:var(--muted)] mb-4">
            Your paid subscription will be cancelled and you&apos;ll drop to the free Spark plan.
          </p>
        )}
        {action.label === "Downgrade" && (
          <p className="text-sm text-[color:var(--muted)] mb-4">
            Your plan changes to {targetName}. Billing adjusts at next cycle.
          </p>
        )}
        {action.label === "Upgrade" && (
          <p className="text-sm text-[color:var(--muted)] mb-4">
            Your plan changes to {targetName}. You&apos;ll be charged the prorated difference.
          </p>
        )}

        {affected.length > 0 && (
          <div className="alert-soft mb-4" style={{ borderColor: "rgba(239,68,68,.3)" }}>
            <p className="font-medium mb-2">These schedules will be deactivated:</p>
            <ul className="text-sm space-y-1">
              {affected.map((s) => (
                <li key={s.id}>
                  • <span className="font-medium">{s.prompt}</span>{" "}
                  <span className="text-[color:var(--muted)]">
                    ({KIND_LABEL[s.kind]} not allowed on {targetName})
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-[color:var(--muted)] mt-2">
              Edit the frequency to reactivate them.
            </p>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost text-sm py-2 px-4">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="btn-3d text-sm py-2 px-4"
          >
            {busy ? "Working…" : `Confirm ${action.label}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleForm({
  allowedKinds,
  initial,
  onClose,
  onSaved,
}: {
  allowedKinds: Kind[];
  initial: Schedule;
  onClose: () => void;
  onSaved: (s: Schedule) => void;
}) {
  const startKind = allowedKinds.includes(initial.kind) ? initial.kind : allowedKinds[0];
  const [kind, setKind] = useState<Kind>(startKind);
  const [hour, setHour] = useState<number>(initial.hour);
  const [dayOfWeek, setDayOfWeek] = useState<number>(initial.dayOfWeek ?? 1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(initial.dayOfMonth ?? 1);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { kind, hour, active: true };
      if (kind === "WEEKLY") payload.dayOfWeek = dayOfWeek;
      if (kind === "MONTHLY") payload.dayOfMonth = dayOfMonth;

      const r = await fetch(`/api/schedules/${initial.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      onSaved(data.schedule);
    } catch (e) {
      alert((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-1">Edit schedule</h3>
        <p className="text-sm text-[color:var(--muted)] mb-4 truncate">{initial.prompt}</p>

        <div className="mb-4">
          <label className="block text-sm mb-2">Frequency</label>
          <Select<Kind>
            value={kind}
            onChange={setKind}
            options={allowedKinds.map((k) => ({ value: k, label: KIND_LABEL[k] }))}
          />
        </div>

        {kind === "MONTHLY" && (
          <div className="mb-4">
            <label className="block text-sm mb-2">Day of month</label>
            <Select<number>
              value={dayOfMonth}
              onChange={setDayOfMonth}
              options={Array.from({ length: 31 }, (_, i) => ({
                value: i + 1,
                label: ordinal(i + 1),
              }))}
            />
            <p className="text-xs text-[color:var(--muted)] mt-1">
              If month has fewer days, sends on last day.
            </p>
          </div>
        )}

        {kind === "WEEKLY" && (
          <div className="mb-4">
            <label className="block text-sm mb-2">Day of week</label>
            <Select<number>
              value={dayOfWeek}
              onChange={setDayOfWeek}
              options={WEEKDAYS.map((name, i) => ({ value: i, label: name }))}
            />
          </div>
        )}

        <div className="mb-5">
          <label className="block text-sm mb-2">Hour of day</label>
          <Select<number>
            value={hour}
            onChange={setHour}
            options={Array.from({ length: 24 }, (_, i) => ({
              value: i,
              label: formatHour(i),
            }))}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost text-sm py-2 px-4">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="btn-3d text-sm py-2 px-4">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
