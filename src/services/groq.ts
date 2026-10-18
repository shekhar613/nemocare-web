import { GROQ_API_KEY } from "@/lib/config";
import type { DocumentAnalysis, LabValue } from "@/types";

const SYSTEM_PROMPT = `You are a medical document classifier and extractor for Nemo Care, a personal
health records app. Analyze the uploaded document (image or PDF page) and decide
if it is a genuine medical / health-care record.

Respond with ONLY a JSON object (no markdown) using this exact schema:
{
  "is_medical": boolean,
  "category": "lab" | "prescription" | "imaging" | "clinical_report" | "other_medical" | "non_medical",
  "doc_type": "short snake_case panel key e.g. cbc, lipid_profile, lft, kft, thyroid_profile, urine_routine",
  "report_name": "human title e.g. CBC",
  "lab_name": "",
  "city_name": "",
  "sample_type": "",
  "collection_date": "YYYY-MM-DD",
  "test_date": "YYYY-MM-DD",
  "report_approved_date": "YYYY-MM-DD",
  "patient_name": "",
  "patient_sex": "male | female | other | empty",
  "patient_age": number or null,
  "regn_no": "",
  "mrd_no": "",
  "values": [{ "parameterKey", "rawLabel", "valueType", "value", "unit", "refLow", "refHigh", "flag" }],
  "parameters": [],
  "vitals": [{ "parameter", "value", "unit", "reference", "status" }],
  "conclusion": "",
  "confidence": 0.0,
  "full_report": {},
  "rejection_reason": null
}

Rules:
- Always set doc_type to a stable snake_case key.
- values[] is required for lab panels.
- Never diagnose or prescribe. Missing fields → empty string, [], or null.`;

function parseLabValues(raw: unknown): LabValue[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const v = (item ?? {}) as Record<string, unknown>;
    return {
      parameterKey: String(v.parameterKey ?? ""),
      rawLabel: String(v.rawLabel ?? ""),
      valueType: String(v.valueType ?? "numeric"),
      value: (v.value as number | string | null) ?? null,
      unit: String(v.unit ?? ""),
      refLow: typeof v.refLow === "number" ? v.refLow : null,
      refHigh: typeof v.refHigh === "number" ? v.refHigh : null,
      flag: v.flag == null ? null : String(v.flag),
    };
  });
}

function toAnalysis(json: Record<string, unknown>): DocumentAnalysis {
  return {
    isMedical: Boolean(json.is_medical),
    category: String(json.category ?? "non_medical"),
    docType: String(json.doc_type ?? ""),
    reportName: String(json.report_name ?? ""),
    labName: String(json.lab_name ?? ""),
    cityName: String(json.city_name ?? ""),
    sampleType: String(json.sample_type ?? ""),
    collectionDate: String(json.collection_date ?? ""),
    testDate: String(json.test_date ?? ""),
    reportApprovedDate: String(json.report_approved_date ?? ""),
    patientName: String(json.patient_name ?? ""),
    patientSex: String(json.patient_sex ?? ""),
    patientAge: typeof json.patient_age === "number" ? json.patient_age : null,
    regnNo: String(json.regn_no ?? ""),
    mrdNo: String(json.mrd_no ?? ""),
    values: parseLabValues(json.values),
    parameters: Array.isArray(json.parameters)
      ? json.parameters.map(String)
      : [],
    vitals: Array.isArray(json.vitals)
      ? json.vitals.map((v) => {
          const row = (v ?? {}) as Record<string, unknown>;
          return {
            parameter: String(row.parameter ?? ""),
            value: String(row.value ?? ""),
            unit: String(row.unit ?? ""),
            reference: String(row.reference ?? ""),
            status: String(row.status ?? "unknown"),
          };
        })
      : [],
    conclusion: String(json.conclusion ?? ""),
    confidence: typeof json.confidence === "number" ? json.confidence : 0,
    fullReport: (json.full_report as Record<string, unknown>) ?? {},
    rejectionReason: json.rejection_reason
      ? String(json.rejection_reason)
      : null,
  };
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export async function analyzeMedicalDocument(
  file: File,
): Promise<DocumentAnalysis> {
  if (!GROQ_API_KEY) {
    throw new Error(
      "NEXT_PUBLIC_GROQ_API_KEY is not set. Add it to .env.local to upload reports.",
    );
  }

  const isImage = file.type.startsWith("image/");
  if (!isImage && file.type !== "application/pdf") {
    throw new Error("Please upload a PDF or image (PNG / JPG).");
  }

  // Groq vision works best with images; for PDF ask user to use first-page image
  // or we send as image/jpeg if somehow converted — for PDF we reject with guidance
  // unless it's small enough that we still try as text isn't available. Prefer images.
  if (!isImage) {
    throw new Error(
      "For web uploads, please export or screenshot the first page as PNG/JPG. PDF page rendering is not enabled in this build.",
    );
  }

  const dataUrl = await fileToDataUrl(file);

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract and classify this medical document.",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      String(
        (json.error as { message?: string } | undefined)?.message ||
          `Groq error (${res.status})`,
      ),
    );
  }

  const content = String(
    (json.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]
      ?.message?.content ?? "{}",
  );

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error("Could not parse document analysis.");
  }

  return toAnalysis(parsed);
}
