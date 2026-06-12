"use client";

import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "@/lib/api";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isOnline: boolean;
  type: "direct" | "group";
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: { name: string; type: string; url: string }[];
}

export default function MessagesPage() {
  const [language, setLanguage] = useState("EN");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLang = Cookies.get("language");
    if (savedLang) setLanguage(savedLang);
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch("/api/messages/conversations");
      if (Array.isArray(data) && data.length > 0) {
        setConversations(data);
      } else {
        setConversations([]);
      }
    } catch {
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const data = await apiFetch(`/api/messages/conversations/${conversationId}/messages`);
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: "me",
      senderName: "Me",
      senderAvatar: "ME",
      content: newMessage,
      timestamp: new Date(),
      isRead: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    try {
      await apiFetch(`/api/messages/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: newMessage })
      });
    } catch {
      // Message already added to UI optimistically
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return language === "VI" ? "Vừa xong" : "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === "VI" ? "💬 Tin Nhắn" : "💬 Messages"}
          </h1>
          <p className="text-gray-600 mt-1">
            {language === "VI"
              ? `${totalUnread} tin nhắn chưa đọc`
              : `${totalUnread} unread message${totalUnread !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowNewChatModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {language === "VI" ? "Tin nhắn mới" : "New Message"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex h-[600px]">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === "VI" ? "Tìm cuộc trò chuyện..." : "Search conversations..."}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  {language === "VI" ? "Đang tải..." : "Loading..."}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {language === "VI" ? "Không có cuộc trò chuyện" : "No conversations found"}
                </div>
              ) : (
                filteredConversations.map(conversation => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full p-4 flex gap-3 hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                        conversation.type === "group" ? "bg-green-500" : "bg-blue-500"
                      }`}>
                        {conversation.avatar}
                      </div>
                      {conversation.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 truncate">{conversation.name}</span>
                        <span className="text-xs text-gray-500">{formatTime(conversation.timestamp)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                        {conversation.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      selectedConversation.type === "group" ? "bg-green-500" : "bg-blue-500"
                    }`}>
                      {selectedConversation.avatar}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedConversation.name}</h3>
                      <p className="text-xs text-gray-500">
                        {selectedConversation.isOnline
                          ? (language === "VI" ? "Đang hoạt động" : "Online")
                          : (language === "VI" ? "Ngoại tuyến" : "Offline")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                      📞
                    </button>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                      📹
                    </button>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                      ℹ️
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${message.senderId === "me" ? "flex-row-reverse" : ""}`}>
                        {message.senderId !== "me" && (
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                            {message.senderAvatar}
                          </div>
                        )}
                        <div>
                          <div className={`rounded-2xl px-4 py-2 ${
                            message.senderId === "me"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}>
                            <p>{message.content}</p>
                          </div>
                          <p className={`text-xs mt-1 ${
                            message.senderId === "me" ? "text-right" : ""
                          } text-gray-500`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {message.senderId === "me" && (
                              <span className="ml-1">{message.isRead ? "✓✓" : "✓"}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2 items-end">
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                      📎
                    </button>
                    <div className="flex-1">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={language === "VI" ? "Nhập tin nhắn..." : "Type a message..."}
                        rows={1}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                      😊
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {language === "VI" ? "Gửi" : "Send"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p>{language === "VI" ? "Chọn cuộc trò chuyện để bắt đầu" : "Select a conversation to start"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {language === "VI" ? "Tin nhắn mới" : "New Message"}
              </h2>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "VI" ? "Người nhận" : "To"}
                </label>
                <input
                  type="text"
                  placeholder={language === "VI" ? "Nhập tên hoặc email..." : "Enter name or email..."}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "VI" ? "Tin nhắn" : "Message"}
                </label>
                <textarea
                  rows={4}
                  placeholder={language === "VI" ? "Nhập tin nhắn..." : "Type your message..."}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {language === "VI" ? "Hủy" : "Cancel"}
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {language === "VI" ? "Gửi" : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
