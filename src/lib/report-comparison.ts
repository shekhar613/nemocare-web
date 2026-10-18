import type {
  ComparisonMetric,
  MedicalReport,
  ReportComparison,
} from "@/types";

const PRIORITY_KEYS = [
  "hemoglobin",
  "platelet_count",
  "platelets",
  "wbc",
  "rbc",
  "mcv",
  "mch",
  "mchc",
  "hematocrit",
  "neutrophils_pct",
  "neutrophils",
  "lymphocytes_pct",
  "lymphocytes",
  "glucose",
  "fasting_blood_sugar",
  "creatinine",
  "urea",
  "alt",
  "ast",
  "tsh",
];

const DISPLAY_NAMES: Record<string, string> = {
  hemoglobin: "Hemoglobin",
  platelet_count: "Platelets",
  platelets: "Platelets",
  wbc: "WBC",
  rbc: "RBC",
  mcv: "MCV",
  mch: "MCH",
  mchc: "MCHC",
  hematocrit: "Hematocrit",
  neutrophils_pct: "Neutrophils",
  neutrophils: "Neutrophils",
  lymphocytes_pct: "Lymphocytes",
  lymphocytes: "Lymphocytes",
  glucose: "Glucose",
  fasting_blood_sugar: "Fasting glucose",
  creatinine: "Creatinine",
  urea: "Urea",
  alt: "ALT",
  ast: "AST",
  tsh: "TSH",
};

export function isComparisonIntent(question: string): boolean {
  const q = question.toLowerCase().trim();
  if (!q) return false;
  const needles = [
    "compar",
    "vs",
    "versus",
    "difference",
    "differ",
    "change",
    "changed",
    "trend",
    "progress",
    "previous",
    "earlier",
    "last two",
    "two report",
    "between report",
    "how am i doing",
    "improved",
    "worsen",
    "delta",
    "before and after",
    "old report",
    "new report",
    "latest report",
    "my reports",
  ];
  return needles.some((n) => q.includes(n));
}

function sortMs(r: MedicalReport): number {
  const d = r.collectedDate || r.dateKey || r.createdAt;
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : 0;
}

function indexNumeric(report: MedicalReport): Record<
  string,
  { value: number; unit: string; raw: string }
> {
  const map: Record<string, { value: number; unit: string; raw: string }> = {};
  for (const v of report.values) {
    const key = v.parameterKey?.trim();
    if (!key) continue;
    const num =
      typeof v.value === "number" ? v.value : Number(String(v.value));
    if (!Number.isFinite(num)) continue;
    map[key] = {
      value: num,
      unit: v.unit || "",
      raw: String(v.value),
    };
  }
  return map;
}

function orderedKeys(keys: Set<string>): string[] {
  const prioritized = PRIORITY_KEYS.filter((k) => keys.has(k));
  const rest = [...keys].filter((k) => !PRIORITY_KEYS.includes(k)).sort();
  return [...prioritized, ...rest];
}

function metricFor(
  key: string,
  a: { value: number; unit: string; raw: string },
  b: { value: number; unit: string; raw: string },
): ComparisonMetric {
  const delta = b.value - a.value;
  const pct = a.value === 0 ? 0 : (delta / Math.abs(a.value)) * 100;
  let direction: ComparisonMetric["direction"] = "unchanged";
  if (Math.abs(delta) < 1e-9 || Math.abs(pct) < 0.5) direction = "unchanged";
  else if (delta > 0) direction = "increased";
  else direction = "decreased";

  const badge =
    direction === "unchanged"
      ? "Same"
      : `${delta > 0 ? "+" : ""}${pct.toFixed(0)}%`;

  return {
    parameterKey: key,
    label: DISPLAY_NAMES[key] || key.replace(/_/g, " "),
    previousValue: a.value,
    currentValue: b.value,
    unit: b.unit || a.unit,
    direction,
    badgeText: badge,
    previousRaw: a.raw,
    currentRaw: b.raw,
  };
}

export function compareReports(
  previous: MedicalReport,
  current: MedicalReport,
): ReportComparison {
  const prevMap = indexNumeric(previous);
  const currMap = indexNumeric(current);
  const keys = new Set([...Object.keys(prevMap), ...Object.keys(currMap)]);

  const increased: ComparisonMetric[] = [];
  const decreased: ComparisonMetric[] = [];
  const unchanged: ComparisonMetric[] = [];

  for (const key of orderedKeys(keys)) {
    const a = prevMap[key];
    const b = currMap[key];
    if (!a || !b) continue;
    const metric = metricFor(key, a, b);
    if (metric.direction === "increased") increased.push(metric);
    else if (metric.direction === "decreased") decreased.push(metric);
    else unchanged.push(metric);
  }

  const label = current.reportName || current.storageKey.toUpperCase();
  return {
    reportType: current.storageKey,
    reportLabel: label,
    previousDate: previous.collectedDate || previous.dateKey,
    currentDate: current.collectedDate || current.dateKey,
    increased,
    decreased,
    unchanged,
    intro: `Comparing your ${label} from ${previous.dateKey} → ${current.dateKey}`,
    insight: "",
    disclaimer: "This is a simple summary, not a diagnosis.",
  };
}

function pickDominantType(reports: MedicalReport[]): string | null {
  const counts = new Map<string, number>();
  for (const r of reports) {
    counts.set(r.storageKey, (counts.get(r.storageKey) || 0) + 1);
  }
  if ((counts.get("cbc") || 0) >= 2) return "cbc";
  let best: string | null = null;
  let bestCount = 0;
  for (const [k, c] of counts) {
    if (c >= 2 && c > bestCount) {
      best = k;
      bestCount = c;
    }
  }
  return best;
}

export function compareLatestPair(
  reports: MedicalReport[],
  preferredType?: string,
): ReportComparison | null {
  if (reports.length < 2) return null;
  const type =
    preferredType?.trim().toLowerCase() || pickDominantType(reports);
  if (!type) return null;
  const same = reports
    .filter((r) => r.storageKey === type)
    .sort((a, b) => sortMs(b) - sortMs(a));
  if (same.length < 2) return null;
  return compareReports(same[1]!, same[0]!);
}
