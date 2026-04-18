import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPin, isValidPin } from "@/lib/pin";
import { setSessionCookie } from "@/lib/session";
import { sendMotivationEmailForUser } from "@/lib/email-dispatcher";

type Body = {
  fullname: string;
  email: string;
  pin: string;
  timezone: string;
  sendHour: number;
  goal: string;
  clarifyQA: Array<{ q: string; a: string }>;
  theme: string;
  imageKeyword: string;
  subjectHint: string;
};

export async function POST(req: NextRequest) {
  const b = (await req.json()) as Body;

  if (!b.fullname || !b.email || !b.pin || !b.goal || !b.theme) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!isValidPin(b.pin)) {
    return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 });
  }
  if (!Number.isInteger(b.sendHour) || b.sendHour < 0 || b.sendHour > 23) {
    return NextResponse.json({ error: "Invalid sendHour" }, { status: 400 });
  }

  const verification = await prisma.emailVerification.findUnique({ where: { email: b.email } });
  if (!verification?.verified) {
    return NextResponse.json({ error: "Email not verified" }, { status: 400 });
  }

  const pinHash = await hashPin(b.pin);

  const now = new Date();
  const dayOfMonth = now.getUTCDate();

  const user = await prisma.user.create({
    data: {
      fullname: b.fullname.trim(),
      email: b.email.trim().toLowerCase(),
      pinHash,
      timezone: b.timezone || "UTC",
      goals: {
        create: {
          goalText: b.goal,
          clarifyQA: b.clarifyQA ?? [],
          theme: b.theme,
          imageKeyword: b.imageKeyword,
          subjectHint: b.subjectHint,
          kind: "MONTHLY",
          hour: b.sendHour,
          dayOfMonth,
          dayOfWeek: null,
        },
      },
      subscription: { create: { plan: "SPARK", status: "ACTIVE" } },
    },
    include: { goals: true },
  });

  await prisma.emailVerification.delete({ where: { email: b.email } }).catch(() => {});

  await setSessionCookie(user.id);

  // Fire preview email async; don't fail signup if email send hiccups.
  sendMotivationEmailForUser(user.id, { preview: true }).catch((e) =>
    console.error("Preview email failed", e)
  );

  return NextResponse.json({ ok: true, userId: user.id });
}
