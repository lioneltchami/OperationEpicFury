"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DecryptedText } from "@/components/ui/DecryptedText";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setError("Access denied");
      setLoading(false);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    router.refresh();
  }

  return (
    <div className="relative flex flex-col items-center gap-8">
      {/* Ambient glow behind card */}
      <div className="absolute -top-20 w-64 h-64 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Title */}
      <div className="text-center space-y-2 relative z-10">
        <h1 className="text-3xl font-bold tracking-wider text-white">
          <DecryptedText
            text="COMMAND CENTER"
            speed={40}
            sequential
            className="text-white"
            encryptedClassName="text-red-500/60"
          />
        </h1>
        <p className="text-xs tracking-[0.3em] uppercase text-zinc-600">
          Authorized Personnel Only
        </p>
      </div>

      {/* Login card */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`
          relative w-full max-w-sm rounded-xl p-6 space-y-5
          bg-zinc-950/80 backdrop-blur-xl
          border border-zinc-800/80
          shadow-2xl shadow-black/50
          ${shaking ? "animate-shake" : ""}
        `}
      >
        {/* Subtle top gradient line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/50 border border-red-900/50 px-3 py-2.5 rounded-lg">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-medium tracking-wider uppercase text-zinc-500">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter access code"
            className="
              w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-3
              text-white text-sm placeholder:text-zinc-600
              focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20
              transition-all duration-200
            "
            required
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="
            w-full px-4 py-3 rounded-lg text-sm font-semibold tracking-wide
            bg-red-600 text-white
            hover:bg-red-500 active:bg-red-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            shadow-lg shadow-red-600/20
          "
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Authenticating...
            </span>
          ) : (
            "Authenticate"
          )}
        </button>

        {/* Bottom decorative line */}
        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </form>
    </div>
  );
}
