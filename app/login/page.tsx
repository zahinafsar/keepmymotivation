"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Login failed");
      router.push("/dashboard");
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 relative">
      <div className="aurora"><span /></div>
      <div className="grid-overlay" />
      <div className="noise" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-6 fade-up">
          <span className="font-bold tracking-tight text-xl text-gradient">
            KeepMyMotivation
          </span>
        </div>

        <div className="glass p-8 fade-up delay-100">
          <h1 className="text-2xl font-bold mb-6 text-center text-gradient">Welcome back</h1>
          <form onSubmit={submit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-modern"
              autoFocus
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="input-modern"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-3d w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-center text-sm text-[color:var(--muted)]">
              New here?{" "}
              <a href="/" className="text-white hover:underline">
                Start with your goal
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
