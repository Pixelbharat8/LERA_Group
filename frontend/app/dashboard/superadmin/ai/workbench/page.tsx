"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/Toast";

/**
 * AI Workbench — a single-page wizard that exposes the stateless action
 * endpoints from `ai_gateway` (`POST /api/ai/{tutor, chat, assess, learning-path,
 * generate-questions}`).
 *
 * Each tab has its own input form on the left and a JSON-pretty / formatted
 * result card on the right. Useful for content authors and academic teams
 * who want to try prompts before wiring them into a class.
 */

type TabId = "tutor" | "chat" | "assess" | "learning-path" | "generate-questions";

const TABS: Array<{ id: TabId; label: string; emoji: string; blurb: string }> = [
  { id: "tutor", emoji: "🧑‍🏫", label: "AI Tutor", blurb: "Ask the tutor a question and get hints + next-steps." },
  { id: "chat", emoji: "💬", label: "AI Chat", blurb: "Full chat completion — uses OpenAI when configured, otherwise fallback." },
  { id: "assess", emoji: "✅", label: "Assess Answer", blurb: "Score a student answer against the expected one." },
  { id: "learning-path", emoji: "🧭", label: "Learning Path", blurb: "Generate a 12-week path from current to target level." },
  { id: "generate-questions", emoji: "❓", label: "Generate Questions", blurb: "Produce N practice questions for a topic + level." },
];

export default function AiWorkbenchPage() {
  const [tab, setTab] = React.useState<TabId>("tutor");

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🛠️ AI Workbench</h1>
        <p className="text-gray-600 mt-1">
          Try the AI gateway action endpoints directly — useful for content
          authoring, prompt testing and demoing the platform.
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors " +
                (tab === t.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300")
              }
            >
              <span className="mr-1">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <p className="text-sm text-gray-500">
        {TABS.find((t) => t.id === tab)?.blurb}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tab === "tutor" && <TutorPanel />}
        {tab === "chat" && <ChatPanel />}
        {tab === "assess" && <AssessPanel />}
        {tab === "learning-path" && <LearningPathPanel />}
        {tab === "generate-questions" && <GenerateQuestionsPanel />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shared building blocks
// ─────────────────────────────────────────────────────────────────────────

function ResultCard({ data, loading }: { data: any; loading: boolean }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[200px]">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Result</div>
      {loading ? (
        <div className="text-gray-400 text-sm">Calling AI gateway…</div>
      ) : data == null ? (
        <div className="text-gray-400 text-sm">Submit the form to see the response here.</div>
      ) : (
        <pre className="text-xs whitespace-pre-wrap break-words text-gray-800">
          {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

async function postAi(path: string, body: Record<string, any>) {
  return apiFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Tutor
// ─────────────────────────────────────────────────────────────────────────

function TutorPanel() {
  const [question, setQuestion] = React.useState("Explain the present perfect tense in simple terms.");
  const [subject, setSubject] = React.useState("English");
  const [level, setLevel] = React.useState("intermediate");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await postAi("/api/ai/tutor", { question, subject, level });
      setResult(data);
    } catch (err: any) {
      toast(err?.message || "Tutor request failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Question" required>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Subject"><Input value={subject} onChange={setSubject} /></Field>
          <Field label="Level">
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={selectCls}>
              <option value="beginner">beginner</option>
              <option value="intermediate">intermediate</option>
              <option value="advanced">advanced</option>
            </select>
          </Field>
        </div>
        <SubmitButton busy={busy} label="Ask AI Tutor" />
      </form>
      <ResultCard data={result} loading={busy} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Chat (single-turn JSON — not SSE streaming)
// ─────────────────────────────────────────────────────────────────────────

function ChatPanel() {
  const [message, setMessage] = React.useState("Give me three tips for learning vocabulary.");
  const [subject, setSubject] = React.useState("English");
  const [model, setModel] = React.useState("gpt-4o-mini");
  const [systemPrompt, setSystemPrompt] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body: Record<string, string> = { message, subject, model };
      if (systemPrompt.trim()) body.systemPrompt = systemPrompt.trim();
      const data = await postAi("/api/ai/chat", body);
      setResult(data);
    } catch (err: any) {
      toast(err?.message || "Chat request failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Message" required>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Subject"><Input value={subject} onChange={setSubject} /></Field>
          <Field label="Model"><Input value={model} onChange={setModel} /></Field>
        </div>
        <Field label="System prompt (optional)">
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={2}
            placeholder="Leave blank for default tutor persona"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </Field>
        <SubmitButton busy={busy} label="Send Chat" />
      </form>
      <ResultCard data={result} loading={busy} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Assess
// ─────────────────────────────────────────────────────────────────────────

function AssessPanel() {
  const [answer, setAnswer] = React.useState("");
  const [correctAnswer, setCorrectAnswer] = React.useState("");
  const [subject, setSubject] = React.useState("English");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await postAi("/api/ai/assess", { answer, correctAnswer, subject });
      setResult(data);
    } catch (err: any) {
      toast(err?.message || "Assessment failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Student answer" required>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
          />
        </Field>
        <Field label="Expected answer" required>
          <textarea
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
          />
        </Field>
        <Field label="Subject"><Input value={subject} onChange={setSubject} /></Field>
        <SubmitButton busy={busy} label="Score Answer" />
      </form>
      <ResultCard data={result} loading={busy} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Learning Path
// ─────────────────────────────────────────────────────────────────────────

function LearningPathPanel() {
  const [subject, setSubject] = React.useState("English");
  const [currentLevel, setCurrentLevel] = React.useState("beginner");
  const [targetLevel, setTargetLevel] = React.useState("advanced");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await postAi("/api/ai/learning-path", { subject, currentLevel, targetLevel });
      setResult(data);
    } catch (err: any) {
      toast(err?.message || "Path generation failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Subject"><Input value={subject} onChange={setSubject} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Current level">
            <select value={currentLevel} onChange={(e) => setCurrentLevel(e.target.value)} className={selectCls}>
              <option value="beginner">beginner</option>
              <option value="intermediate">intermediate</option>
              <option value="advanced">advanced</option>
            </select>
          </Field>
          <Field label="Target level">
            <select value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)} className={selectCls}>
              <option value="beginner">beginner</option>
              <option value="intermediate">intermediate</option>
              <option value="advanced">advanced</option>
            </select>
          </Field>
        </div>
        <SubmitButton busy={busy} label="Generate Path" />
      </form>
      <ResultCard data={result} loading={busy} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Generate Questions
// ─────────────────────────────────────────────────────────────────────────

function GenerateQuestionsPanel() {
  const [topic, setTopic] = React.useState("Past tense verbs");
  const [level, setLevel] = React.useState("intermediate");
  const [count, setCount] = React.useState(5);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await postAi("/api/ai/generate-questions", { topic, level, count });
      setResult(data);
    } catch (err: any) {
      toast(err?.message || "Question generation failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Topic"><Input value={topic} onChange={setTopic} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Level">
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={selectCls}>
              <option value="beginner">beginner</option>
              <option value="intermediate">intermediate</option>
              <option value="advanced">advanced</option>
            </select>
          </Field>
          <Field label="Count">
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </Field>
        </div>
        <SubmitButton busy={busy} label="Generate Questions" />
      </form>
      <ResultCard data={result} loading={busy} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// tiny shared form helpers
// ─────────────────────────────────────────────────────────────────────────

const selectCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
    />
  );
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
    >
      {busy ? "Calling AI gateway…" : label}
    </button>
  );
}
