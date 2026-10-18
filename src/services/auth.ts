import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import { emptyProfile } from "@/types";

const USERS = "USERS";

export function userDocRef(email: string) {
  return doc(getDb(), USERS, email.trim().toLowerCase());
}

export async function ensureUserDocument(user: User): Promise<void> {
  const email = user.email?.trim().toLowerCase();
  if (!email) throw new Error("User email is required.");

  const ref = userDocRef(email);
  const snap = await getDoc(ref);
  const now = new Date().toISOString();

  if (snap.exists()) {
    const data = snap.data() ?? {};
    const updates: Record<string, unknown> = { updatedAt: now, uid: user.uid };
    if (!data.name && user.displayName) updates.name = user.displayName;
    if (data.onboardingCompleted === undefined) {
      updates.onboardingCompleted = false;
    }
    if (!Array.isArray(data.currentMedications)) {
      updates.currentMedications = [];
    }
    if (!Array.isArray(data.allergies)) updates.allergies = [];
    await setDoc(ref, updates, { merge: true });
    return;
  }

  const profile = emptyProfile(email);
  profile.name = user.displayName ?? "";
  profile.uid = user.uid;
  profile.createdAt = now;
  profile.updatedAt = now;
  await setDoc(ref, profile);
}

export async function signIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  await ensureUserDocument(cred.user);
  return cred.user;
}

export async function signUp(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  if (name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  await ensureUserDocument(cred.user);
  return cred.user;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(getFirebaseAuth(), provider);
  await ensureUserDocument(cred.user);
  return cred.user;
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
}

export async function signOut() {
  await firebaseSignOut(getFirebaseAuth());
}
