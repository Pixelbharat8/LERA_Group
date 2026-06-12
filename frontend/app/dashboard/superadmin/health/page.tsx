"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";

/**
 * Service Health page.
 *
 * Polls {@code GET /api/health} every 15 seconds and shows the status of every
 * upstream microservice as a coloured tile. Backed by the new
 * {@code HealthAggregatorController} in {@code identity_service}, which probes
 * each service's {@code /actuator/health} in parallel.
 */

type HealthResponse = {
  status: "UP" | "DEGRADED" | string;
  services: Record<string, "UP" | "DOWN" | "TIMEOUT" | string>;
  ts: number;
};

const SERVICE_LABELS: Record<string, { label: string; emoji: string }> = {
  identity:     { label: "Identity",          emoji: "🔐" },
  academy:      { label: "Academy",           emoji: "🎓" },
  payment:      { label: "Payment",           emoji: "💳" },
  payroll:      { label: "Payroll",           emoji: "💵" },
  attendance:   { label: "Attendance",        emoji: "📅" },
  connect:      { label: "Connect",           emoji: "💬" },
  ai_gateway:   { label: "AI Gateway",        emoji: "🤖" },
  rule_engine:  { label: "Rule Engine",       emoji: "⚙️" },
  social_media: { label: "Social Media",      emoji: "📣" },
};

function statusTone(status: string) {
  switch (status?.toUpperCase()) {
    case "UP":      return { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  pill: "bg-green-100" };
    case "DOWN":    return { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    pill: "bg-red-100" };
    case "TIMEOUT": return { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  pill: "bg-amber-100" };
    default:        return { bg: "bg-gray-50",   border: "border-gray-200",   text: "text-gray-700",   pill: "bg-gray-100" };
  }
}

export default function ServiceHealthPage() {
  const [data, setData] = React.useState<HealthResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastFetched, setLastFetched] = React.useState<Date | null>(null);

  const refresh = React.useCallback(async () => {
    setError(null);
    try {
      const res = await apiFetch("/api/health");
      setData(res);
      setLastFetched(new Date());
    } catch (e: any) {
      setError(e?.message || "Failed to load health");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  const services = data?.services || {};
  const overallTone = statusTone(data?.status || "UNKNOWN");

  const upCount = Object.values(services).filter((v) => v?.toUpperCase() === "UP").length;
  const total = Object.keys(services).length;

  return (
    <div className="p-6 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Service Health</h1>
          <p className="text-sm text-gray-500">
            Live status of every backend microservice. Polled every 15s from <code>/api/health</code>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastFetched && (
            <span className="text-xs text-gray-500">
              Updated {lastFetched.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={refresh}
            className="h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50"
          >
            Refresh now
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* Summary card */}
      <section className={`rounded-xl border ${overallTone.border} ${overallTone.bg} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Overall</p>
            <p className={`text-2xl font-semibold ${overallTone.text}`}>
              {loading ? "…" : (data?.status || "UNKNOWN")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-gray-500">Services up</p>
            <p className={`text-2xl font-semibold ${overallTone.text}`}>
              {loading ? "…" : `${upCount} / ${total}`}
            </p>
          </div>
        </div>
      </section>

      {/* Per-service tiles */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading && Object.keys(services).length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500">Probing services...</div>
        ) : (
          Object.entries(services).map(([name, status]) => {
            const meta = SERVICE_LABELS[name] || { label: name, emoji: "🔧" };
            const tone = statusTone(status);
            return (
              <div key={name} className={`rounded-lg border ${tone.border} ${tone.bg} p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.emoji}</span>
                    <p className="font-medium text-gray-900">{meta.label}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tone.pill} ${tone.text}`}>
                    {status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500 font-mono">{name}</p>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
