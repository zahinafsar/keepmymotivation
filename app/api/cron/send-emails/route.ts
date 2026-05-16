import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendScheduledEmailForUser } from "@/lib/email-dispatcher";
import {
  PLAN_MAX_SCHEDULES,
  PLAN_ALLOWED_KINDS,
  alreadySentThisPeriod,
  matchesSchedule,
} from "@/lib/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== env.CRON_SECRET()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = DateTime.utc();

  const users = await prisma.user.findMany({
    where: {
      subscription: { status: "ACTIVE" },
      schedules: { some: { active: true } },
    },
    include: {
      subscription: true,
      schedules: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const results: Array<{
    userId: string;
    scheduleId: string;
    sent: boolean;
    reason?: string;
  }> = [];

  for (const user of users) {
    if (!user.subscription) continue;
    const plan = user.subscription.plan;
    const cap = PLAN_MAX_SCHEDULES[plan];
    const activeSchedules = user.schedules.slice(0, cap);

    let local: DateTime;
    try {
      local = now.setZone(user.timezone);
    } catch {
      local = now;
    }
    const localCtx = {
      hour: local.hour,
      weekday: local.weekday % 7,
      day: local.day,
      year: local.year,
      month: local.month,
    };

    const allowedKinds = PLAN_ALLOWED_KINDS[plan];

    for (const schedule of activeSchedules) {
      if (!allowedKinds.includes(schedule.kind)) {
        results.push({
          userId: user.id,
          scheduleId: schedule.id,
          sent: false,
          reason: "kind-not-allowed-on-plan",
        });
        continue;
      }
      if (!matchesSchedule(schedule.kind, schedule, localCtx)) {
        results.push({ userId: user.id, scheduleId: schedule.id, sent: false, reason: "no-match" });
        continue;
      }

      const last = await prisma.emailLog.findFirst({
        where: { scheduleId: schedule.id },
        orderBy: { sentAt: "desc" },
        select: { sentAt: true },
      });
      if (last && alreadySentThisPeriod(schedule.kind, last.sentAt, user.timezone, now)) {
        results.push({
          userId: user.id,
          scheduleId: schedule.id,
          sent: false,
          reason: "already-sent-this-period",
        });
        continue;
      }

      try {
        await sendScheduledEmailForUser(user.id, { scheduleId: schedule.id });
        results.push({ userId: user.id, scheduleId: schedule.id, sent: true });
      } catch (e) {
        console.error("send failed", user.id, schedule.id, e);
        results.push({
          userId: user.id,
          scheduleId: schedule.id,
          sent: false,
          reason: (e as Error).message,
        });
      }
    }
  }

  return NextResponse.json({
    ranAt: now.toISO(),
    total: results.length,
    sent: results.filter((r) => r.sent).length,
    results,
  });
}
