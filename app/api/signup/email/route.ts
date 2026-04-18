import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { generateOtp } from "@/lib/session";
import OtpEmail from "@/emails/OtpEmail";

export async function POST(req: NextRequest) {
  const { fullname, email } = await req.json();
  if (typeof email !== "string" || !/.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (typeof fullname !== "string" || fullname.trim().length < 2) {
    return NextResponse.json({ error: "Fullname required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered. Log in instead." }, { status: 409 });
  }

  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.emailVerification.upsert({
    where: { email },
    update: { codeHash, expiresAt, attempts: 0, verified: false },
    create: { email, codeHash, expiresAt },
  });

  try {
    await sendEmail({
      to: email,
      subject: "Your KeepMyMotivation code",
      react: OtpEmail({ code, fullname }),
    });
  } catch (e) {
    console.error("OTP send failed", e);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
