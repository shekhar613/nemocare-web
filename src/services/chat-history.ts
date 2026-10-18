import type { ChatMessage } from "@/types";

const MAX = 100;

function key(uid: string) {
  return `nemocare_chat_${uid}`;
}

export function loadChatHistory(uid: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(uid: string, messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key(uid), JSON.stringify(messages.slice(-MAX)));
  } catch {
    /* ignore quota */
  }
}

export function clearChatHistory(uid: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(uid));
}
