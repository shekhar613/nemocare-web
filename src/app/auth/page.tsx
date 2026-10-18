"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/components/AuthProvider";
import {
  resetPassword,
  signIn,
  signInWithGoogle,
  signUp,
} from "@/services/auth";
import { needsOnboarding } from "@/services/user-profile";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function AuthPage() {
  const router = useRouter();
  const { configured } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function afterAuth() {
    const need = await needsOnboarding();
    router.replace(need ? "/onboarding" : "/home");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (!isFirebaseConfigured()) {
        throw new Error(
          "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* to .env.local",
        );
      }
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(name, email, password);
      }
      await afterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle();
      await afterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onForgot() {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    try {
      await resetPassword(email);
      setInfo("Password reset email sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{
        background:
          "linear-gradient(180deg, #D7F0EE 0%, #F7FCFB 55%, #F4FBFA 100%)",
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <AppLogo size={56} />
          <h1 className="mt-3 font-[family-name:var(--font-sora)] text-2xl font-bold text-[var(--ink)]">
            Nemo Care
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {!configured ? (
          <div className="mb-4 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Add a Firebase web app config to <code>.env.local</code> before signing in.
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" ? (
            <input
              className="nc-input"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          ) : null}
          <input
            className="nc-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="nc-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {mode === "login" ? (
            <button
              type="button"
              onClick={onForgot}
              className="text-sm font-medium text-[var(--deep-teal)] hover:underline"
            >
              Forgot password?
            </button>
          ) : null}

          {error ? (
            <p className="text-sm text-[var(--coral)]">{error}</p>
          ) : null}
          {info ? <p className="text-sm text-[var(--deep-teal)]">{info}</p> : null}

          <button type="submit" disabled={busy} className="nc-btn nc-btn-primary w-full">
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-[var(--muted)]">
          <div className="h-px flex-1 bg-[var(--border)]" />
          or
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={onGoogle}
          className="nc-btn nc-btn-ghost w-full"
        >
          Continue with Google
        </button>

        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-semibold text-[var(--deep-teal)]"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>

        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          <Link href="/" className="hover:underline">
            Back to splash
          </Link>
        </p>
      </div>
    </div>
  );
}
