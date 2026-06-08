import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { checkoutUrlForPro } from "@/lib/lemonsqueezy";
import { env } from "@/lib/env";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const base = new URL(checkoutUrlForPro());
  base.searchParams.set("checkout[email]", user.email);
  base.searchParams.set("checkout[custom][user_id]", user.id);
  base.searchParams.set("checkout[success_url]", `${env.APP_URL}/dashboard?upgraded=1`);

  return NextResponse.json({ url: base.toString() });
}
