import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { checkoutUrlForPlan } from "@/lib/lemonsqueezy";
import { env } from "@/lib/env";
import type { Plan } from "@prisma/client";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { plan } = (await req.json()) as { plan: Plan };
  if (plan !== "BOOST" && plan !== "DRIVE") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const base = new URL(checkoutUrlForPlan(plan));
  base.searchParams.set("checkout[email]", user.email);
  base.searchParams.set("checkout[custom][user_id]", user.id);
  base.searchParams.set("checkout[custom][plan]", plan);
  base.searchParams.set("checkout[success_url]", `${env.APP_URL}/dashboard?upgraded=1`);

  return NextResponse.json({ url: base.toString() });
}
