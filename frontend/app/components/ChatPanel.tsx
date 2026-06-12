"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  loadConversations,
  loadConversationMessages,
  sendChatMessage,
  startConversation,
  markConversationRead,
  type ChatConversation,
  type ChatMessageRow,
} from "../../lib/chat";
import { getAuthUserIdFromCookie } from "../../lib/auth-context";

export type ChatRecipient = {
  /** auth user id of the person to message */
  id: string;
  name: string;
  /** optional secondary line, e.g. class name or child name */
  subtitle?: string;
};

type ChatPanelProps = {
  /** People this user can start a new conversation with (teachers for a parent, parents for a teacher). */
  recipients: ChatRecipient[];
  recipientsLoading?: boolean;
  /** Noun for the "new conversation" picker, e.g. "teacher" or "parent". */
  recipientNoun: string;
  breadcrumbHref: string;
  breadcrumbLabel: string;
};

function timeLabel(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ChatPanel({
  recipients,
  recipientsLoading,
  recipientNoun,
  breadcrumbHref,
  breadcrumbLabel,
}: ChatPanelProps) {
  const [me] = useState<string | null>(() => getAuthUserIdFromCookie());
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const refreshConversations = useCallback(async () => {
    const list = await loadConversations();
    setConversations(list);
    return list;
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshConversations();
      setLoading(false);
    })();
  }, [refreshConversations]);

  const openConversation = useCallback(async (conversationId: string) => {
    setSelectedId(conversationId);
    const msgs = await loadConversationMessages(conversationId);
    setMessages(msgs);
    await markConversationRead(conversationId);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  // Poll the open thread + conversation list so replies appear without a manual refresh.
  useEffect(() => {
    if (!selectedId) return;
    const t = setInterval(async () => {
      const msgs = await loadConversationMessages(selectedId);
      setMessages(msgs);
      refreshConversations();
    }, 8000);
    return () => clearInterval(t);
  }, [selectedId, refreshConversations]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    try {
      await sendChatMessage(selectedId, text);
      setDraft("");
      setMessages(await loadConversationMessages(selectedId));
      refreshConversations();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleStartWith = async (recipient: ChatRecipient) => {
    setShowNew(false);
    try {
      const convId = await startConversation(recipient.id);
      const list = await refreshConversations();
      // Ensure the (possibly brand-new) conversation is present before selecting.
      if (!list.some((c) => c.id === convId)) {
        setConversations((prev) => [
          { id: convId, name: recipient.name, unreadCount: 0 },
          ...prev,
        ]);
      }
      await openConversation(convId);
    } catch (err) {
      console.error(err);
    }
  };

  const selected = conversations.find((c) => c.id === selectedId) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href={breadcrumbHref} className="hover:text-blue-600">
            {breadcrumbLabel}
          </Link>
          <span>/</span>
          <span className="text-gray-900">Messages</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💬 Messages</h1>
            <p className="text-sm text-gray-500 mt-1">
              Direct conversations — replies appear here automatically.
            </p>
          </div>
          <button
            onClick={() => setShowNew((v) => !v)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            ＋ New message
          </button>
        </div>
      </div>

      {showNew && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-700 mb-3">
            Start a conversation with a {recipientNoun}
          </div>
          {recipientsLoading ? (
            <div className="text-sm text-gray-500">Loading {recipientNoun}s…</div>
          ) : recipients.length === 0 ? (
            <div className="text-sm text-gray-500">
              No {recipientNoun}s available to message yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {recipients.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleStartWith(r)}
                  className="text-left p-3 border rounded-lg hover:border-blue-400 hover:bg-blue-50"
                >
                  <div className="font-medium text-gray-900 truncate">{r.name}</div>
                  {r.subtitle && (
                    <div className="text-xs text-gray-500 truncate">{r.subtitle}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation list */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-gray-500">No conversations yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Use “New message” to start one.
                  </p>
                </div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 ${
                      selectedId === c.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-gray-900 truncate">{c.name}</div>
                      <div className="text-xs text-gray-400 shrink-0">
                        {timeLabel(c.lastMessageTime)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="text-sm text-gray-500 truncate">
                        {c.lastMessage || "No messages yet"}
                      </div>
                      {!!c.unreadCount && c.unreadCount > 0 && (
                        <span className="shrink-0 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Thread */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-lg shadow flex flex-col h-[600px]">
              <div className="border-b p-4">
                <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.filter((m) => m.messageType !== "SYSTEM").length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400">
                    No messages yet — say hello 👋
                  </div>
                ) : (
                  messages
                    .filter((m) => m.messageType !== "SYSTEM")
                    .map((m) => {
                      const mine = m.senderId != null && m.senderId === me;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                              mine
                                ? "bg-blue-600 text-white rounded-br-sm"
                                : "bg-white border text-gray-800 rounded-bl-sm"
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words">{m.message}</div>
                            <div
                              className={`text-[10px] mt-1 ${
                                mine ? "text-blue-100" : "text-gray-400"
                              }`}
                            >
                              {timeLabel(m.sentAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
                <div ref={threadEndRef} />
              </div>
              <div className="border-t p-3 flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder="Type a message…  (Enter to send, Shift+Enter for newline)"
                  className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !draft.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center h-[600px] flex flex-col items-center justify-center">
              <div className="text-6xl mb-4">💌</div>
              <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
              <p className="text-gray-500">
                Choose a conversation on the left, or start a new one.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
