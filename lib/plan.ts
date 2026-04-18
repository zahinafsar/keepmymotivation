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

export const KIND_WINDOW_MS: Record<ScheduleKind, number> = {
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
};

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
