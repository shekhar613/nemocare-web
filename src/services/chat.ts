import { chatAskUrl, healthUrl } from "@/lib/config";
import { getFirebaseAuth } from "@/lib/firebase";
import type { ChatMessage, ReportComparison } from "@/types";

export interface HealthAgentReply {
  reply: string;
  comparison?: ReportComparison | null;
}

let warmedUp = false;

export async function warmUpBackend(): Promise<void> {
  if (warmedUp) return;
  warmedUp = true;
  try {
    await fetch(healthUrl, { method: "GET" });
  } catch {
    warmedUp = false;
  }
}

async function authHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const user = getFirebaseAuth().currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function askDetailed(params: {
  question: string;
  history?: ChatMessage[];
  comparisonContext?: ReportComparison | null;
}): Promise<HealthAgentReply> {
  const trimmed = params.question.trim();
  if (!trimmed) throw new Error("Please enter a question.");

  const user = getFirebaseAuth().currentUser;
  const email = user?.email?.trim().toLowerCase();
  if (!email) throw new Error("Sign in to ask about your health.");

  const history = (params.history ?? [])
    .slice(-4)
    .map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch(chatAskUrl, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      email,
      question: trimmed,
      history,
      comparisonContext: params.comparisonContext ?? undefined,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      String(json.error || json.message || `Chat failed (${res.status})`),
    );
  }

  return {
    reply: String(json.reply ?? ""),
    comparison: (json.comparison as ReportComparison | null) ?? null,
  };
}

export async function* askStream(params: {
  question: string;
  history?: ChatMessage[];
  comparisonContext?: ReportComparison | null;
}): AsyncGenerator<string, HealthAgentReply, unknown> {
  const result = await askDetailed(params);
  const chunkSize = 24;
  for (let i = 0; i < result.reply.length; i += chunkSize) {
    yield result.reply.slice(i, i + chunkSize);
    await new Promise((r) => setTimeout(r, 12));
  }
  return result;
}
