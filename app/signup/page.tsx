"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Onboarding = {
  goal: string;
  clarifyQA: Array<{ q: string; a: string }>;
  theme: string;
  imageKeyword: string;
  subjectHint: string;
  sendHour: number;
  timezone: string;
};

type Stage = "name" | "email" | "otp" | "pin" | "done";

export default function SignupPage() {
  const router = useRouter();
  const [onboarding, setOnboarding] = useState<Onboarding | null>(null);
  const [stage, setStage] = useState<Stage>("name");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("kmm_onboarding");
    if (!raw) {
      router.replace("/");
      return;
    }
    setOnboarding(JSON.parse(raw) as Onboarding);
  }, [router]);

  if (!onboarding) {
    return (
      <main className="min-h-screen flex items-center justify-center text-[color:var(--muted)]">
        Loading…
      </main>
    );
  }

  async function submitName(e: React.FormEvent) {
    e.preventDefault();
    if (fullname.trim().length < 2) {
      setError("Enter your full name");
      return;
    }
    setError(null);
    setStage("email");
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) {
      setError("Enter a valid email");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/signup/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullname, email }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      setStage("otp");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/signup/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      setStage("pin");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function submitPin(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      setError("PIN must be 4-6 digits");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs don't match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/signup/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullname, email, pin, ...onboarding }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      sessionStorage.removeItem("kmm_onboarding");
      router.push("/dashboard?welcome=1");
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  const progress = { name: 1, email: 2, otp: 3, pin: 4, done: 4 }[stage];

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 py-5 max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[color:var(--accent)] flex items-center justify-center font-bold text-[color:var(--background)]">
            K
          </span>
          <span className="font-semibold tracking-tight">KeepMyMotivation</span>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= progress ? "bg-[color:var(--accent)]" : "bg-[color:var(--panel-border)]"
                }`}
              />
            ))}
          </div>

          {stage === "name" && (
            <form onSubmit={submitName} className="space-y-4">
              <h1 className="text-2xl font-bold mb-1">What&apos;s your name?</h1>
              <p className="text-[color:var(--muted)] mb-4">We&apos;ll use it in your emails.</p>
              <input
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-4 outline-none focus:border-[color:var(--accent)]"
                autoFocus
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[color:var(--accent)] text-[color:var(--background)] font-semibold"
              >
                Continue
              </button>
            </form>
          )}

          {stage === "email" && (
            <form onSubmit={sendOtp} className="space-y-4">
              <h1 className="text-2xl font-bold mb-1">Your email</h1>
              <p className="text-[color:var(--muted)] mb-4">We&apos;ll send a 6-digit code.</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-4 outline-none focus:border-[color:var(--accent)]"
                autoFocus
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[color:var(--accent)] text-[color:var(--background)] font-semibold disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send code"}
              </button>
            </form>
          )}

          {stage === "otp" && (
            <form onSubmit={submitOtp} className="space-y-4">
              <h1 className="text-2xl font-bold mb-1">Check your inbox</h1>
              <p className="text-[color:var(--muted)] mb-4">
                Code sent to <span className="text-white">{email}</span>
              </p>
              <input
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-4 text-center tracking-[0.5em] text-xl outline-none focus:border-[color:var(--accent)]"
                autoFocus
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[color:var(--accent)] text-[color:var(--background)] font-semibold disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Verify"}
              </button>
              <button
                type="button"
                onClick={() => setStage("email")}
                className="w-full text-sm text-[color:var(--muted)] hover:text-white"
              >
                Use a different email
              </button>
            </form>
          )}

          {stage === "pin" && (
            <form onSubmit={submitPin} className="space-y-4">
              <h1 className="text-2xl font-bold mb-1">Set a PIN</h1>
              <p className="text-[color:var(--muted)] mb-4">
                4-6 digits. You&apos;ll use it with your email to sign in.
              </p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="PIN"
                className="w-full rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-4 outline-none focus:border-[color:var(--accent)]"
                autoFocus
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Confirm PIN"
                className="w-full rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-4 outline-none focus:border-[color:var(--accent)]"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[color:var(--accent)] text-[color:var(--background)] font-semibold disabled:opacity-50"
              >
                {loading ? "Creating account…" : "Finish"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
