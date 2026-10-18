"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { listReportsFromUserDoc } from "@/lib/reports";
import { statusFromFlag } from "@/lib/vital-templates";

export default function ReportDetailsPage() {
  const params = useParams<{ type: string; date: string }>();
  const { userDoc } = useAuth();
  const type = decodeURIComponent(params.type || "");
  const date = decodeURIComponent(params.date || "");

  const report = useMemo(() => {
    return listReportsFromUserDoc(userDoc).find(
      (r) => r.storageKey === type && r.dateKey === date,
    );
  }, [userDoc, type, date]);

  if (!report) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-[var(--muted)]">Report not found.</p>
        <Link href="/home?view=records" className="mt-3 inline-block text-[var(--deep-teal)]">
          Back to records
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/home?view=records"
        className="text-sm font-medium text-[var(--deep-teal)] hover:underline"
      >
        ← Records
      </Link>

      <div className="mt-4 rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
        <div
          className="mb-4 h-1.5 w-16 rounded-full"
          style={{
            background:
              report.category === "prescription"
                ? "#2F9E7B"
                : report.category === "imaging"
                  ? "#3B82A0"
                  : "#0B6E6E",
          }}
        />
        <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold text-[var(--ink)]">
          {report.reportName || report.storageKey}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {report.labName || "Lab"} · {report.collectedDate || report.dateKey}
        </p>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          {[
            ["Patient", report.patientName],
            ["Sex / Age", [report.patientSex, report.patientAge].filter(Boolean).join(" · ")],
            ["Sample", report.sampleType],
            ["City", report.cityName],
            ["Regn No", report.regnNo],
            ["MRD No", report.mrdNo],
          ].map(([label, value]) =>
            value ? (
              <div key={label as string}>
                <dt className="text-[var(--muted)]">{label}</dt>
                <dd className="font-medium text-[var(--ink)]">{value}</dd>
              </div>
            ) : null,
          )}
        </dl>

        {report.conclusion ? (
          <div className="mt-5 rounded-2xl bg-[var(--mist)] p-4 text-sm text-[var(--ink)]">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--deep-teal)]">
              Conclusion
            </p>
            {report.conclusion}
          </div>
        ) : null}

        <h2 className="mt-6 font-semibold text-[var(--ink)]">Values</h2>
        <div className="mt-2 overflow-hidden rounded-2xl border border-[var(--border)]">
          <div className="grid grid-cols-[1.4fr_0.8fr_1fr_0.6fr] gap-2 bg-[var(--mist)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            <span>Parameter</span>
            <span>Value</span>
            <span>Reference</span>
            <span>Flag</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {report.values.map((v) => {
              const status = statusFromFlag(v.flag);
              return (
                <div
                  key={`${v.parameterKey}-${v.rawLabel}`}
                  className="grid grid-cols-[1.4fr_0.8fr_1fr_0.6fr] gap-2 px-3 py-2.5 text-sm"
                >
                  <span className="font-medium">{v.rawLabel || v.parameterKey}</span>
                  <span>
                    {v.value ?? "—"}
                    {v.unit ? ` ${v.unit}` : ""}
                  </span>
                  <span className="text-[var(--muted)]">
                    {v.refLow != null || v.refHigh != null
                      ? `${v.refLow ?? "—"} – ${v.refHigh ?? "—"}`
                      : "—"}
                  </span>
                  <span
                    className="font-semibold uppercase"
                    style={{
                      color:
                        status === "low"
                          ? "#3B82A0"
                          : status === "high"
                            ? "#E07A5F"
                            : "#2F9E7B",
                    }}
                  >
                    {v.flag || "N"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
