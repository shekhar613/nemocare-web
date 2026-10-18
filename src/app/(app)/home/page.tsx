"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ComparisonCard } from "@/components/ComparisonCard";
import { useAuth } from "@/components/AuthProvider";
import {
  compareLatestPair,
  isComparisonIntent,
} from "@/lib/report-comparison";
import { askDetailed, warmUpBackend } from "@/services/chat";
import {
  clearChatHistory,
  loadChatHistory,
  saveChatHistory,
} from "@/services/chat-history";
import { analyzeMedicalDocument } from "@/services/groq";
import { listReportsFromUserDoc, saveAnalyzedReport } from "@/services/reports";
import type { ChatMessage, MedicalReport } from "@/types";

function categoryAccent(category: string): string {
  if (category === "prescription") return "#2F9E7B";
  if (category === "imaging") return "#3B82A0";
  return "#0B6E6E";
}

function HomeInner() {
  const { user, userDoc } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const showRecords = search.get("view") === "records";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showTimeline, setShowTimeline] = useState(showRecords);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const reports = useMemo(
    () => listReportsFromUserDoc(userDoc),
    [userDoc],
  );

  useEffect(() => {
    setShowTimeline(showRecords);
  }, [showRecords]);

  useEffect(() => {
    void warmUpBackend();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    setMessages(loadChatHistory(user.uid));
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    saveChatHistory(user.uid, messages);
  }, [messages, user?.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function onAsk(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || busy) return;
    setError("");
    setShowTimeline(false);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: q,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setQuestion("");
    setBusy(true);

    const assistantId = crypto.randomUUID();
    setMessages((m) => [
      ...m,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const comparisonContext = isComparisonIntent(q)
        ? compareLatestPair(reports)
        : null;

      const result = await askDetailed({
        question: q,
        history: [...messages, userMsg],
        comparisonContext,
      });

      const comparison = result.comparison || comparisonContext;
      const reply =
        result.reply ||
        (comparison
          ? "Here’s a side-by-side look at your recent reports."
          : "I couldn’t generate a reply right now.");

      // Fake stream into UI
      let built = "";
      const chunk = 24;
      for (let i = 0; i < reply.length; i += chunk) {
        built += reply.slice(i, i + chunk);
        const snapshot = built;
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: snapshot,
                  comparison: i + chunk >= reply.length ? comparison : msg.comparison,
                }
              : msg,
          ),
        );
        await new Promise((r) => setTimeout(r, 12));
      }

      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: reply, comparison }
            : msg,
        ),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: message }
            : msg,
        ),
      );
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(file: File) {
    if (!userDoc) {
      setError("Profile not loaded yet.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const analysis = await analyzeMedicalDocument(file);
      await saveAnalyzedReport(analysis, file.name, userDoc);
      setShowTimeline(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-3xl flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-xl font-bold text-[var(--ink)]">
            {showTimeline ? "Health records" : "Ask Nemo"}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {showTimeline
              ? "Your uploaded lab reports and clinical documents"
              : "Ask about your health reports"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="nc-btn nc-btn-ghost !py-2 !text-sm"
            onClick={() => setShowTimeline((v) => !v)}
          >
            {showTimeline ? "Open chat" : "View records"}
          </button>
          {!showTimeline && messages.length > 0 ? (
            <button
              type="button"
              className="nc-btn nc-btn-ghost !py-2 !text-sm"
              onClick={() => {
                if (user?.uid) clearChatHistory(user.uid);
                setMessages([]);
              }}
            >
              Clear chat
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mb-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-[var(--coral)]">
          {error}
        </div>
      ) : null}

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {showTimeline ? (
          reports.length === 0 ? (
            <EmptyState
              title="No reports yet"
              body="Upload a lab report image to start your health timeline."
            />
          ) : (
            reports.map((r) => <ReportCard key={`${r.storageKey}-${r.dateKey}`} report={r} />)
          )
        ) : messages.length === 0 ? (
          <EmptyState
            title="Ask about your health reports"
            body="Try “Why is my MCV low?” or “Compare my last two CBC reports.”"
          />
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[var(--deep-teal)] text-white"
                    : "border border-[var(--border)] bg-white text-[var(--ink)]"
                }`}
              >
                {m.content || (busy ? "…" : "")}
                {m.comparison ? (
                  <div className="mt-3">
                    <ComparisonCard
                      comparison={m.comparison}
                      onUnderstandMore={() => router.push("/insights")}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={onAsk}
        className="sticky bottom-0 mt-auto border-t border-[var(--border)] bg-[var(--foam)] pt-3"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-sm">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl p-2.5 text-[var(--deep-teal)] hover:bg-[var(--mist)]"
            title="Upload report"
          >
            {uploading ? (
              <span className="text-xs font-medium">…</span>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 16V8m0 0 3.5 3.5M12 8 8.5 11.5M6 20h12a2 2 0 0 0 2-2v-3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <textarea
            rows={1}
            className="max-h-32 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm outline-none"
            placeholder="Ask about your health reports"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onAsk(e as unknown as FormEvent);
              }
            }}
          />
          <button
            type="submit"
            disabled={busy || !question.trim()}
            className="nc-btn nc-btn-primary !rounded-xl !px-4 !py-2.5"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-[var(--muted)]">
          Educational only — not a diagnosis or prescription.
        </p>
      </form>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--border)] bg-white/70 px-6 py-16 text-center">
      <p className="font-[family-name:var(--font-sora)] text-lg font-semibold text-[var(--ink)]">
        {title}
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}

function ReportCard({ report }: { report: MedicalReport }) {
  const accent = categoryAccent(report.category);
  const flagged = report.values.filter(
    (v) => v.flag === "L" || v.flag === "H",
  ).length;

  return (
    <Link
      href={`/reports/${encodeURIComponent(report.storageKey)}/${encodeURIComponent(report.dateKey)}`}
      className="block rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:border-[var(--teal)]"
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 h-10 w-1.5 rounded-full"
          style={{ background: accent }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold text-[var(--ink)]">
              {report.reportName || report.storageKey}
            </p>
            <span className="shrink-0 text-xs text-[var(--muted)]">
              {report.collectedDate || report.dateKey}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
            {report.labName || report.category}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {report.values.length} values
            {flagged ? ` · ${flagged} flagged` : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-[var(--muted)]">Loading…</div>
      }
    >
      <HomeInner />
    </Suspense>
  );
}
