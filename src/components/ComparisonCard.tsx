"use client";

import type { ComparisonMetric, ReportComparison } from "@/types";

function MetricGroup({
  title,
  items,
  color,
  bg,
  badgeBg,
}: {
  title: string;
  items: ComparisonMetric[];
  color: string;
  bg: string;
  badgeBg: string;
}) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl p-3" style={{ background: bg }}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color }}>
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((m) => (
          <li
            key={m.parameterKey}
            className="flex items-center justify-between gap-2 text-sm text-[var(--ink)]"
          >
            <span className="font-medium">{m.label}</span>
            <span className="flex items-center gap-2 text-[var(--muted)]">
              <span>
                {m.previousValue}
                {m.unit ? ` ${m.unit}` : ""} → {m.currentValue}
                {m.unit ? ` ${m.unit}` : ""}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ background: badgeBg, color }}
              >
                {m.badgeText}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ComparisonCard({
  comparison,
  onUnderstandMore,
}: {
  comparison: ReportComparison;
  onUnderstandMore?: () => void;
}) {
  return (
    <div className="max-w-xl rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="mb-3">
        <p className="font-[family-name:var(--font-sora)] text-base font-semibold text-[var(--ink)]">
          {comparison.reportLabel}
        </p>
        <p className="text-sm text-[var(--muted)]">
          {comparison.previousDate} → {comparison.currentDate}
        </p>
        {comparison.intro ? (
          <p className="mt-1 text-sm text-[var(--muted)]">{comparison.intro}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <MetricGroup
          title="Increased"
          items={comparison.increased}
          color="#2D8A5E"
          bg="#E8F6EE"
          badgeBg="#D4F0E0"
        />
        <MetricGroup
          title="Decreased"
          items={comparison.decreased}
          color="#B45F06"
          bg="#FFF1E6"
          badgeBg="#FFE4CC"
        />
        <MetricGroup
          title="Unchanged"
          items={comparison.unchanged}
          color="#718096"
          bg="#F1F3F5"
          badgeBg="#E2E8F0"
        />
      </div>

      {comparison.insight ? (
        <div className="mt-3 rounded-2xl border border-[#BEE3F8] bg-[#EBF8FF] p-3">
          <p className="mb-1 text-xs font-semibold text-[#3182CE]">Insight</p>
          <p className="text-sm text-[var(--ink)]">{comparison.insight}</p>
        </div>
      ) : null}

      <p className="mt-3 text-xs text-[var(--muted)]">{comparison.disclaimer}</p>

      {onUnderstandMore ? (
        <button
          type="button"
          onClick={onUnderstandMore}
          className="mt-3 text-sm font-semibold text-[var(--deep-teal)] hover:underline"
        >
          Understand more →
        </button>
      ) : null}
    </div>
  );
}
