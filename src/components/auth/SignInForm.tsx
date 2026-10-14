"use client";

import { useState } from "react";
import { inputClass } from "@/components/generator/fields";
import { authClient } from "@/lib/auth-client";

export function SignInForm({ next, googleEnabled, linksInConsole }: {
  next: string;
  googleEnabled: boolean;
  linksInConsole: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function sendLink(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: next });
    if (error) {
      setError(error.message ?? "Couldn't send the sign-in link. Please try again.");
      setStatus("idle");
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-6 text-sm text-sky-900">
        <p className="font-semibold">Check your email</p>
        <p className="mt-1">
          We sent a sign-in link to <strong>{email}</strong>. It expires in 10 minutes.
        </p>
        {linksInConsole && (
          <p className="mt-3 rounded-md bg-white/70 p-2 text-xs text-sky-800">
            Development mode: no email provider is set, so the link is printed in the server console.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={() => authClient.signIn.social({ provider: "google", callbackURL: next })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-400 hover:bg-slate-50"
          >
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      )}

      <form onSubmit={sendLink} className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-slate-800">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </label>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>
    </div>
  );
}
