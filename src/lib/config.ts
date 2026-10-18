export const BACKEND_BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8080"
).replace(/\/+$/, "");

export const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || "";

export const chatAskUrl = `${BACKEND_BASE_URL}/chat/ask`;
export const insightsRefreshUrl = `${BACKEND_BASE_URL}/insights/refresh`;
export const healthUrl = `${BACKEND_BASE_URL}/health`;

export const PROFILE_KEYS = new Set([
  "name",
  "dob",
  "ageRange",
  "ageApproximate",
  "sex",
  "gender",
  "genderIdentity",
  "height_cm",
  "weight_kg",
  "bmi",
  "heightApproximate",
  "weightApproximate",
  "married",
  "bloodGroup",
  "knownConditions",
  "onDialysis",
  "eyeConditions",
  "skinConditions",
  "foodIntolerances",
  "drugAllergies",
  "otherAllergies",
  "allergies",
  "currentMedications",
  "smokingStatus",
  "alcoholUse",
  "dietPreference",
  "activityLevel",
  "pregnancyStatus",
  "onboardingCompleted",
  "onboardingCompletedAt",
  "uid",
  "email",
  "createdAt",
  "updatedAt",
  "findings",
  "insights",
  "insights_meta",
]);
