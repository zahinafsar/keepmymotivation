import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { PLAN_ALLOWED_KINDS, PLAN_MAX_SCHEDULES } from "@/lib/plan";
import type { ScheduleKind } from "@prisma/client";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.subscription) return NextResponse.json({ error: "No subscription" }, { status: 400 });

  const { id } = await params;
  const existing = await prisma.goal.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const plan = user.subscription.plan;
  const allowed = PLAN_ALLOWED_KINDS[plan];
  const cap = PLAN_MAX_SCHEDULES[plan];
  const body = await req.json().catch(() => ({}));

  const kind = (body.kind ?? existing.kind) as ScheduleKind;
  if (!allowed.includes(kind)) {
    return NextResponse.json(
      { error: `Plan ${plan} doesn't allow ${kind} schedules.` },
      { status: 403 }
    );
  }

  const hour = body.hour ?? existing.hour;
  if (typeof hour !== "number" || !Number.isInteger(hour) || hour < 0 || hour > 23) {
    return NextResponse.json({ error: "hour must be 0-23" }, { status: 400 });
  }

  let dayOfWeek: number | null = null;
  let dayOfMonth: number | null = null;

  if (kind === "WEEKLY") {
    const d = body.dayOfWeek ?? existing.dayOfWeek;
    if (typeof d !== "number" || d < 0 || d > 6) {
      return NextResponse.json({ error: "dayOfWeek must be 0-6" }, { status: 400 });
    }
    dayOfWeek = d;
  } else if (kind === "MONTHLY") {
    const d = body.dayOfMonth ?? existing.dayOfMonth;
    if (typeof d !== "number" || d < 1 || d > 31) {
      return NextResponse.json({ error: "dayOfMonth must be 1-31" }, { status: 400 });
    }
    dayOfMonth = d;
  }

  const wantActive = body.active === undefined ? existing.active : Boolean(body.active);

  if (wantActive && !existing.active) {
    const activeCount = await prisma.goal.count({
      where: { userId: user.id, active: true },
    });
    if (activeCount >= cap) {
      return NextResponse.json(
        { error: `Plan ${plan} allows ${cap} active goal(s). Deactivate another first.` },
        { status: 403 }
      );
    }
  }

  const updated = await prisma.goal.update({
    where: { id },
    data: { kind, hour, dayOfWeek, dayOfMonth, active: wantActive },
  });
  return NextResponse.json({ goal: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.goal.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
