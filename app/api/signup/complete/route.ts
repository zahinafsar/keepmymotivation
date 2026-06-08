import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPin, isValidPin } from "@/lib/pin";
import { setSessionCookie } from "@/lib/session";
import { sendScheduledEmailForUser } from "@/lib/email-dispatcher";
import { trialEndDate } from "@/lib/plan";

type Body = {
  fullname: string;
  email: string;
  pin: string;
  timezone: string;
  prompt: string;
  kind: "DAILY" | "WEEKLY" | "MONTHLY";
  hour: number;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
};

export async function POST(req: NextRequest) {
  const b = (await req.json()) as Body;

  if (!b.fullname || !b.email || !b.pin || !b.prompt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!isValidPin(b.pin)) {
    return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 });
  }
  if (!Number.isInteger(b.hour) || b.hour < 0 || b.hour > 23) {
    return NextResponse.json({ error: "Invalid hour" }, { status: 400 });
  }

  const verification = await prisma.emailVerification.findUnique({ where: { email: b.email } });
  if (!verification?.verified) {
    return NextResponse.json({ error: "Email not verified" }, { status: 400 });
  }

  const pinHash = await hashPin(b.pin);

  const now = new Date();
  const kind = b.kind ?? "DAILY";
  const dayOfWeek = kind === "WEEKLY" ? b.dayOfWeek ?? 1 : null;
  const dayOfMonth = kind === "MONTHLY" ? b.dayOfMonth ?? now.getUTCDate() : null;

  const user = await prisma.user.create({
    data: {
      fullname: b.fullname.trim(),
      email: b.email.trim().toLowerCase(),
      pinHash,
      timezone: b.timezone || "UTC",
      schedules: {
        create: {
          prompt: b.prompt.trim(),
          kind,
          hour: b.hour,
          dayOfWeek,
          dayOfMonth,
        },
      },
      subscription: {
        create: { plan: "PRO", status: "TRIALING", trialEndsAt: trialEndDate(now) },
      },
    },
    include: { schedules: true },
  });

  await prisma.emailVerification.delete({ where: { email: b.email } }).catch(() => {});

  await setSessionCookie(user.id);

  // Fire preview email async; don't fail signup if email send hiccups.
  sendScheduledEmailForUser(user.id, { preview: true }).catch((e) =>
    console.error("Preview email failed", e)
  );

  return NextResponse.json({ ok: true, userId: user.id });
}
