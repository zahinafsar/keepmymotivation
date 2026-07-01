import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPin, isValidPin } from "@/lib/pin";
import { setSessionCookie } from "@/lib/session";
import { trialEndDate } from "@/lib/plan";

type Body = {
  fullname: string;
  email: string;
  pin: string;
  timezone: string;
};

export async function POST(req: NextRequest) {
  const b = (await req.json()) as Body;

  if (!b.fullname || !b.email || !b.pin) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!isValidPin(b.pin)) {
    return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 });
  }

  const verification = await prisma.emailVerification.findUnique({ where: { email: b.email } });
  if (!verification?.verified) {
    return NextResponse.json({ error: "Email not verified" }, { status: 400 });
  }

  const pinHash = await hashPin(b.pin);

  const now = new Date();

  const user = await prisma.user.create({
    data: {
      fullname: b.fullname.trim(),
      email: b.email.trim().toLowerCase(),
      pinHash,
      timezone: b.timezone || "UTC",
      subscription: {
        create: { plan: "PRO", status: "TRIALING", trialEndsAt: trialEndDate(now) },
      },
    },
  });

  await prisma.emailVerification.delete({ where: { email: b.email } }).catch(() => {});

  await setSessionCookie(user.id);

  return NextResponse.json({ ok: true, userId: user.id });
}
