"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { listReportsFromUserDoc } from "@/lib/reports";
import {
  matchTemplateToReportKey,
  statusFromFlag,
  VITAL_PANEL_TEMPLATES,
  type PresentedPanelRow,
  type VitalStatus,
} from "@/lib/vital-templates";
import type { LabValue, MedicalReport } from "@/types";

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function findValue(
  values: LabValue[],
  aliases: string[],
): LabValue | undefined {
  const aliasSet = new Set(aliases.map(normalize));
  return values.find(
    (v) =>
      aliasSet.has(normalize(v.parameterKey)) ||
      aliasSet.has(normalize(v.rawLabel)),
  );
}

function statusColor(status: VitalStatus): string {
  if (status === "low") return "#3B82A0";
  if (status === "high") return "#E07A5F";
  if (status === "normal") return "#2F9E7B";
  return "#5A7375";
}

export default function VitalsPage() {
  const { userDoc } = useAuth();
  const reports = useMemo(
    () => listReportsFromUserDoc(userDoc),
    [userDoc],
  );

  const panels = useMemo(() => {
    return VITAL_PANEL_TEMPLATES.map((template) => {
      const match: MedicalReport | undefined = reports.find((r) =>
        matchTemplateToReportKey(template, r.storageKey, r.reportName),
      );
      if (!match) return null;

      const rows: PresentedPanelRow[] = template.parameters.map((p) => {
        const hit = findValue(match.values, [p.name, ...p.aliases]);
        const status = hit
          ? statusFromFlag(hit.flag) === "unknown" &&
            hit.refLow != null &&
            hit.refHigh != null &&
            typeof hit.value === "number"
            ? hit.value < hit.refLow
              ? "low"
              : hit.value > hit.refHigh
                ? "high"
                : "normal"
            : statusFromFlag(hit.flag)
          : "unknown";

        return {
          parameter: p.name,
          value: hit ? String(hit.value ?? "—") : "—",
          unit: hit?.unit || p.unit,
          normalRange: p.normalRange,
          status,
        };
      });

      return {
        template,
        report: match,
        rows,
      };
    }).filter(Boolean);
  }, [reports]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-[family-name:var(--font-sora)] text-xl font-bold text-[var(--ink)]">
        Vitals
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Standard panels filled from your latest matching reports
      </p>

      <div className="mt-6 space-y-4">
        {panels.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border)] bg-white px-6 py-16 text-center text-sm text-[var(--muted)]">
            Upload lab reports to see vitals panels here.
          </div>
        ) : (
          panels.map((panel) =>
            panel ? (
              <section
                key={panel.template.id}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm"
              >
                <div className="border-b border-[var(--border)] bg-[var(--mist)] px-4 py-3">
                  <h2 className="font-semibold text-[var(--ink)]">
                    {panel.template.title}
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    {panel.report.reportName} ·{" "}
                    {panel.report.collectedDate || panel.report.dateKey}
                  </p>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {panel.rows.map((row) => (
                    <div
                      key={row.parameter}
                      className="grid grid-cols-[1.2fr_0.8fr_1fr_0.7fr] gap-2 px-4 py-2.5 text-sm"
                    >
                      <span className="font-medium text-[var(--ink)]">
                        {row.parameter}
                      </span>
                      <span>
                        {row.value}
                        {row.value !== "—" && row.unit ? ` ${row.unit}` : ""}
                      </span>
                      <span className="text-[var(--muted)]">
                        {row.normalRange}
                      </span>
                      <span
                        className="font-semibold capitalize"
                        style={{ color: statusColor(row.status) }}
                      >
                        {row.value === "—" ? "—" : row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null,
          )
        )}
      </div>
    </div>
  );
}
