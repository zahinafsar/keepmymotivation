import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();
  if (typeof email !== "string" || typeof code !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const rec = await prisma.emailVerification.findUnique({ where: { email } });
  if (!rec || rec.expiresAt < new Date()) {
    return NextResponse.json({ error: "Code expired. Resend it." }, { status: 400 });
  }
  if (rec.attempts >= 6) {
    return NextResponse.json({ error: "Too many attempts. Resend a new code." }, { status: 429 });
  }

  const ok = await bcrypt.compare(code, rec.codeHash);
  if (!ok) {
    await prisma.emailVerification.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
  }

  await prisma.emailVerification.update({
    where: { email },
    data: { verified: true },
  });

  return NextResponse.json({ ok: true });
}
