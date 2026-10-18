import { setDoc } from "firebase/firestore";
import { computeFindings, mergeFindingsMap } from "@/lib/findings";
import {
  dateKeyFromAnalysis,
  listReportsFromUserDoc,
  slugReportKey,
} from "@/lib/reports";
import { userDocRef } from "@/services/auth";
import { refreshInsights } from "@/services/insights";
import { getFirebaseAuth } from "@/lib/firebase";
import type { DocumentAnalysis, MedicalReport } from "@/types";

export { listReportsFromUserDoc };

export async function saveAnalyzedReport(
  analysis: DocumentAnalysis,
  fileName: string,
  existingDoc: Record<string, unknown>,
): Promise<{ report: MedicalReport; userDoc: Record<string, unknown> }> {
  const user = getFirebaseAuth().currentUser;
  const email = user?.email?.trim().toLowerCase();
  if (!user || !email) throw new Error("Sign in to save reports.");

  if (!analysis.isMedical) {
    throw new Error(
      analysis.rejectionReason || "This file does not look like a medical document.",
    );
  }

  const storageKey = slugReportKey(analysis.docType, analysis.reportName);
  const dateKey = dateKeyFromAnalysis([
    analysis.collectionDate,
    analysis.testDate,
    analysis.reportApprovedDate,
  ]);

  const payload = {
    docType: storageKey,
    isMedical: true,
    labName: analysis.labName,
    patientName: analysis.patientName,
    patientSex: analysis.patientSex,
    patientAge: analysis.patientAge,
    collectedDate: analysis.collectionDate || dateKey,
    reportApprovedDate: analysis.reportApprovedDate || analysis.testDate || dateKey,
    regnNo: analysis.regnNo,
    mrdNo: analysis.mrdNo,
    values: analysis.values,
    reportName: analysis.reportName || storageKey.toUpperCase(),
    category: analysis.category || "lab",
    cityName: analysis.cityName,
    sampleType: analysis.sampleType,
    conclusion: analysis.conclusion,
    fileName,
    confidence: analysis.confidence,
    fullReport: analysis.fullReport,
    isStarred: false,
    createdAt: new Date().toISOString(),
  };

  const nextDoc: Record<string, unknown> = {
    ...existingDoc,
    [storageKey]: {
      ...((existingDoc[storageKey] as Record<string, unknown>) || {}),
      [dateKey]: payload,
    },
  };

  const computed = computeFindings(nextDoc);
  const findings = mergeFindingsMap(
    computed,
    (existingDoc.findings as Record<string, unknown>) || {},
  );
  nextDoc.findings = findings;
  nextDoc.updatedAt = new Date().toISOString();

  await setDoc(
    userDocRef(email),
    {
      [storageKey]: { [dateKey]: payload },
      findings,
      updatedAt: nextDoc.updatedAt,
    },
    { merge: true },
  );

  void refreshInsights({ userDoc: nextDoc });

  return {
    report: {
      storageKey,
      dateKey,
      ...payload,
      values: analysis.values,
    },
    userDoc: nextDoc,
  };
}

export async function toggleStarReport(
  report: MedicalReport,
  starred: boolean,
): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  const email = user?.email?.trim().toLowerCase();
  if (!user || !email) return;
  await setDoc(
    userDocRef(email),
    {
      [report.storageKey]: {
        [report.dateKey]: { isStarred: starred },
      },
    },
    { merge: true },
  );
}
