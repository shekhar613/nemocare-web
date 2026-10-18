import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import { ensureUserDocument, userDocRef } from "@/services/auth";
import { emptyProfile, type UserProfile, type Medication } from "@/types";

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

function asMedications(v: unknown): Medication[] {
  if (!Array.isArray(v)) return [];
  return v.map((item) => {
    const m = (item ?? {}) as Record<string, unknown>;
    return {
      name: String(m.name ?? ""),
      dosage: String(m.dosage ?? ""),
    };
  });
}

export function profileFromDoc(
  email: string,
  data: Record<string, unknown>,
): UserProfile {
  const base = emptyProfile(email);
  return {
    ...base,
    name: String(data.name ?? ""),
    dob: String(data.dob ?? ""),
    ageRange: String(data.ageRange ?? ""),
    ageApproximate: Boolean(data.ageApproximate),
    sex: String(data.sex ?? data.gender ?? ""),
    gender: String(data.gender ?? data.sex ?? ""),
    genderIdentity: String(data.genderIdentity ?? ""),
    height_cm:
      typeof data.height_cm === "number" ? data.height_cm : null,
    weight_kg:
      typeof data.weight_kg === "number" ? data.weight_kg : null,
    bmi: typeof data.bmi === "number" ? data.bmi : null,
    heightApproximate: Boolean(data.heightApproximate),
    weightApproximate: Boolean(data.weightApproximate),
    married: Boolean(data.married),
    bloodGroup: String(data.bloodGroup ?? ""),
    knownConditions: asStringArray(data.knownConditions),
    onDialysis: Boolean(data.onDialysis),
    eyeConditions: asStringArray(data.eyeConditions),
    skinConditions: asStringArray(data.skinConditions),
    foodIntolerances: asStringArray(data.foodIntolerances),
    drugAllergies: asStringArray(data.drugAllergies),
    otherAllergies: asStringArray(data.otherAllergies),
    allergies: asStringArray(data.allergies),
    currentMedications: asMedications(data.currentMedications),
    smokingStatus: String(data.smokingStatus ?? "never"),
    alcoholUse: String(data.alcoholUse ?? "never"),
    dietPreference: String(data.dietPreference ?? ""),
    activityLevel: String(data.activityLevel ?? ""),
    pregnancyStatus: String(data.pregnancyStatus ?? ""),
    onboardingCompleted: data.onboardingCompleted === true,
    onboardingCompletedAt: data.onboardingCompletedAt
      ? String(data.onboardingCompletedAt)
      : undefined,
    uid: data.uid ? String(data.uid) : undefined,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
  };
}

export async function fetchCurrentUserDoc(): Promise<Record<
  string,
  unknown
> | null> {
  const user = getFirebaseAuth().currentUser;
  const email = user?.email?.trim().toLowerCase();
  if (!user || !email) return null;
  const snap = await getDoc(userDocRef(email));
  if (!snap.exists()) return null;
  return snap.data() as Record<string, unknown>;
}

export async function fetchCurrentProfile(): Promise<UserProfile | null> {
  const user = getFirebaseAuth().currentUser;
  const email = user?.email?.trim().toLowerCase();
  if (!user || !email) return null;
  const data = await fetchCurrentUserDoc();
  if (!data) return null;
  return profileFromDoc(email, data);
}

export async function needsOnboarding(): Promise<boolean> {
  const user = getFirebaseAuth().currentUser;
  if (!user?.email) return false;
  await ensureUserDocument(user);
  const data = await fetchCurrentUserDoc();
  if (!data) return true;
  return data.onboardingCompleted !== true;
}

export async function saveOnboarding(profile: UserProfile): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  const email = user?.email?.trim().toLowerCase();
  if (!user || !email) throw new Error("Sign in to save your profile.");

  const now = new Date().toISOString();
  const allergies = [
    ...new Set([
      ...profile.drugAllergies,
      ...profile.otherAllergies,
      ...profile.foodIntolerances.filter((f) => f.includes("allergy")),
    ]),
  ];

  const payload: Record<string, unknown> = {
    ...profile,
    email,
    uid: user.uid,
    gender: profile.sex || profile.gender,
    allergies,
    onboardingCompleted: true,
    onboardingCompletedAt: profile.onboardingCompletedAt || now,
    updatedAt: now,
  };

  await setDoc(userDocRef(email), payload, { merge: true });
}

export function watchUserDoc(
  email: string,
  onData: (data: Record<string, unknown> | null) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(getDb(), "USERS", email.trim().toLowerCase()),
    (snap) => {
      onData(snap.exists() ? (snap.data() as Record<string, unknown>) : null);
    },
    (err) => onError?.(err),
  );
}
