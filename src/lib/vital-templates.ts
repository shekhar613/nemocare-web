export type VitalStatus = "low" | "normal" | "high" | "unknown";

export interface PanelParameter {
  name: string;
  unit: string;
  normalRange: string;
  aliases: string[];
}

export interface VitalPanelTemplate {
  id: string;
  title: string;
  order: number;
  matchKeys: string[];
  parameters: PanelParameter[];
}

export interface PresentedPanelRow {
  parameter: string;
  value: string;
  unit: string;
  normalRange: string;
  status: VitalStatus;
}

export const VITAL_PANEL_TEMPLATES: VitalPanelTemplate[] = [
  {
    id: "cbc",
    title: "Complete Blood Count (CBC)",
    order: 1,
    matchKeys: ["cbc", "complete blood count", "hemogram", "haemogram"],
    parameters: [
      {
        name: "Hemoglobin",
        unit: "g/dL",
        normalRange: "13.0–17.0 (M) / 12.0–15.5 (F)",
        aliases: ["hb", "hgb", "haemoglobin", "hemoglobin"],
      },
      {
        name: "RBC Count",
        unit: "million/µL",
        normalRange: "4.5–5.5 (M) / 3.8–4.8 (F)",
        aliases: ["rbc", "rbc_count", "red blood cell"],
      },
      {
        name: "Hematocrit (PCV)",
        unit: "%",
        normalRange: "40–50 (M) / 36–46 (F)",
        aliases: ["hematocrit", "hct", "pcv"],
      },
      {
        name: "MCV",
        unit: "fL",
        normalRange: "83–101",
        aliases: ["mcv"],
      },
      {
        name: "MCH",
        unit: "pg",
        normalRange: "27–32",
        aliases: ["mch"],
      },
      {
        name: "MCHC",
        unit: "g/dL",
        normalRange: "31.5–34.5",
        aliases: ["mchc"],
      },
      {
        name: "WBC Count",
        unit: "/µL",
        normalRange: "4000–11000",
        aliases: ["wbc", "wbc_count", "total wbc"],
      },
      {
        name: "Platelet Count",
        unit: "/µL",
        normalRange: "150000–410000",
        aliases: ["platelet", "platelet_count", "platelets"],
      },
      {
        name: "Neutrophils",
        unit: "%",
        normalRange: "40–70",
        aliases: ["neutrophils", "neutrophils_pct"],
      },
      {
        name: "Lymphocytes",
        unit: "%",
        normalRange: "20–40",
        aliases: ["lymphocytes", "lymphocytes_pct"],
      },
    ],
  },
  {
    id: "lipid_profile",
    title: "Lipid Profile",
    order: 2,
    matchKeys: ["lipid", "lipid_profile", "cholesterol"],
    parameters: [
      {
        name: "Total Cholesterol",
        unit: "mg/dL",
        normalRange: "<200",
        aliases: ["total_cholesterol", "cholesterol"],
      },
      {
        name: "HDL",
        unit: "mg/dL",
        normalRange: ">40 (M) / >50 (F)",
        aliases: ["hdl", "hdl_cholesterol"],
      },
      {
        name: "LDL",
        unit: "mg/dL",
        normalRange: "<100",
        aliases: ["ldl", "ldl_cholesterol"],
      },
      {
        name: "Triglycerides",
        unit: "mg/dL",
        normalRange: "<150",
        aliases: ["triglycerides", "tg"],
      },
    ],
  },
  {
    id: "lft",
    title: "Liver Function Tests",
    order: 3,
    matchKeys: ["lft", "liver"],
    parameters: [
      {
        name: "ALT / SGPT",
        unit: "U/L",
        normalRange: "7–55",
        aliases: ["alt", "sgpt"],
      },
      {
        name: "AST / SGOT",
        unit: "U/L",
        normalRange: "8–48",
        aliases: ["ast", "sgot"],
      },
      {
        name: "Bilirubin Total",
        unit: "mg/dL",
        normalRange: "0.1–1.2",
        aliases: ["bilirubin_total", "total_bilirubin"],
      },
    ],
  },
  {
    id: "thyroid",
    title: "Thyroid Profile",
    order: 4,
    matchKeys: ["thyroid", "thyroid_profile", "tsh"],
    parameters: [
      {
        name: "TSH",
        unit: "µIU/mL",
        normalRange: "0.4–4.0",
        aliases: ["tsh"],
      },
      {
        name: "Free T4",
        unit: "ng/dL",
        normalRange: "0.8–1.8",
        aliases: ["ft4", "free_t4"],
      },
      {
        name: "Free T3",
        unit: "pg/mL",
        normalRange: "2.3–4.2",
        aliases: ["ft3", "free_t3"],
      },
    ],
  },
  {
    id: "blood_sugar",
    title: "Blood Sugar",
    order: 5,
    matchKeys: ["blood_sugar", "glucose", "diabetes", "hba1c"],
    parameters: [
      {
        name: "Fasting Blood Sugar",
        unit: "mg/dL",
        normalRange: "70–100",
        aliases: ["fasting_blood_sugar", "fbs", "glucose"],
      },
      {
        name: "Random Blood Sugar",
        unit: "mg/dL",
        normalRange: "<140",
        aliases: ["random_blood_sugar", "rbs"],
      },
      {
        name: "HbA1c",
        unit: "%",
        normalRange: "<5.7",
        aliases: ["hba1c", "a1c"],
      },
    ],
  },
  {
    id: "kft",
    title: "Kidney Function",
    order: 6,
    matchKeys: ["kft", "kidney", "renal"],
    parameters: [
      {
        name: "Creatinine",
        unit: "mg/dL",
        normalRange: "0.6–1.3",
        aliases: ["creatinine"],
      },
      {
        name: "Urea",
        unit: "mg/dL",
        normalRange: "15–40",
        aliases: ["urea", "blood_urea"],
      },
      {
        name: "Uric Acid",
        unit: "mg/dL",
        normalRange: "3.5–7.2",
        aliases: ["uric_acid"],
      },
    ],
  },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function statusFromFlag(flag: string | null | undefined): VitalStatus {
  const f = String(flag ?? "").toUpperCase();
  if (f === "L") return "low";
  if (f === "H") return "high";
  if (f === "N" || f === "") return "normal";
  return "unknown";
}

export function matchTemplateToReportKey(
  template: VitalPanelTemplate,
  reportKey: string,
  reportName: string,
): boolean {
  const hay = `${reportKey} ${reportName}`.toLowerCase();
  return template.matchKeys.some((k) => hay.includes(k));
}
export { normalize };
