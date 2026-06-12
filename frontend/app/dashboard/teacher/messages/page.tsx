"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadMyMessages, markMessageRead, type InboxMessage } from "../../../../lib/messages";

export default function TeacherMessagesPage() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setMessages(await loadMyMessages());
    } catch (err) {
      console.error(err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await markMessageRead(messageId);
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMessageClick = (message: InboxMessage) => {
    setSelectedMessage(message);
    if (!message.read) markAsRead(message.id);
  };

  const filteredMessages = filter === "ALL" ? messages : messages.filter((m) => !m.read);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/teacher" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">Messages</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">💬 Messages</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Total Messages</div>
          <div className="text-2xl font-bold text-gray-900">{messages.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Unread</div>
          <div className="text-2xl font-bold text-blue-600">{messages.filter((m) => !m.read).length}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-2">
        <div className="flex gap-2">
          <button onClick={() => setFilter("ALL")} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === "ALL" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}>All Messages</button>
          <button onClick={() => setFilter("UNREAD")} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === "UNREAD" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}>Unread ({messages.filter((m) => !m.read).length})</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filteredMessages.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-gray-500">{filter === "ALL" ? "No messages yet" : "No unread messages"}</p>
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <div key={message.id} onClick={() => handleMessageClick(message)} className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedMessage?.id === message.id ? "bg-blue-50" : ""} ${!message.read ? "border-l-4 border-blue-600" : ""}`}>
                    <div className="font-medium truncate">{message.sender}</div>
                    <div className="text-sm font-medium text-gray-700 truncate">{message.subject}</div>
                    <div className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="border-b pb-4 mb-4">
                <h2 className="text-xl font-bold mb-3">{selectedMessage.subject}</h2>
                <div className="flex gap-4 text-sm text-gray-600">
                  <div><span className="font-medium">From:</span> {selectedMessage.sender}</div>
                  <div><span className="font-medium">Date:</span> {new Date(selectedMessage.timestamp).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">💌</div>
              <h3 className="text-xl font-semibold mb-2">Select a Message</h3>
              <p className="text-gray-500">Choose a message from the list to view its content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
