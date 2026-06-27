"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useLanguage } from "../../../context/LanguageContext";

interface Msg { role: "user" | "assistant"; content: string; live?: boolean; tokens?: number }

export default function ChairmanAiPage() {
  const { language } = useLanguage();
  const vi = language === "VI";
  const [health, setHealth] = useState<{ provider: string; model: string; configured: boolean } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch("/api/ai/health", {}, { silent: true }).then(setHealth).catch(() => setHealth(null));
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const suggestions = vi
    ? ["Tóm tắt sức khỏe kinh doanh tháng này", "Soạn email nhắc học phí quá hạn", "Ý tưởng tăng tỷ lệ chuyển đổi lead"]
    : ["Summarise this month's business health", "Draft an email to chase an overdue tuition payment", "Ideas to improve lead→paid conversion"];

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setBusy(true);
    try {
      const res = await apiFetch("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: q,
          subject: "business",
          systemPrompt:
            "You are the executive AI assistant for the owner/Chairman of LERA Academy, a premium English centre in Hải Phòng, Vietnam. " +
            "Be concise, practical and business-minded. Help with strategy, finance, marketing, operations, staff and parent communication. " +
            "When the user writes in Vietnamese, reply in Vietnamese.",
        }),
      });
      setMessages((m) => [...m, { role: "assistant", content: res?.message || "(no response)", live: !!res?.usingRealAI, tokens: res?.tokensUsed || 0 }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: (vi ? "Lỗi: " : "Error: ") + (e?.message || "request failed"), live: false }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🤖 {vi ? "Trợ lý AI (Claude)" : "AI Assistant (Claude)"}</h1>
          <p className="text-sm text-gray-500">{vi ? "Hỏi Claude về kinh doanh, tài chính, marketing, vận hành." : "Ask Claude about your business — strategy, finance, marketing, operations."}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${health?.configured ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
          {health?.configured ? `${health.provider} · ${health.model}` : (vi ? "Chưa cấu hình khoá API" : "No API key set")}
        </span>
      </div>

      {health && !health.configured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          {vi ? "Chưa có khoá API. Thêm khoá Claude tại " : "No API key yet. Add your Claude key in "}
          <Link href="/dashboard/superadmin/ai-gateway" className="font-semibold underline">AI Gateway</Link>
          {vi ? " để bật trả lời thật (hiện đang dùng câu trả lời mẫu)." : " to enable live answers (you'll get sample answers until then)."}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
              <div className="text-4xl mb-3">💬</div>
              <p className="mb-4">{vi ? "Bắt đầu bằng một câu hỏi" : "Start with a question"}</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                {m.role === "assistant" && (
                  <p className="text-[10px] mt-1 text-gray-400">{m.live ? `Claude · ${m.tokens} tokens` : (vi ? "Mẫu (chưa có khoá)" : "Sample (no key)")}</p>
                )}
              </div>
            </div>
          ))}
          {busy && <div className="flex justify-start"><div className="bg-gray-100 rounded-2xl px-4 py-2.5 text-gray-400 text-sm">{vi ? "Đang nghĩ…" : "Thinking…"}</div></div>}
          <div ref={endRef} />
        </div>
        <div className="border-t p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
            placeholder={vi ? "Nhập câu hỏi…" : "Type your question…"}
            className="flex-1 px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-200 outline-none"
          />
          <button onClick={() => send(input)} disabled={busy || !input.trim()} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
            {vi ? "Gửi" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
