import { apiFetch } from "./api";
import { getAuthUserIdFromCookie } from "./auth-context";

export type InboxMessage = {
  id: string;
  subject: string;
  content: string;
  sender: string;
  senderRole: string;
  timestamp: string;
  read: boolean;
  priority: "HIGH" | "NORMAL";
};

export function mapInboxMessage(m: Record<string, unknown>): InboxMessage {
  const type = String(m.type ?? "MESSAGE");
  return {
    id: String(m.id),
    subject: String(m.title ?? m.subject ?? "No Subject"),
    content: String(m.content ?? m.message ?? m.body ?? ""),
    sender: String(m.senderName ?? m.sender ?? type),
    senderRole: String(m.senderRole ?? type),
    timestamp: String(m.createdAt ?? m.timestamp ?? m.date ?? new Date().toISOString()),
    read: Boolean(m.read ?? m.isRead),
    priority: type.includes("HIGH") || type.includes("URGENT") ? "HIGH" : "NORMAL",
  };
}

/** Inbox for the given auth user id (notifications stored by JWT user id). */
export async function loadMessagesForUser(userId: string): Promise<InboxMessage[]> {
  const data = await apiFetch(`/api/messages?userId=${encodeURIComponent(userId)}`).catch(() => []);
  return Array.isArray(data) ? data.map((m) => mapInboxMessage(m as Record<string, unknown>)) : [];
}

export async function loadMyMessages(): Promise<InboxMessage[]> {
  const userId = getAuthUserIdFromCookie();
  if (!userId) return [];
  return loadMessagesForUser(userId);
}

export async function markMessageRead(messageId: string): Promise<void> {
  await apiFetch(`/api/messages/${messageId}/read`, { method: "PUT" });
}
