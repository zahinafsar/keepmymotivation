import { DateTime } from "luxon";
import type { ScheduleKind, SubStatus } from "@prisma/client";

export const TRIAL_DAYS = 7;
export const PLAN_PRICE = "$5";

/**
 * Single-plan access model: full access during an unexpired trial or while paid.
 * No per-tier caps or kind restrictions — everything is unlocked when access is granted.
 */
export function hasAccess(
  sub: { status: SubStatus; trialEndsAt: Date | null },
  now: Date
): boolean {
  if (sub.status === "ACTIVE") return true;
  if (sub.status === "TRIALING") return !!sub.trialEndsAt && sub.trialEndsAt > now;
  return false; // PAST_DUE / CANCELED → no access
}

export function trialEndDate(from: Date): Date {
  return new Date(from.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function alreadySentThisPeriod(
  kind: ScheduleKind,
  lastSentUtc: Date,
  tz: string,
  now: DateTime
): boolean {
  const cur = now.setZone(tz);
  const last = DateTime.fromJSDate(lastSentUtc, { zone: "utc" }).setZone(tz);
  if (kind === "DAILY") return last.hasSame(cur, "day");
  if (kind === "WEEKLY")
    return last.weekYear === cur.weekYear && last.weekNumber === cur.weekNumber;
  return last.year === cur.year && last.month === cur.month;
}

export function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

export function matchesSchedule(
  kind: ScheduleKind,
  sched: { hour: number; dayOfWeek: number | null; dayOfMonth: number | null },
  local: { hour: number; weekday: number; day: number; year: number; month: number }
): boolean {
  if (sched.hour !== local.hour) return false;
  if (kind === "DAILY") return true;
  if (kind === "WEEKLY") return sched.dayOfWeek === local.weekday;
  const target = sched.dayOfMonth ?? 1;
  const last = daysInMonth(local.year, local.month);
  const effective = Math.min(target, last);
  return effective === local.day;
}
