"use client";

import * as React from "react";

/**
 * Lightweight toast system without bringing in another dependency.
 *
 * Anywhere in the app:
 *   import { toast } from "@/components/Toast";
 *   toast("Saved!");
 *   toast("Failed to save", "error");
 *
 * The {@link ToastContainer} below renders queued toasts. It also listens
 * for {@code lera:error} window events emitted by the {@link ErrorBoundary}
 * and {@code apiFetch}, so unexpected failures show as toasts automatically.
 */

export type ToastTone = "info" | "success" | "warn" | "error";

type ToastEvent = { id: number; message: string; tone: ToastTone };

const EVENT = "lera:toast";

export function toast(message: string, tone: ToastTone = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastEvent>(EVENT, {
      detail: { id: Date.now() + Math.random(), message, tone },
    })
  );
}

const TONE_CLASS: Record<ToastTone, string> = {
  info:    "bg-blue-600 text-white",
  success: "bg-green-600 text-white",
  warn:    "bg-amber-500 text-white",
  error:   "bg-red-600 text-white",
};

export function ToastContainer() {
  const [toasts, setToasts] = React.useState<ToastEvent[]>([]);

  React.useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<ToastEvent>).detail;
      if (!detail) return;
      setToasts((prev) => [...prev, detail]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, 4000);
    }

    function onError(e: Event) {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      const msg = detail?.message || "Unexpected error";
      setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message: msg, tone: "error" }]);
      setTimeout(() => {
        setToasts((prev) => (prev.length ? prev.slice(1) : prev));
      }, 5000);
    }

    window.addEventListener(EVENT, onToast as EventListener);
    window.addEventListener("lera:error", onError as EventListener);
    return () => {
      window.removeEventListener(EVENT, onToast as EventListener);
      window.removeEventListener("lera:error", onError as EventListener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[1000] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`rounded-lg shadow-lg px-4 py-3 text-sm leading-snug ${TONE_CLASS[t.tone]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
