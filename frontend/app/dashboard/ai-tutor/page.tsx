"use client";

import { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Subject {
  id: string;
  name: string;
  icon: string;
}

export default function AITutorPage() {
  const [language, setLanguage] = useState("EN");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLang = Cookies.get("language");
    if (savedLang) setLanguage(savedLang);
    
    // Add welcome message
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: language === "VI" 
        ? "Xin chào! Tôi là trợ lý học tập AI của bạn. Tôi có thể giúp bạn với các môn học, giải thích khái niệm, trả lời câu hỏi và cung cấp bài tập thực hành. Bạn muốn học gì hôm nay?"
        : "Hello! I'm your AI learning assistant. I can help you with subjects, explain concepts, answer questions, and provide practice exercises. What would you like to learn today?",
      timestamp: new Date()
    }]);
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const subjects: Subject[] = [
    { id: "math", name: language === "VI" ? "Toán học" : "Mathematics", icon: "📐" },
    { id: "physics", name: language === "VI" ? "Vật lý" : "Physics", icon: "⚛️" },
    { id: "chemistry", name: language === "VI" ? "Hóa học" : "Chemistry", icon: "🧪" },
    { id: "biology", name: language === "VI" ? "Sinh học" : "Biology", icon: "🧬" },
    { id: "english", name: language === "VI" ? "Tiếng Anh" : "English", icon: "📚" },
    { id: "history", name: language === "VI" ? "Lịch sử" : "History", icon: "📜" },
    { id: "geography", name: language === "VI" ? "Địa lý" : "Geography", icon: "🌍" },
    { id: "computer", name: language === "VI" ? "Tin học" : "Computer Science", icon: "💻" },
  ];

  const quickPrompts = [
    { text: language === "VI" ? "Giải thích khái niệm" : "Explain a concept", icon: "💡" },
    { text: language === "VI" ? "Giải bài tập" : "Solve a problem", icon: "✏️" },
    { text: language === "VI" ? "Tạo câu hỏi ôn tập" : "Create quiz questions", icon: "❓" },
    { text: language === "VI" ? "Tóm tắt bài học" : "Summarize a lesson", icon: "📝" },
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await apiFetch("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: input,
          subject: selectedSubject,
          language: language
        })
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data?.response || data?.message || (language === "VI"
          ? "Tôi hiểu câu hỏi của bạn. Để trả lời tốt hơn, bạn có thể cung cấp thêm chi tiết không?"
          : "I understand your question. Could you provide more details?"),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: language === "VI"
          ? "Xin lỗi, không thể kết nối đến AI. Vui lòng thử lại sau."
          : "Sorry, unable to connect to AI. Please try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt + ": ");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {language === "VI" ? "🤖 Trợ Lý Học Tập AI" : "🤖 AI Learning Tutor"}
        </h1>
        <p className="text-gray-600 mt-1">
          {language === "VI"
            ? "Học tập cá nhân hóa với trí tuệ nhân tạo"
            : "Personalized learning with artificial intelligence"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Subject Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">
              {language === "VI" ? "Chọn môn học" : "Select Subject"}
            </h2>
            <div className="space-y-2">
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject.id === selectedSubject ? null : subject.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedSubject === subject.id
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span>{subject.icon}</span>
                  <span>{subject.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">
              {language === "VI" ? "Gợi ý nhanh" : "Quick Prompts"}
            </h2>
            <div className="space-y-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(prompt.text)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  <span>{prompt.icon}</span>
                  <span>{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 {language === "VI" ? "Mẹo" : "Tips"}
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• {language === "VI" ? "Hỏi câu hỏi cụ thể" : "Ask specific questions"}</li>
              <li>• {language === "VI" ? "Chọn môn học để trả lời chính xác hơn" : "Select a subject for better answers"}</li>
              <li>• {language === "VI" ? "Yêu cầu ví dụ khi cần" : "Request examples when needed"}</li>
            </ul>
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
          {/* Selected Subject Badge */}
          {selectedSubject && (
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {subjects.find(s => s.id === selectedSubject)?.icon}
                {subjects.find(s => s.id === selectedSubject)?.name}
                <button 
                  onClick={() => setSelectedSubject(null)}
                  className="ml-1 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === "user" ? "text-blue-200" : "text-gray-500"
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={language === "VI" ? "Nhập câu hỏi của bạn..." : "Type your question..."}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {language === "VI" ? "Gửi" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-3xl mb-2">📚</div>
          <h3 className="font-semibold text-gray-900">
            {language === "VI" ? "Học tập thông minh" : "Smart Learning"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {language === "VI" 
              ? "AI phân tích và điều chỉnh nội dung phù hợp với trình độ của bạn"
              : "AI analyzes and adapts content to match your level"}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-3xl mb-2">⏰</div>
          <h3 className="font-semibold text-gray-900">
            {language === "VI" ? "Hỗ trợ 24/7" : "24/7 Support"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {language === "VI"
              ? "Luôn sẵn sàng trả lời câu hỏi của bạn bất cứ lúc nào"
              : "Always ready to answer your questions anytime"}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="font-semibold text-gray-900">
            {language === "VI" ? "Bài tập thực hành" : "Practice Exercises"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {language === "VI"
              ? "Tạo bài tập và câu hỏi ôn tập phù hợp với nhu cầu của bạn"
              : "Generate exercises and review questions tailored to your needs"}
          </p>
        </div>
      </div>
    </div>
  );
}
