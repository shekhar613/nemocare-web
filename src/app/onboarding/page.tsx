"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  activityLevel,
  ageRanges,
  alcoholUse,
  bloodGroups,
  commonDrugAllergies,
  dietPreference,
  eyeConditions,
  foodIntolerances,
  genderIdentityOptions,
  heightRangeMidpointsCm,
  heightRangesCm,
  longTermConditions,
  pregnancyStatus,
  sexOptions,
  skinConditions,
  smokingStatus,
  weightRangeMidpointsKg,
  weightRangesKg,
  type OnboardingOption,
} from "@/lib/onboarding-options";
import { saveOnboarding } from "@/services/user-profile";
import { emptyProfile, type UserProfile } from "@/types";

function ChipGroup({
  options,
  selected,
  onToggle,
  multi = true,
}: {
  options: OnboardingOption[];
  selected: string[];
  onToggle: (key: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          className="nc-chip"
          data-active={selected.includes(o.key)}
          onClick={() => onToggle(o.key)}
        >
          {o.label}
        </button>
      ))}
      {!multi ? null : null}
    </div>
  );
}

function OnboardingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const isEditing = params.get("edit") === "1";
  const { user, profile, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<UserProfile>(emptyProfile());
  const [heightMode, setHeightMode] = useState<"exact" | "approx">("exact");
  const [weightMode, setWeightMode] = useState<"exact" | "approx">("exact");
  const [heightRange, setHeightRange] = useState("");
  const [weightRange, setWeightRange] = useState("");
  const [otherAllergy, setOtherAllergy] = useState("");
  const [medName, setMedName] = useState("");
  const [medDose, setMedDose] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (profile) {
      setForm({ ...emptyProfile(user.email || ""), ...profile });
      if (profile.heightApproximate) setHeightMode("approx");
      if (profile.weightApproximate) setWeightMode("approx");
    }
  }, [user, profile, loading, router]);

  const steps = useMemo(() => {
    const base = [
      "About you",
      "Conditions",
      "Eyes, skin & food",
      "Allergies & meds",
      "Lifestyle",
    ];
    if (form.sex === "female") base.push("Women's health");
    return base;
  }, [form.sex]);

  function toggleMulti(
    field: keyof UserProfile,
    key: string,
    exclusiveNone = true,
  ) {
    setForm((prev) => {
      const current = [...((prev[field] as string[]) || [])];
      if (key === "none") {
        return { ...prev, [field]: current.includes("none") ? [] : ["none"] };
      }
      let next = current.filter((k) => k !== "none");
      if (next.includes(key)) next = next.filter((k) => k !== key);
      else next.push(key);
      if (!exclusiveNone) {
        /* keep */
      }
      return { ...prev, [field]: next };
    });
  }

  function validateStep(): string | null {
    if (step !== 0) return null;
    if (!form.name.trim()) return "Name is required.";
    if (!form.dob && !form.ageRange) return "Add date of birth or age range.";
    if (!form.sex) return "Select biological sex.";
    if (heightMode === "exact" && !form.height_cm) return "Enter height.";
    if (heightMode === "approx" && !heightRange) return "Select height range.";
    if (weightMode === "exact" && !form.weight_kg) return "Enter weight.";
    if (weightMode === "approx" && !weightRange) return "Select weight range.";
    return null;
  }

  async function finish() {
    setError("");
    const v = validateStep();
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    try {
      let height = form.height_cm;
      let weight = form.weight_kg;
      let heightApproximate = false;
      let weightApproximate = false;

      if (heightMode === "approx") {
        height = heightRangeMidpointsCm[heightRange] ?? null;
        heightApproximate = true;
      }
      if (weightMode === "approx") {
        weight = weightRangeMidpointsKg[weightRange] ?? null;
        weightApproximate = true;
      }

      let bmi: number | null = null;
      if (height && weight && height > 0) {
        const m = height / 100;
        bmi = Math.round((weight / (m * m)) * 10) / 10;
      }

      const payload: UserProfile = {
        ...form,
        email: user?.email?.toLowerCase() || form.email,
        gender: form.sex,
        height_cm: height,
        weight_kg: weight,
        heightApproximate,
        weightApproximate,
        bmi,
        onDialysis: form.knownConditions.includes("dialysis"),
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
      };

      await saveOnboarding(payload);
      router.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    const v = validateStep();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    if (step >= steps.length - 1) void finish();
    else setStep((s) => s + 1);
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{
        background: "linear-gradient(180deg, #EFF8F7 0%, #F7FBFA 100%)",
      }}
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-[var(--teal)]">
            Step {step + 1} of {steps.length}
          </p>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold text-[var(--ink)]">
            {isEditing ? "Edit health profile" : steps[step]}
          </h1>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full bg-[var(--deep-teal)] transition-all"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-white p-5 sm:p-6">
          {step === 0 ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium">
                Full name
                <input
                  className="nc-input mt-1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                Date of birth
                <input
                  type="date"
                  className="nc-input mt-1"
                  value={form.dob}
                  onChange={(e) =>
                    setForm({ ...form, dob: e.target.value, ageRange: "" })
                  }
                />
              </label>
              <div>
                <p className="mb-2 text-sm font-medium">Or age range</p>
                <ChipGroup
                  options={ageRanges}
                  selected={form.ageRange ? [form.ageRange] : []}
                  onToggle={(k) =>
                    setForm({
                      ...form,
                      ageRange: form.ageRange === k ? "" : k,
                      dob: "",
                      ageApproximate: true,
                    })
                  }
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Biological sex</p>
                <ChipGroup
                  options={sexOptions}
                  selected={form.sex ? [form.sex] : []}
                  onToggle={(k) => setForm({ ...form, sex: k, gender: k })}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Gender identity (optional)</p>
                <ChipGroup
                  options={genderIdentityOptions}
                  selected={form.genderIdentity ? [form.genderIdentity] : []}
                  onToggle={(k) =>
                    setForm({
                      ...form,
                      genderIdentity: form.genderIdentity === k ? "" : k,
                    })
                  }
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Blood group</p>
                <div className="flex flex-wrap gap-2">
                  {bloodGroups.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      className="nc-chip"
                      data-active={form.bloodGroup === bg}
                      onClick={() => setForm({ ...form, bloodGroup: bg })}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex gap-2">
                  <button
                    type="button"
                    className="nc-chip"
                    data-active={heightMode === "exact"}
                    onClick={() => setHeightMode("exact")}
                  >
                    Exact height
                  </button>
                  <button
                    type="button"
                    className="nc-chip"
                    data-active={heightMode === "approx"}
                    onClick={() => setHeightMode("approx")}
                  >
                    Approximate
                  </button>
                </div>
                {heightMode === "exact" ? (
                  <input
                    className="nc-input"
                    type="number"
                    placeholder="Height (cm)"
                    value={form.height_cm ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        height_cm: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  />
                ) : (
                  <ChipGroup
                    options={heightRangesCm}
                    selected={heightRange ? [heightRange] : []}
                    onToggle={(k) => setHeightRange(k)}
                  />
                )}
              </div>
              <div>
                <div className="mb-2 flex gap-2">
                  <button
                    type="button"
                    className="nc-chip"
                    data-active={weightMode === "exact"}
                    onClick={() => setWeightMode("exact")}
                  >
                    Exact weight
                  </button>
                  <button
                    type="button"
                    className="nc-chip"
                    data-active={weightMode === "approx"}
                    onClick={() => setWeightMode("approx")}
                  >
                    Approximate
                  </button>
                </div>
                {weightMode === "exact" ? (
                  <input
                    className="nc-input"
                    type="number"
                    placeholder="Weight (kg)"
                    value={form.weight_kg ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        weight_kg: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  />
                ) : (
                  <ChipGroup
                    options={weightRangesKg}
                    selected={weightRange ? [weightRange] : []}
                    onToggle={(k) => setWeightRange(k)}
                  />
                )}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <p className="mb-3 text-sm text-[var(--muted)]">
                Long-term conditions
              </p>
              <ChipGroup
                options={longTermConditions}
                selected={form.knownConditions}
                onToggle={(k) => toggleMulti("knownConditions", k)}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium">Eye conditions</p>
                <ChipGroup
                  options={eyeConditions}
                  selected={form.eyeConditions}
                  onToggle={(k) => toggleMulti("eyeConditions", k)}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Skin conditions</p>
                <ChipGroup
                  options={skinConditions}
                  selected={form.skinConditions}
                  onToggle={(k) => toggleMulti("skinConditions", k)}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Food intolerances</p>
                <ChipGroup
                  options={foodIntolerances}
                  selected={form.foodIntolerances}
                  onToggle={(k) => toggleMulti("foodIntolerances", k)}
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium">Drug allergies</p>
                <ChipGroup
                  options={commonDrugAllergies}
                  selected={form.drugAllergies}
                  onToggle={(k) => {
                    setForm((prev) => {
                      const cur = [...prev.drugAllergies];
                      const next = cur.includes(k)
                        ? cur.filter((x) => x !== k)
                        : [...cur, k];
                      return { ...prev, drugAllergies: next };
                    });
                  }}
                />
              </div>
              <div className="flex gap-2">
                <input
                  className="nc-input"
                  placeholder="Other allergy"
                  value={otherAllergy}
                  onChange={(e) => setOtherAllergy(e.target.value)}
                />
                <button
                  type="button"
                  className="nc-btn nc-btn-ghost"
                  onClick={() => {
                    if (!otherAllergy.trim()) return;
                    setForm({
                      ...form,
                      otherAllergies: [
                        ...form.otherAllergies,
                        otherAllergy.trim(),
                      ],
                    });
                    setOtherAllergy("");
                  }}
                >
                  Add
                </button>
              </div>
              {form.otherAllergies.length ? (
                <p className="text-sm text-[var(--muted)]">
                  {form.otherAllergies.join(", ")}
                </p>
              ) : null}
              <div>
                <p className="mb-2 text-sm font-medium">Current medications</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className="nc-input"
                    placeholder="Name"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                  />
                  <input
                    className="nc-input"
                    placeholder="Dosage"
                    value={medDose}
                    onChange={(e) => setMedDose(e.target.value)}
                  />
                  <button
                    type="button"
                    className="nc-btn nc-btn-ghost"
                    onClick={() => {
                      if (!medName.trim()) return;
                      setForm({
                        ...form,
                        currentMedications: [
                          ...form.currentMedications,
                          {
                            name: medName.trim(),
                            dosage: medDose.trim(),
                          },
                        ],
                      });
                      setMedName("");
                      setMedDose("");
                    }}
                  >
                    Add
                  </button>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                  {form.currentMedications.map((m, i) => (
                    <li key={`${m.name}-${i}`}>
                      {m.name}
                      {m.dosage ? ` — ${m.dosage}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium">Smoking</p>
                <ChipGroup
                  options={smokingStatus}
                  selected={[form.smokingStatus]}
                  onToggle={(k) => setForm({ ...form, smokingStatus: k })}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Alcohol</p>
                <ChipGroup
                  options={alcoholUse}
                  selected={[form.alcoholUse]}
                  onToggle={(k) => setForm({ ...form, alcoholUse: k })}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Diet</p>
                <ChipGroup
                  options={dietPreference}
                  selected={form.dietPreference ? [form.dietPreference] : []}
                  onToggle={(k) => setForm({ ...form, dietPreference: k })}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Activity</p>
                <ChipGroup
                  options={activityLevel}
                  selected={form.activityLevel ? [form.activityLevel] : []}
                  onToggle={(k) => setForm({ ...form, activityLevel: k })}
                />
              </div>
            </div>
          ) : null}

          {step === 5 && form.sex === "female" ? (
            <div>
              <p className="mb-2 text-sm font-medium">Are you pregnant?</p>
              <ChipGroup
                options={pregnancyStatus}
                selected={form.pregnancyStatus ? [form.pregnancyStatus] : []}
                onToggle={(k) => setForm({ ...form, pregnancyStatus: k })}
              />
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm text-[var(--coral)]">{error}</p>
          ) : null}

          <div className="mt-6 flex justify-between gap-3">
            <button
              type="button"
              className="nc-btn nc-btn-ghost"
              disabled={step === 0 || busy}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </button>
            <button
              type="button"
              className="nc-btn nc-btn-primary"
              disabled={busy}
              onClick={next}
            >
              {busy
                ? "Saving…"
                : step >= steps.length - 1
                  ? isEditing
                    ? "Save"
                    : "Finish"
                  : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
          Loading…
        </div>
      }
    >
      <OnboardingInner />
    </Suspense>
  );
}
