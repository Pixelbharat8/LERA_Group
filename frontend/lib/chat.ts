import { apiFetch } from "./api";
import { getAuthUserIdFromCookie } from "./auth-context";

/**
 * Typed wrappers around the connect_service `/api/chat` backend (DIRECT conversations).
 * Used by the parent↔teacher messaging UI. The backend resolves participant display
 * names server-side, scopes every call to the authenticated user, and 1:1-dedupes
 * conversations, so the client only needs the other party's auth user id to start a chat.
 */

export type ChatConversation = {
  /** conversation id (NOT the recipient) */
  id: string;
  /** the other participant's display name, resolved server-side */
  name: string;
  avatarInitial?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  type?: string;
  participantIds?: string[];
};

export type ChatMessageRow = {
  id: string;
  senderId: string | null;
  message: string;
  messageType?: string;
  sentAt?: string;
  isRead?: boolean;
};

export async function loadConversations(): Promise<ChatConversation[]> {
  const data = await apiFetch("/api/chat/conversations").catch(() => []);
  return Array.isArray(data) ? (data as ChatConversation[]) : [];
}

export async function loadConversationMessages(conversationId: string): Promise<ChatMessageRow[]> {
  const data = await apiFetch(`/api/chat/conversations/${conversationId}/messages`).catch(() => []);
  return Array.isArray(data) ? (data as ChatMessageRow[]) : [];
}

export async function sendChatMessage(conversationId: string, message: string): Promise<void> {
  const senderId = getAuthUserIdFromCookie();
  await apiFetch("/api/chat/messages", {
    method: "POST",
    body: JSON.stringify({ conversationId, senderId, message, messageType: "TEXT" }),
  });
}

/**
 * Find-or-create a DIRECT conversation with `recipientId` (an auth user id).
 * The backend returns the existing conversation if one already exists.
 * @returns the conversation id
 */
export async function startConversation(recipientId: string): Promise<string> {
  const senderId = getAuthUserIdFromCookie();
  const res = (await apiFetch("/api/chat/conversations", {
    method: "POST",
    body: JSON.stringify({ senderId, recipientId, participantIds: [senderId, recipientId] }),
  })) as { id?: string };
  if (!res?.id) throw new Error("Could not start conversation");
  return String(res.id);
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await apiFetch(`/api/chat/conversations/${conversationId}/read`, { method: "PUT" }).catch(() => {});
}
