export type ChatRole = "user" | "assistant";

export type ComparisonDirection = "increased" | "decreased" | "unchanged";

export type ReportCategory =
  | "lab"
  | "prescription"
  | "imaging"
  | "clinical_report"
  | "other_medical"
  | "non_medical";

export interface Medication {
  name: string;
  dosage: string;
}

export interface UserProfile {
  email: string;
  name: string;
  dob: string;
  ageRange: string;
  ageApproximate: boolean;
  sex: string;
  gender: string;
  genderIdentity: string;
  height_cm: number | null;
  weight_kg: number | null;
  bmi: number | null;
  heightApproximate: boolean;
  weightApproximate: boolean;
  married: boolean;
  bloodGroup: string;
  knownConditions: string[];
  onDialysis: boolean;
  eyeConditions: string[];
  skinConditions: string[];
  foodIntolerances: string[];
  drugAllergies: string[];
  otherAllergies: string[];
  allergies: string[];
  currentMedications: Medication[];
  smokingStatus: string;
  alcoholUse: string;
  dietPreference: string;
  activityLevel: string;
  pregnancyStatus: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  uid?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LabValue {
  parameterKey: string;
  rawLabel: string;
  valueType: string;
  value: number | string | null;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
  flag: string | null;
}

export interface MedicalReport {
  storageKey: string;
  dateKey: string;
  docType: string;
  isMedical: boolean;
  labName: string;
  patientName: string;
  patientSex: string;
  patientAge: number | null;
  collectedDate: string;
  reportApprovedDate: string;
  regnNo: string;
  mrdNo: string;
  values: LabValue[];
  reportName: string;
  category: string;
  cityName: string;
  sampleType: string;
  conclusion: string;
  fileName: string;
  confidence: number;
  fullReport: Record<string, unknown>;
  isStarred: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  comparison?: ReportComparison | null;
}

export interface ComparisonMetric {
  parameterKey: string;
  label: string;
  previousValue: number;
  currentValue: number;
  unit: string;
  direction: ComparisonDirection;
  badgeText: string;
  previousRaw?: string;
  currentRaw?: string;
}

export interface ReportComparison {
  reportType: string;
  reportLabel: string;
  previousDate: string;
  currentDate: string;
  increased: ComparisonMetric[];
  decreased: ComparisonMetric[];
  unchanged: ComparisonMetric[];
  intro: string;
  insight: string;
  disclaimer: string;
}

export interface Finding {
  key: string;
  derivedFrom: string[];
  sinceDate: string;
  active: boolean;
  updatedAt: string;
}

export interface InsightCard {
  title: string;
  body: string;
  category: "risk" | "remedy" | "explanation" | string;
  supportingFindingKeys: string[];
  sourceUrls: string[];
}

export interface InsightsBundle {
  fingerprint: string;
  cards: InsightCard[];
  generatedAt: string;
}

export interface DocumentAnalysis {
  isMedical: boolean;
  category: ReportCategory | string;
  docType: string;
  reportName: string;
  labName: string;
  cityName: string;
  sampleType: string;
  collectionDate: string;
  testDate: string;
  reportApprovedDate: string;
  patientName: string;
  patientSex: string;
  patientAge: number | null;
  regnNo: string;
  mrdNo: string;
  values: LabValue[];
  parameters: string[];
  vitals: Array<{
    parameter: string;
    value: string;
    unit: string;
    reference: string;
    status: string;
  }>;
  conclusion: string;
  confidence: number;
  fullReport: Record<string, unknown>;
  rejectionReason: string | null;
}

export function emptyProfile(email = ""): UserProfile {
  return {
    email,
    name: "",
    dob: "",
    ageRange: "",
    ageApproximate: false,
    sex: "",
    gender: "",
    genderIdentity: "",
    height_cm: null,
    weight_kg: null,
    bmi: null,
    heightApproximate: false,
    weightApproximate: false,
    married: false,
    bloodGroup: "",
    knownConditions: [],
    onDialysis: false,
    eyeConditions: [],
    skinConditions: [],
    foodIntolerances: [],
    drugAllergies: [],
    otherAllergies: [],
    allergies: [],
    currentMedications: [],
    smokingStatus: "never",
    alcoholUse: "never",
    dietPreference: "",
    activityLevel: "",
    pregnancyStatus: "",
    onboardingCompleted: false,
  };
}
