"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/components/AuthProvider";
import { needsOnboarding } from "@/services/user-profile";

export default function SplashPage() {
  const router = useRouter();
  const { user, loading, configured } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(async () => {
      if (!configured) {
        router.replace("/auth");
        return;
      }
      if (!user) {
        router.replace("/auth");
        return;
      }
      try {
        const need = await needsOnboarding();
        router.replace(need ? "/onboarding" : "/home");
      } catch {
        router.replace("/home");
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [loading, user, configured, router]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 text-white"
      style={{
        background:
          "linear-gradient(160deg, #0A5558 0%, #0B6E6E 45%, #1A9A9E 100%)",
      }}
    >
      <div className="mb-6 rounded-3xl bg-white/95 p-4 shadow-lg">
        <AppLogo size={72} />
      </div>
      <h1 className="font-[family-name:var(--font-sora)] text-3xl font-bold tracking-tight">
        Nemo Care
      </h1>
      <p className="mt-2 text-center text-white/85">
        Your personal health companion
      </p>
      <div className="mt-10 h-1.5 w-28 overflow-hidden rounded-full bg-white/25">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-white/80" />
      </div>
    </div>
  );
}
