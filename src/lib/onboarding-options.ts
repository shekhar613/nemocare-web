export interface OnboardingOption {
  key: string;
  label: string;
}

export const sexOptions: OnboardingOption[] = [
  { key: "male", label: "Male" },
  { key: "female", label: "Female" },
  { key: "prefer_not_to_say", label: "Prefer not to say" },
];

export const genderIdentityOptions: OnboardingOption[] = [
  { key: "man", label: "Man" },
  { key: "woman", label: "Woman" },
  { key: "non_binary", label: "Non-binary" },
  { key: "prefer_not_to_say", label: "Prefer not to say" },
];

export const bloodGroups = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Don't know",
];

export const ageRanges: OnboardingOption[] = [
  { key: "under_18", label: "Under 18" },
  { key: "18_24", label: "18–24" },
  { key: "25_29", label: "25–29" },
  { key: "30_34", label: "30–34" },
  { key: "35_39", label: "35–39" },
  { key: "40_44", label: "40–44" },
  { key: "45_49", label: "45–49" },
  { key: "50_54", label: "50–54" },
  { key: "55_59", label: "55–59" },
  { key: "60_64", label: "60–64" },
  { key: "65_plus", label: "65+" },
];

export const heightRangesCm: OnboardingOption[] = [
  { key: "under_150", label: "Under 150 cm" },
  { key: "150_160", label: "150–160 cm" },
  { key: "160_170", label: "160–170 cm" },
  { key: "170_180", label: "170–180 cm" },
  { key: "180_plus", label: "180+ cm" },
];

export const heightRangeMidpointsCm: Record<string, number> = {
  under_150: 145,
  "150_160": 155,
  "160_170": 165,
  "170_180": 175,
  "180_plus": 185,
};

export const weightRangesKg: OnboardingOption[] = [
  { key: "under_50", label: "Under 50 kg" },
  { key: "50_60", label: "50–60 kg" },
  { key: "60_70", label: "60–70 kg" },
  { key: "70_80", label: "70–80 kg" },
  { key: "80_90", label: "80–90 kg" },
  { key: "90_plus", label: "90+ kg" },
];

export const weightRangeMidpointsKg: Record<string, number> = {
  under_50: 45,
  "50_60": 55,
  "60_70": 65,
  "70_80": 75,
  "80_90": 85,
  "90_plus": 95,
};

export const longTermConditions: OnboardingOption[] = [
  { key: "diabetes_type1", label: "Diabetes (Type 1)" },
  { key: "diabetes_type2", label: "Diabetes (Type 2)" },
  { key: "hypertension", label: "High blood pressure" },
  { key: "kidney_disease", label: "Kidney disease" },
  { key: "dialysis", label: "On dialysis" },
  { key: "heart_disease", label: "Heart disease" },
  { key: "thyroid_disorder", label: "Thyroid disorder (hyper/hypo)" },
  { key: "asthma", label: "Asthma" },
  { key: "liver_disease", label: "Liver disease" },
  { key: "arthritis", label: "Arthritis" },
  { key: "epilepsy", label: "Epilepsy" },
  { key: "autoimmune", label: "Autoimmune condition" },
  { key: "none", label: "None of these" },
];

export const eyeConditions: OnboardingOption[] = [
  { key: "glaucoma", label: "Glaucoma" },
  { key: "cataract", label: "Cataract" },
  { key: "diabetic_retinopathy", label: "Diabetic retinopathy" },
  { key: "vision_correction", label: "Wears glasses/contacts" },
  { key: "color_blindness", label: "Color blindness" },
  { key: "none", label: "None" },
];

export const skinConditions: OnboardingOption[] = [
  { key: "eczema", label: "Eczema" },
  { key: "psoriasis", label: "Psoriasis" },
  { key: "chronic_skin_allergy", label: "Chronic skin allergy" },
  { key: "none", label: "None" },
];

export const foodIntolerances: OnboardingOption[] = [
  { key: "lactose", label: "Lactose intolerance" },
  { key: "gluten", label: "Gluten intolerance" },
  { key: "nut_allergy", label: "Nut allergy" },
  { key: "shellfish_allergy", label: "Shellfish allergy" },
  { key: "none", label: "None" },
];

export const commonDrugAllergies: OnboardingOption[] = [
  { key: "penicillin", label: "Penicillin" },
  { key: "sulfa", label: "Sulfa drugs" },
  { key: "aspirin_nsaids", label: "Aspirin / NSAIDs" },
  { key: "iodine", label: "Iodine" },
];

export const smokingStatus: OnboardingOption[] = [
  { key: "never", label: "Never" },
  { key: "former", label: "Former smoker" },
  { key: "current", label: "Current smoker" },
];

export const alcoholUse: OnboardingOption[] = [
  { key: "never", label: "Never" },
  { key: "occasionally", label: "Occasionally" },
  { key: "regularly", label: "Regularly" },
];

export const dietPreference: OnboardingOption[] = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "non_vegetarian", label: "Non-vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "eggetarian", label: "Eggetarian" },
];

export const activityLevel: OnboardingOption[] = [
  { key: "sedentary", label: "Sedentary" },
  { key: "lightly_active", label: "Lightly active" },
  { key: "moderately_active", label: "Moderately active" },
  { key: "very_active", label: "Very active" },
];

export const pregnancyStatus: OnboardingOption[] = [
  { key: "yes", label: "Yes" },
  { key: "no", label: "No" },
  { key: "prefer_not_to_say", label: "Prefer not to say" },
];
