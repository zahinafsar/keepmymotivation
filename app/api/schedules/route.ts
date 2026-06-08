import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { hasAccess } from "@/lib/plan";
import type { ScheduleKind } from "@prisma/client";

export const runtime = "nodejs";

type CreateBody = {
  prompt: string;
  kind: ScheduleKind;
  hour: number;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
};

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schedules = await prisma.schedule.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ schedules });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.subscription) return NextResponse.json({ error: "No subscription" }, { status: 400 });
  if (!hasAccess(user.subscription, new Date())) {
    return NextResponse.json(
      { error: "Your trial has ended. Subscribe to add schedules." },
      { status: 403 }
    );
  }

  const b = (await req.json().catch(() => null)) as CreateBody | null;
  if (!b || !b.prompt || b.prompt.trim().length < 4) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (typeof b.hour !== "number" || b.hour < 0 || b.hour > 23) {
    return NextResponse.json({ error: "hour must be 0-23" }, { status: 400 });
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

  const created = await prisma.schedule.create({
    data: {
      userId: user.id,
      prompt: b.prompt.trim(),
      kind: b.kind,
      hour: b.hour,
      dayOfWeek,
      dayOfMonth,
    },
  });
  return NextResponse.json({ schedule: created }, { status: 201 });
}
