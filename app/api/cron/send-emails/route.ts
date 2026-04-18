import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendMotivationEmailForUser } from "@/lib/email-dispatcher";
import type { Plan } from "@prisma/client";

const PLAN_WINDOW_MS: Record<Plan, number> = {
  SPARK: 30 * 24 * 60 * 60 * 1000,
  BOOST: 7 * 24 * 60 * 60 * 1000,
  DRIVE: 1 * 24 * 60 * 60 * 1000,
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== env.CRON_SECRET()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = DateTime.utc();
  const nowMs = now.toMillis();

  // Candidates: active subs with a goal.
  const users = await prisma.user.findMany({
    where: {
      subscription: { status: "ACTIVE" },
      goal: { isNot: null },
    },
    include: {
      goal: true,
      subscription: true,
      emailLogs: { orderBy: { sentAt: "desc" }, take: 1 },
    },
  });

  const results: Array<{ userId: string; sent: boolean; reason?: string }> = [];

  for (const user of users) {
    if (!user.goal || !user.subscription) continue;
    const plan = user.subscription.plan;

    // Match hour in user's timezone.
    let localHour: number;
    try {
      localHour = now.setZone(user.timezone).hour;
    } catch {
      localHour = now.hour;
    }
    if (localHour !== user.goal.sendHour) {
      results.push({ userId: user.id, sent: false, reason: "hour-mismatch" });
      continue;
    }

    const last = user.emailLogs[0];
    if (last) {
      const elapsed = nowMs - last.sentAt.getTime();
      if (elapsed < PLAN_WINDOW_MS[plan]) {
        results.push({ userId: user.id, sent: false, reason: "window-not-elapsed" });
        continue;
      }
    }

    try {
      await sendMotivationEmailForUser(user.id);
      results.push({ userId: user.id, sent: true });
    } catch (e) {
      console.error("send failed", user.id, e);
      results.push({ userId: user.id, sent: false, reason: (e as Error).message });
    }
  }

  return NextResponse.json({
    ranAt: now.toISO(),
    total: results.length,
    sent: results.filter((r) => r.sent).length,
    results,
  });
}
