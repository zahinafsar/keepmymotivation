import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { cancelLsSubscription } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.subscription?.lsSubscriptionId) {
    return NextResponse.json({ error: "No active paid subscription" }, { status: 400 });
  }

  try {
    await cancelLsSubscription(user.subscription.lsSubscriptionId);
  } catch (e) {
    console.error("LS cancel failed", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  // Webhook will confirm status change; optimistic local update for immediate UX.
  await prisma.subscription.update({
    where: { userId: user.id },
    data: { status: "CANCELED" },
  });

  return NextResponse.json({ ok: true });
}
