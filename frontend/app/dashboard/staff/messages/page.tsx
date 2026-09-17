"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { loadMyMessages, markMessageRead } from "../../../../lib/messages";

interface Message {
  id: string;
  subject: string;
  content: string;
  senderName: string;
  senderEmail?: string;
  senderRole?: string;
  senderAvatar?: string;
  receiverId?: string;
  timestamp: string;
  isRead: boolean;
  isStarred?: boolean;
  category?: "inbox" | "sent" | "archive";
  attachments?: { name: string; url: string }[];
}

interface Conversation {
  id: string;
  participantName: string;
  participantRole?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

interface RecipientOption {
  id: string;
  fullname?: string;
  email?: string;
  roleName?: string;
}

export default function StaffMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [activeTab, setActiveTab] = useState<"inbox" | "sent" | "archive">("inbox");
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState({ to: "", subject: "", content: "" });
  // A message is addressed by user id. The "To" box asked for a name or an email and the code
  // posted whatever was typed as the userId, so the backend's UUID.fromString threw on every
  // send — and the failure was swallowed, so the modal just closed as though it had worked.
  // The recipient now has to be chosen from a real user.
  const [recipient, setRecipient] = useState<RecipientOption | null>(null);
  const [recipientResults, setRecipientResults] = useState<RecipientOption[]>([]);
  const [searchingRecipients, setSearchingRecipients] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, [activeTab]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      if (activeTab === "sent") {
        setMessages([]);
        return;
      }
      const inbox = await loadMyMessages();
      setMessages(
        inbox.map((m) => ({
          id: m.id,
          subject: m.subject,
          content: m.content,
          senderName: m.sender,
          senderRole: m.senderRole,
          timestamp: m.timestamp,
          isRead: m.read,
          isStarred: false,
          category: activeTab,
        }))
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await markMessageRead(messageId);
      setMessages(messages.map(m => m.id === messageId ? { ...m, isRead: true } : m));
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleToggleStar = async (messageId: string) => {
    try {
      // The star only moves if the server accepted it; it used to flip on screen regardless and
      // then quietly flip back on the next load.
      await apiFetch(`/api/messages/${messageId}/star`, { method: "PATCH" });
      setMessages(messages.map(m => m.id === messageId ? { ...m, isStarred: !m.isStarred } : m));
    } catch (error) {
      console.error("Error toggling star:", error);
    }
  };

  const searchRecipients = async (query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setRecipientResults([]);
      return;
    }
    setSearchingRecipients(true);
    try {
      const data = await apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      setRecipientResults(Array.isArray(data) ? data.slice(0, 8) : []);
    } catch (error) {
      console.error("Error searching recipients:", error);
      setRecipientResults([]);
    } finally {
      setSearchingRecipients(false);
    }
  };

  const handleSendMessage = async () => {
    setSendError(null);
    if (!recipient) {
      setSendError("Choose a recipient from the list before sending.");
      return;
    }
    if (!newMessage.content.trim()) {
      setSendError("Write a message before sending.");
      return;
    }

    setSending(true);
    try {
      // No .catch here on purpose: a send that fails must say so, not close the window.
      await apiFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          userId: recipient.id,
          title: newMessage.subject,
          message: newMessage.content,
        }),
      });

      setShowComposeModal(false);
      setNewMessage({ to: "", subject: "", content: "" });
      setRecipient(null);
      setRecipientResults([]);
      if (activeTab === "sent") fetchMessages();
    } catch (error: any) {
      console.error("Error sending message:", error);
      setSendError(error?.message || "The message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const filteredMessages = messages.filter(m => 
    (m.subject ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.senderName ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.content ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = messages.filter(m => !m.isRead).length;

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
          <p className="text-gray-600">Communicate with your team and management</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/staff" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            ← Back to Dashboard
          </Link>
          <button
            onClick={() => setShowComposeModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ✉️ Compose
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab("inbox")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                activeTab === "inbox" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <span>📥</span>
                <span>Inbox</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "sent" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
              }`}
            >
              <span>📤</span>
              <span>Sent</span>
            </button>
            <button
              onClick={() => setActiveTab("archive")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "archive" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
              }`}
            >
              <span>📁</span>
              <span>Archive</span>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Unread</span>
                <span className="font-medium">{unreadCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Starred</span>
                <span className="font-medium">{messages.filter(m => m.isStarred).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total</span>
                <span className="font-medium">{messages.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search */}
          <div className="bg-white rounded-xl shadow p-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Messages */}
          <div className="bg-white rounded-xl shadow">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-4">📭</p>
                <p>No messages found</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (!message.isRead) handleMarkAsRead(message.id);
                    }}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !message.isRead ? "bg-blue-50" : ""
                    } ${selectedMessage?.id === message.id ? "bg-blue-100" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-lg">
                        {message.senderName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${!message.isRead ? "text-gray-900" : "text-gray-700"}`}>
                              {message.senderName}
                            </span>
                            {message.senderRole && (
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{message.senderRole}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleStar(message.id); }}
                              className={`text-lg ${message.isStarred ? "text-yellow-500" : "text-gray-300 hover:text-yellow-500"}`}
                            >
                              ★
                            </button>
                          </div>
                        </div>
                        <h4 className={`text-sm truncate ${!message.isRead ? "font-semibold" : ""}`}>
                          {message.subject}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedMessage.subject}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    {selectedMessage.senderName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{selectedMessage.senderName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(selectedMessage.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setNewMessage({ to: selectedMessage.senderName, subject: `Re: ${selectedMessage.subject}`, content: "" });
                  setShowComposeModal(true);
                  setSelectedMessage(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Reply
              </button>
              <button
                onClick={() => handleToggleStar(selectedMessage.id)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {selectedMessage.isStarred ? "★ Unstar" : "☆ Star"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">New Message</h2>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                {recipient ? (
                  <div className="flex items-center justify-between px-3 py-2 border rounded-lg bg-blue-50">
                    <span className="text-sm">
                      <span className="font-medium">{recipient.fullname || recipient.email}</span>
                      {recipient.roleName && (
                        <span className="text-gray-500"> · {recipient.roleName}</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setRecipient(null); setNewMessage({ ...newMessage, to: "" }); }}
                      className="text-sm text-blue-700 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={newMessage.to}
                      onChange={(e) => {
                        setNewMessage({ ...newMessage, to: e.target.value });
                        searchRecipients(e.target.value);
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Search by name or email"
                    />
                    {newMessage.to.trim().length >= 2 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow max-h-56 overflow-y-auto">
                        {searchingRecipients ? (
                          <p className="px-3 py-2 text-sm text-gray-500">Searching…</p>
                        ) : recipientResults.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-gray-500">No matching people</p>
                        ) : (
                          recipientResults.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => {
                                setRecipient(r);
                                setRecipientResults([]);
                                setSendError(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              <span className="font-medium">{r.fullname || r.email}</span>
                              {r.email && r.fullname && (
                                <span className="text-gray-500"> · {r.email}</span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Message subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={8}
                  placeholder="Write your message..."
                />
              </div>
            </div>
            {sendError && (
              <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {sendError}
              </p>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowComposeModal(false); setSendError(null); }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!recipient || !newMessage.subject || !newMessage.content || sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
