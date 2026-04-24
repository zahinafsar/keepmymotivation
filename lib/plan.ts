import { DateTime } from "luxon";
import type { Plan, ScheduleKind } from "@prisma/client";

export const PLAN_MAX_SCHEDULES: Record<Plan, number> = {
  SPARK: 1,
  BOOST: 1,
  DRIVE: 5,
};

export const PLAN_ALLOWED_KINDS: Record<Plan, ScheduleKind[]> = {
  SPARK: ["MONTHLY"],
  BOOST: ["MONTHLY", "WEEKLY"],
  DRIVE: ["MONTHLY", "WEEKLY", "DAILY"],
};

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
