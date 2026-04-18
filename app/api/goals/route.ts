import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { PLAN_ALLOWED_KINDS, PLAN_MAX_SCHEDULES } from "@/lib/plan";
import type { ScheduleKind } from "@prisma/client";

export const runtime = "nodejs";

type CreateBody = {
  goal: string;
  clarifyQA: Array<{ q: string; a: string }>;
  theme: string;
  imageKeyword: string;
  subjectHint: string;
  kind: ScheduleKind;
  hour: number;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
};

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  const plan = user.subscription?.plan ?? "SPARK";
  return NextResponse.json({
    goals,
    plan,
    allowedKinds: PLAN_ALLOWED_KINDS[plan],
    max: PLAN_MAX_SCHEDULES[plan],
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.subscription) return NextResponse.json({ error: "No subscription" }, { status: 400 });

  const plan = user.subscription.plan;
  const allowed = PLAN_ALLOWED_KINDS[plan];
  const cap = PLAN_MAX_SCHEDULES[plan];

  const activeCount = await prisma.goal.count({
    where: { userId: user.id, active: true },
  });
  if (activeCount >= cap) {
    return NextResponse.json(
      { error: `Plan ${plan} allows ${cap} active goal(s). Deactivate or delete one first.` },
      { status: 403 }
    );
  }

  const b = (await req.json().catch(() => null)) as CreateBody | null;
  if (!b || !b.goal || !b.theme || !b.imageKeyword || !b.subjectHint) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (typeof b.hour !== "number" || b.hour < 0 || b.hour > 23) {
    return NextResponse.json({ error: "hour must be 0-23" }, { status: 400 });
  }
  if (!allowed.includes(b.kind)) {
    return NextResponse.json(
      { error: `Plan ${plan} doesn't allow ${b.kind} schedules.` },
      { status: 403 }
    );
  }

  let dayOfWeek: number | null = null;
  let dayOfMonth: number | null = null;
  if (b.kind === "WEEKLY") {
    if (typeof b.dayOfWeek !== "number" || b.dayOfWeek < 0 || b.dayOfWeek > 6) {
      return NextResponse.json({ error: "dayOfWeek must be 0-6" }, { status: 400 });
    }
    dayOfWeek = b.dayOfWeek;
  } else if (b.kind === "MONTHLY") {
    if (typeof b.dayOfMonth !== "number" || b.dayOfMonth < 1 || b.dayOfMonth > 31) {
      return NextResponse.json({ error: "dayOfMonth must be 1-31" }, { status: 400 });
    }
    dayOfMonth = b.dayOfMonth;
  }

  const created = await prisma.goal.create({
    data: {
      userId: user.id,
      goalText: b.goal,
      clarifyQA: b.clarifyQA ?? [],
      theme: b.theme,
      imageKeyword: b.imageKeyword,
      subjectHint: b.subjectHint,
      kind: b.kind,
      hour: b.hour,
      dayOfWeek,
      dayOfMonth,
    },
  });
  return NextResponse.json({ goal: created }, { status: 201 });
}
