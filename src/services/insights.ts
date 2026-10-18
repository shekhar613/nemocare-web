import { insightsRefreshUrl } from "@/lib/config";
import { getFirebaseAuth } from "@/lib/firebase";
import type { InsightsBundle, InsightCard } from "@/types";

export function parseInsightsBundle(
  data: Record<string, unknown> | null | undefined,
): InsightsBundle | null {
  if (!data) return null;
  const insights = data.insights;
  if (!insights || typeof insights !== "object") return null;
  const bundle = insights as Record<string, unknown>;
  const cardsRaw = bundle.cards;
  const cards: InsightCard[] = Array.isArray(cardsRaw)
    ? cardsRaw.map((c) => {
        const card = (c ?? {}) as Record<string, unknown>;
        return {
          title: String(card.title ?? ""),
          body: String(card.body ?? ""),
          category: String(card.category ?? "explanation"),
          supportingFindingKeys: Array.isArray(card.supportingFindingKeys)
            ? card.supportingFindingKeys.map(String)
            : [],
          sourceUrls: Array.isArray(card.sourceUrls)
            ? card.sourceUrls.map(String)
            : [],
        };
      })
    : [];

  return {
    fingerprint: String(bundle.fingerprint ?? ""),
    cards,
    generatedAt: String(bundle.generatedAt ?? ""),
  };
}

export async function refreshInsights(options?: {
  force?: boolean;
  userDoc?: Record<string, unknown>;
}): Promise<InsightsBundle | null> {
  const user = getFirebaseAuth().currentUser;
  const email = user?.email?.trim().toLowerCase();
  if (!user || !email) return null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  } catch {
    /* optional auth */
  }

  const res = await fetch(insightsRefreshUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      force: options?.force ?? false,
      persist: true,
      userDoc: options?.userDoc,
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as Record<string, unknown>;
  return parseInsightsBundle({ insights: json });
}
