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
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Welcome back</h1>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-4 outline-none focus:border-[color:var(--accent)]"
            autoFocus
          />
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-xl bg-[color:var(--panel)] border border-[color:var(--panel-border)] p-4 outline-none focus:border-[color:var(--accent)]"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[color:var(--accent)] text-[color:var(--background)] font-semibold disabled:opacity-50"
          >
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
    </main>
  );
}
