"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Select from "@/components/Select";
import AnalogClock from "@/components/AnalogClock";

type Status = "TRIALING" | "ACTIVE" | "CANCELED" | "PAST_DUE";
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

type Subscription = {
  status: Status;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
};

type Props = {
  user: { fullname: string; email: string; timezone: string };
  subscription: Subscription | null;
  schedules: Schedule[];
  lastEmailAt: string | null;
  welcome: boolean;
  upgraded: boolean;
};

const PLAN_PRICE = "$5";
const ALL_KINDS: Kind[] = ["DAILY", "WEEKLY", "MONTHLY"];

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

function hasAccess(sub: Subscription | null): boolean {
  if (!sub) return false;
  if (sub.status === "ACTIVE") return true;
  if (sub.status === "TRIALING") {
    return !!sub.trialEndsAt && new Date(sub.trialEndsAt) > new Date();
  }
  return false;
}

function trialDaysLeft(sub: Subscription | null): number {
  if (!sub?.trialEndsAt) return 0;
  const ms = new Date(sub.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default function DashboardClient(props: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>(props.schedules);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const sub = props.subscription;
  const access = hasAccess(sub);
  const isPaid = sub?.status === "ACTIVE";
  const activeSchedules = schedules.filter((s) => s.active);
  const activeCount = activeSchedules.length;

  async function subscribe() {
    setBusy("subscribe");
    try {
      const r = await fetch("/api/lemonsqueezy/checkout", { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      window.location.href = data.url;
    } catch (e) {
      alert((e as Error).message);
      setBusy(null);
    }
  }

  async function cancel() {
    setBusy("cancel");
    try {
      const r = await fetch("/api/lemonsqueezy/cancel", { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
      setConfirmCancel(false);
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

  const planLabel = isPaid
    ? "Active"
    : sub?.status === "TRIALING" && access
    ? `Trial — ${trialDaysLeft(sub)} day${trialDaysLeft(sub) === 1 ? "" : "s"} left`
    : "No active plan";

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
                You&apos;re in, {props.user.fullname.split(" ")[0]}. Your 7-day free trial has
                started and your first email is on its way — check your inbox.
              </p>
            )}
            {props.upgraded && <p>You&apos;re subscribed. Emails keep going out on your schedule.</p>}
          </div>
        )}

        <section className="glass glass-hover p-6 mb-10 fade-up delay-100 flex items-center gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-2">
              Your plan
            </p>
            <p className="text-lg font-semibold text-gradient">{planLabel}</p>
            <p className="text-sm text-[color:var(--muted)]">
              {access
                ? `Everything unlocked · ${activeCount} active schedule${activeCount === 1 ? "" : "s"}`
                : "Subscribe to keep your emails running"}
            </p>
            <p className="text-xs text-[color:var(--muted)] mt-3">
              Timezone: {props.user.timezone}
            </p>
            {props.lastEmailAt && (
              <p className="text-xs text-[color:var(--muted)]">
                Last email: {new Date(props.lastEmailAt).toLocaleString()}
              </p>
            )}

            <div className="mt-4">
              {isPaid ? (
                <button
                  onClick={() => setConfirmCancel(true)}
                  disabled={busy !== null}
                  className="btn-ghost text-sm py-2 px-4 disabled:opacity-50"
                >
                  Cancel subscription
                </button>
              ) : (
                <button
                  onClick={subscribe}
                  disabled={busy !== null}
                  className="btn-3d text-sm py-2 px-4 disabled:opacity-50"
                >
                  {busy === "subscribe" ? "Working…" : `Subscribe — ${PLAN_PRICE}/mo`}
                </button>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <AnalogClock timezone={props.user.timezone} size={160} />
          </div>
        </section>

        <section className="fade-up delay-200 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Schedules{" "}
              <span className="text-[color:var(--muted)] text-sm font-normal">
                ({activeCount} active)
              </span>
            </h2>
            <button
              onClick={() => router.push("/schedules/new")}
              disabled={!access}
              title={access ? undefined : "Subscribe to add schedules"}
              className="btn-3d text-sm py-2 px-4 disabled:opacity-50"
            >
              + Add schedule
            </button>
          </div>

          <div className="grid gap-3">
            {schedules.map((s) => (
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
                      onClick={() => setActive(s, true)}
                      disabled={busy === s.id || !access}
                      title={access ? undefined : "Subscribe to activate"}
                      className="btn-ghost text-xs py-1 px-3 disabled:opacity-50"
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
            ))}
            {schedules.length === 0 && (
              <p className="text-[color:var(--muted)] text-sm">No schedules yet. Add one to start receiving emails.</p>
            )}
          </div>
        </section>
      </div>

      {editing && (
        <ScheduleForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(s) => {
            setSchedules((prev) => prev.map((x) => (x.id === s.id ? { ...x, ...s } : x)));
            setEditing(null);
          }}
        />
      )}

      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Cancel subscription?</h3>
            <p className="text-sm text-[color:var(--muted)] mb-4">
              Your subscription will be cancelled and emails stop sending once access ends. You can
              resubscribe anytime.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmCancel(false)} className="btn-ghost text-sm py-2 px-4">
                Keep plan
              </button>
              <button
                onClick={cancel}
                disabled={busy !== null}
                className="btn-3d text-sm py-2 px-4"
              >
                {busy === "cancel" ? "Working…" : "Confirm cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ScheduleForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Schedule;
  onClose: () => void;
  onSaved: (s: Schedule) => void;
}) {
  const [kind, setKind] = useState<Kind>(initial.kind);
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
            options={ALL_KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))}
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
