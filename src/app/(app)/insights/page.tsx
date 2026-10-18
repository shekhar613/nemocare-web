"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { parseInsightsBundle, refreshInsights } from "@/services/insights";

function categoryStyle(category: string) {
  if (category === "risk") {
    return { bg: "#FFF1E6", color: "#B45F06", label: "Risk context" };
  }
  if (category === "remedy") {
    return { bg: "#E8F6EE", color: "#2D8A5E", label: "What may help" };
  }
  return { bg: "#EBF8FF", color: "#3182CE", label: "Explanation" };
}

export default function InsightsPage() {
  const { userDoc } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const bundle = useMemo(() => parseInsightsBundle(userDoc), [userDoc]);

  async function onRefresh() {
    setBusy(true);
    setError("");
    try {
      await refreshInsights({ force: true, userDoc: userDoc ?? undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-xl font-bold text-[var(--ink)]">
            Insights
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Educational cards grounded in your findings and trusted sources
          </p>
        </div>
        <button
          type="button"
          className="nc-btn nc-btn-ghost !py-2 !text-sm"
          disabled={busy}
          onClick={onRefresh}
        >
          {busy ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-[var(--coral)]">{error}</p>
      ) : null}

      {bundle?.generatedAt ? (
        <p className="mt-2 text-xs text-[var(--muted)]">
          Updated {new Date(bundle.generatedAt).toLocaleString()}
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        {!bundle?.cards?.length ? (
          <div className="rounded-3xl border border-dashed border-[var(--border)] bg-white px-6 py-16 text-center text-sm text-[var(--muted)]">
            Insights appear after you upload reports with notable findings.
            Start the Express backend and tap Refresh if needed.
          </div>
        ) : (
          bundle.cards.map((card, i) => {
            const style = categoryStyle(card.category);
            return (
              <article
                key={`${card.title}-${i}`}
                className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm"
              >
                <span
                  className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ background: style.bg, color: style.color }}
                >
                  {style.label}
                </span>
                <h2 className="mt-2 font-[family-name:var(--font-sora)] text-lg font-semibold text-[var(--ink)]">
                  {card.title}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
                  {card.body}
                </p>
                {card.sourceUrls?.length ? (
                  <ul className="mt-3 space-y-1">
                    {card.sourceUrls.slice(0, 4).map((url) => (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-xs text-[var(--deep-teal)] hover:underline"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
