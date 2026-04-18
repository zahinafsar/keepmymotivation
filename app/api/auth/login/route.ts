import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPin } from "@/lib/pin";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, pin } = await req.json();
  if (typeof email !== "string" || typeof pin !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    return NextResponse.json({ error: "Incorrect email or PIN" }, { status: 401 });
  }
  const ok = await verifyPin(pin, user.pinHash);
  if (!ok) {
    return NextResponse.json({ error: "Incorrect email or PIN" }, { status: 401 });
  }

  await setSessionCookie(user.id);
  return NextResponse.json({ ok: true });
}
