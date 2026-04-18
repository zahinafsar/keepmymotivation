import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { changeLsSubscriptionPlan, cancelLsSubscription } from "@/lib/lemonsqueezy";
import { PLAN_ALLOWED_KINDS } from "@/lib/plan";
import type { Plan } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.subscription) {
    return NextResponse.json({ error: "No subscription" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const target = body.plan as Plan;
  if (target !== "SPARK" && target !== "BOOST" && target !== "DRIVE") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const lsId = user.subscription.lsSubscriptionId;

  try {
    if (target === "SPARK") {
      if (!lsId) {
        return NextResponse.json({ error: "No paid subscription to cancel" }, { status: 400 });
      }
      await cancelLsSubscription(lsId);
    } else {
      if (!lsId) {
        return NextResponse.json(
          { error: "No existing subscription. Use checkout flow." },
          { status: 400 }
        );
      }
      await changeLsSubscriptionPlan(lsId, target);
    }
  } catch (e) {
    console.error("LS change-plan failed", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  // Optimistic local deactivation of invalid-kind goals. Webhook will confirm.
  const allowed = PLAN_ALLOWED_KINDS[target];
  await prisma.goal.updateMany({
    where: { userId: user.id, kind: { notIn: allowed } },
    data: { active: false },
  });

  if (target === "SPARK") {
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { status: "CANCELED" },
    });
  }

  return NextResponse.json({ ok: true });
}
