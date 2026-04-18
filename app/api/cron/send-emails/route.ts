import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendMotivationEmailForUser } from "@/lib/email-dispatcher";
import {
  PLAN_MAX_SCHEDULES,
  PLAN_ALLOWED_KINDS,
  KIND_WINDOW_MS,
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
  const nowMs = now.toMillis();

  const users = await prisma.user.findMany({
    where: {
      subscription: { status: "ACTIVE" },
      goals: { some: { active: true } },
    },
    include: {
      subscription: true,
      goals: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const results: Array<{
    userId: string;
    goalId: string;
    sent: boolean;
    reason?: string;
  }> = [];

  for (const user of users) {
    if (!user.subscription) continue;
    const plan = user.subscription.plan;
    const cap = PLAN_MAX_SCHEDULES[plan];
    const activeGoals = user.goals.slice(0, cap);

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

    for (const goal of activeGoals) {
      if (!allowedKinds.includes(goal.kind)) {
        results.push({
          userId: user.id,
          goalId: goal.id,
          sent: false,
          reason: "kind-not-allowed-on-plan",
        });
        continue;
      }
      if (!matchesSchedule(goal.kind, goal, localCtx)) {
        results.push({ userId: user.id, goalId: goal.id, sent: false, reason: "no-match" });
        continue;
      }

      const last = await prisma.emailLog.findFirst({
        where: { goalId: goal.id },
        orderBy: { sentAt: "desc" },
      });
      if (last) {
        const elapsed = nowMs - last.sentAt.getTime();
        if (elapsed < KIND_WINDOW_MS[goal.kind]) {
          results.push({
            userId: user.id,
            goalId: goal.id,
            sent: false,
            reason: "window-not-elapsed",
          });
          continue;
        }
      }

      try {
        await sendMotivationEmailForUser(user.id, { goalId: goal.id });
        results.push({ userId: user.id, goalId: goal.id, sent: true });
      } catch (e) {
        console.error("send failed", user.id, goal.id, e);
        results.push({
          userId: user.id,
          goalId: goal.id,
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
