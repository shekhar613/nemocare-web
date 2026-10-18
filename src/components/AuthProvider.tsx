"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import {
  fetchCurrentProfile,
  profileFromDoc,
  watchUserDoc,
} from "@/services/user-profile";
import { ensureUserDocument } from "@/services/auth";
import type { UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  userDoc: Record<string, unknown> | null;
  loading: boolean;
  configured: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userDoc, setUserDoc] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(getFirebaseAuth(), async (next) => {
      setUser(next);
      if (!next?.email) {
        setProfile(null);
        setUserDoc(null);
        setLoading(false);
        return;
      }
      try {
        await ensureUserDocument(next);
        const p = await fetchCurrentProfile();
        setProfile(p);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [configured]);

  useEffect(() => {
    if (!user?.email) return;
    const email = user.email;
    return watchUserDoc(email, (data) => {
      setUserDoc(data);
      if (data) setProfile(profileFromDoc(email, data));
    });
  }, [user?.email]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      userDoc,
      loading,
      configured,
      refreshProfile: async () => {
        const p = await fetchCurrentProfile();
        setProfile(p);
      },
    }),
    [user, profile, userDoc, loading, configured],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
