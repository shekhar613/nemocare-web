import type { Finding } from "@/types";
import { PROFILE_KEYS } from "@/lib/config";

type ValueMap = Record<string, Record<string, unknown>>;

interface LatestEntry {
  reportKey: string;
  date: string;
  data: Record<string, unknown>;
}

function latestReportEntry(
  userDoc: Record<string, unknown>,
  reportKey: string,
): LatestEntry | null {
  const bucket = userDoc[reportKey];
  if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) return null;
  const dates = Object.keys(bucket as object)
    .filter((k) => /^\d{4}-\d{2}-\d{2}/.test(k))
    .sort()
    .reverse();
  if (!dates.length) return null;
  const date = dates[0]!;
  const data = (bucket as Record<string, unknown>)[date];
  if (!data || typeof data !== "object") return null;
  return { reportKey, date, data: data as Record<string, unknown> };
}

function valuesByKey(data: Record<string, unknown>): ValueMap {
  const values = data.values;
  const map: ValueMap = {};
  if (!Array.isArray(values)) return map;
  for (const item of values) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const key = String(row.parameterKey ?? "").trim();
    if (key) map[key] = row;
  }
  return map;
}

function isLow(v?: Record<string, unknown>): boolean {
  if (!v) return false;
  const flag = String(v.flag ?? "").toUpperCase();
  if (flag === "L") return true;
  const value = typeof v.value === "number" ? v.value : Number(v.value);
  const refLow = typeof v.refLow === "number" ? v.refLow : null;
  return Number.isFinite(value) && refLow != null && value < refLow;
}

function isHigh(v?: Record<string, unknown>): boolean {
  if (!v) return false;
  const flag = String(v.flag ?? "").toUpperCase();
  if (flag === "H") return true;
  const value = typeof v.value === "number" ? v.value : Number(v.value);
  const refHigh = typeof v.refHigh === "number" ? v.refHigh : null;
  return Number.isFinite(value) && refHigh != null && value > refHigh;
}

function isQualitativeAbnormal(v?: Record<string, unknown>): boolean {
  if (!v) return false;
  const flag = String(v.flag ?? "").toUpperCase();
  if (flag === "H" || flag === "L" || flag === "A") return true;
  const raw = String(v.value ?? "").toLowerCase();
  return ["positive", "reactive", "detected", "abnormal"].some((w) =>
    raw.includes(w),
  );
}

export function computeFindings(userDoc: Record<string, unknown>): Finding[] {
  const findings: Finding[] = [];
  const now = new Date().toISOString();

  const add = (f: Omit<Finding, "updatedAt">) => {
    if (!f.key) return;
    findings.push({ ...f, updatedAt: now });
  };

  const cbcLatest = latestReportEntry(userDoc, "cbc");
  if (cbcLatest) {
    const { date } = cbcLatest;
    const byKey = valuesByKey(cbcLatest.data);
    if (isLow(byKey.hemoglobin)) {
      add({
        key: "low_hemoglobin",
        derivedFrom: [`cbc/${date}/hemoglobin`],
        sinceDate: date,
        active: true,
      });
    }
    if (isLow(byKey.mcv) && isLow(byKey.mch)) {
      add({
        key: "microcytic_pattern",
        derivedFrom: [`cbc/${date}/mcv`, `cbc/${date}/mch`],
        sinceDate: date,
        active: true,
      });
    }
    if (isHigh(byKey.neutrophils_pct) || isHigh(byKey.neutrophils)) {
      const param = byKey.neutrophils_pct ? "neutrophils_pct" : "neutrophils";
      add({
        key: "high_neutrophils",
        derivedFrom: [`cbc/${date}/${param}`],
        sinceDate: date,
        active: true,
      });
    }
  }

  const panelLatest =
    latestReportEntry(userDoc, "renal_infectious_metabolic_panel") ||
    latestReportEntry(userDoc, "blood_sugar") ||
    latestReportEntry(userDoc, "kft");
  if (panelLatest) {
    const { date, reportKey } = panelLatest;
    const byKey = valuesByKey(panelLatest.data);
    const rbs =
      byKey.random_blood_sugar ||
      byKey.blood_sugar ||
      byKey.glucose ||
      byKey.rbs;
    if (isHigh(rbs)) {
      const param = String(rbs?.parameterKey ?? "random_blood_sugar");
      add({
        key: "high_blood_sugar",
        derivedFrom: [`${reportKey}/${date}/${param}`],
        sinceDate: date,
        active: true,
      });
    }
    for (const key of ["hcv_antibody", "hiv_1_2", "hbsag"] as const) {
      if (isQualitativeAbnormal(byKey[key])) {
        add({
          key: `${key}_abnormal`,
          derivedFrom: [`${reportKey}/${date}/${key}`],
          sinceDate: date,
          active: true,
        });
      }
    }
  }

  const urineLatest = latestReportEntry(userDoc, "urine_routine");
  if (urineLatest) {
    const { date } = urineLatest;
    const byKey = valuesByKey(urineLatest.data);
    for (const [entryKey, v] of Object.entries(byKey)) {
      if (isQualitativeAbnormal(v) || isHigh(v) || isLow(v)) {
        const flag = String(v.flag ?? "").toUpperCase();
        const suffix =
          flag === "L" ? "low" : flag === "H" ? "high" : "abnormal";
        add({
          key: `urine_${entryKey}_${suffix}`,
          derivedFrom: [`urine_routine/${date}/${entryKey}`],
          sinceDate: date,
          active: true,
        });
      }
    }
  }

  // Touch PROFILE_KEYS so unused-import tooling stays quiet if used elsewhere.
  void PROFILE_KEYS;
  return findings;
}

export function mergeFindingsMap(
  computed: Finding[],
  existing?: Record<string, unknown> | null,
): Record<string, unknown> {
  const now = new Date().toISOString();
  const result: Record<string, unknown> = {};
  const activeKeys = new Set<string>();

  for (const f of computed) {
    activeKeys.add(f.key);
    result[f.key] = { ...f, active: true, updatedAt: now };
  }

  if (existing) {
    for (const [key, value] of Object.entries(existing)) {
      if (activeKeys.has(key)) continue;
      if (!value || typeof value !== "object") continue;
      result[key] = {
        ...(value as object),
        active: false,
        updatedAt: now,
      };
    }
  }

  return result;
}
