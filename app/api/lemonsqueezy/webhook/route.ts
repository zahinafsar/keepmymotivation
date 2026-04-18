import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyLemonSignature,
  mapLsStatus,
  type LsSubscriptionPayload,
  type LsInvoicePayload,
} from "@/lib/lemonsqueezy";
import type { Plan } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature");
  if (!verifyLemonSignature(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = req.headers.get("x-event-name") ?? "";
  let body: LsSubscriptionPayload | LsInvoicePayload;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  try {
    switch (event) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_cancelled":
      case "subscription_expired": {
        const p = body as LsSubscriptionPayload;
        const userId = p.meta.custom_data?.user_id;
        if (!userId) break;
        const planRaw = p.meta.custom_data?.plan;
        const plan: Plan =
          planRaw === "BOOST" || planRaw === "DRIVE" ? planRaw : "SPARK";

        const status = mapLsStatus(p.data.attributes.status);
        const periodEndIso =
          p.data.attributes.ends_at ?? p.data.attributes.renews_at ?? null;

        await prisma.subscription.update({
          where: { userId },
          data: {
            plan: status === "CANCELED" ? "SPARK" : plan,
            status,
            lsSubscriptionId: p.data.id,
            lsCustomerId: String(p.data.attributes.customer_id),
            currentPeriodEnd: periodEndIso ? new Date(periodEndIso) : null,
          },
        });
        break;
      }

      case "subscription_payment_success": {
        const p = body as LsInvoicePayload;
        const userId = p.meta.custom_data?.user_id;
        if (!userId) break;
        await prisma.subscription.update({
          where: { userId },
          data: { status: "ACTIVE" },
        });
        break;
      }

      case "subscription_payment_failed": {
        const p = body as LsInvoicePayload;
        const userId = p.meta.custom_data?.user_id;
        if (!userId) break;
        await prisma.subscription.update({
          where: { userId },
          data: { status: "PAST_DUE" },
        });
        break;
      }
    }
  } catch (e) {
    console.error("LS webhook handler failed", e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
