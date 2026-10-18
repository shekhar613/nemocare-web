import { PROFILE_KEYS } from "@/lib/config";
import type { LabValue, MedicalReport } from "@/types";

function asLabValues(raw: unknown): LabValue[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const v = (item ?? {}) as Record<string, unknown>;
    return {
      parameterKey: String(v.parameterKey ?? ""),
      rawLabel: String(v.rawLabel ?? v.parameterKey ?? ""),
      valueType: String(v.valueType ?? "numeric"),
      value: (v.value as number | string | null) ?? null,
      unit: String(v.unit ?? ""),
      refLow: typeof v.refLow === "number" ? v.refLow : null,
      refHigh: typeof v.refHigh === "number" ? v.refHigh : null,
      flag: v.flag == null ? null : String(v.flag),
    };
  });
}

export function parseReportEntry(
  storageKey: string,
  dateKey: string,
  data: Record<string, unknown>,
): MedicalReport {
  return {
    storageKey,
    dateKey,
    docType: String(data.docType ?? storageKey),
    isMedical: data.isMedical !== false,
    labName: String(data.labName ?? ""),
    patientName: String(data.patientName ?? ""),
    patientSex: String(data.patientSex ?? ""),
    patientAge: typeof data.patientAge === "number" ? data.patientAge : null,
    collectedDate: String(data.collectedDate ?? dateKey),
    reportApprovedDate: String(data.reportApprovedDate ?? dateKey),
    regnNo: String(data.regnNo ?? ""),
    mrdNo: String(data.mrdNo ?? ""),
    values: asLabValues(data.values),
    reportName: String(data.reportName ?? storageKey.toUpperCase()),
    category: String(data.category ?? "lab"),
    cityName: String(data.cityName ?? ""),
    sampleType: String(data.sampleType ?? ""),
    conclusion: String(data.conclusion ?? ""),
    fileName: String(data.fileName ?? ""),
    confidence: typeof data.confidence === "number" ? data.confidence : 0,
    fullReport: (data.fullReport as Record<string, unknown>) ?? {},
    isStarred: Boolean(data.isStarred),
    createdAt: String(data.createdAt ?? ""),
  };
}

export function listReportsFromUserDoc(
  userDoc: Record<string, unknown> | null | undefined,
): MedicalReport[] {
  if (!userDoc) return [];
  const reports: MedicalReport[] = [];

  for (const [key, value] of Object.entries(userDoc)) {
    if (PROFILE_KEYS.has(key)) continue;
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;

    const dated = value as Record<string, unknown>;
    for (const [dateKey, entry] of Object.entries(dated)) {
      if (!/^\d{4}-\d{2}-\d{2}/.test(dateKey)) continue;
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      reports.push(
        parseReportEntry(key, dateKey, entry as Record<string, unknown>),
      );
    }
  }

  return reports.sort((a, b) => {
    const da = a.collectedDate || a.dateKey;
    const db = b.collectedDate || b.dateKey;
    return db.localeCompare(da);
  });
}

export function slugReportKey(docType: string, reportName: string): string {
  const raw = (docType || reportName || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return raw || "report";
}

export function dateKeyFromAnalysis(dates: string[]): string {
  for (const d of dates) {
    const m = d.match(/(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1]!;
  }
  return new Date().toISOString().slice(0, 10);
}
