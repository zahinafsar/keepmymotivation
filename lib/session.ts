import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { env } from "./env";

const COOKIE_NAME = "kmm_session";
const SESSION_DAYS = 30;

function sign(token: string): string {
  return createHmac("sha256", env.SESSION_SECRET()).update(token).digest("hex");
}

function verifySig(token: string, sig: string): boolean {
  const expected = sign(token);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  return `${token}.${sign(token)}`;
}

export async function setSessionCookie(userId: string) {
  const value = await createSession(userId);
  const store = await cookies();
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getSessionUser() {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [token, sig] = raw.split(".");
  if (!token || !sig || !verifySig(token, sig)) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { subscription: true, goal: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function destroySession() {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (raw) {
    const [token] = raw.split(".");
    if (token) {
      await prisma.session.deleteMany({ where: { token } }).catch(() => {});
    }
  }
  store.delete(COOKIE_NAME);
}

// OTP helpers (not strictly session, but cryptographic peers)
export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
