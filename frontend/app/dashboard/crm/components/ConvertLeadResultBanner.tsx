"use client";

import type { PlacementSyncPayload } from "../placementSyncAlert";

export function convertFeedbackTone(sync?: PlacementSyncPayload): "success" | "warning" | "neutral" {
  if (!sync?.attempted) return "neutral";
  if (sync.success) return "success";
  return "warning";
}

export function ConvertLeadResultBanner({
  message,
  sync,
  onDismiss,
}: {
  message: string;
  sync?: PlacementSyncPayload;
  onDismiss: () => void;
}) {
  const tone = convertFeedbackTone(sync);
  const bar =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-slate-200 bg-slate-50 text-slate-800";

  return (
    <div className={`rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 ${bar}`}>
      <div className="flex-1 space-y-2 min-w-0">
        <p className="text-sm whitespace-pre-wrap">{message}</p>
        {sync && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md border border-black/10 bg-white/60 px-2 py-0.5 font-medium">
              Placement sync: {sync.attempted ? "attempted" : "skipped"}
            </span>
            {sync.attempted && (
              <span
                className={`rounded-md px-2 py-0.5 font-medium ${
                  sync.success ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"
                }`}
              >
                {sync.success
                  ? sync.updatedExisting
                    ? "Academy OK (updated existing)"
                    : "Academy OK"
                  : "Needs attention"}
              </span>
            )}
            {sync.reason && (
              <span className="font-mono text-[11px] text-slate-600 truncate max-w-full" title={sync.reason}>
                {sync.reason}
              </span>
            )}
            {(sync.leadId || sync.studentId) && (
              <span className="text-[11px] text-slate-500 truncate max-w-full" title="Correlation ids for support">
                {sync.leadId && <>Lead {sync.leadId}</>}
                {sync.leadId && sync.studentId && " · "}
                {sync.studentId && <>Student {sync.studentId}</>}
              </span>
            )}
            {sync.attempted && !sync.success && sync.detail && (
              <details className="mt-1 rounded-md border border-amber-200/80 bg-white/70 px-2 py-1.5 text-[11px] text-slate-700">
                <summary className="cursor-pointer select-none font-medium text-amber-950">
                  Technical detail
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-[10px] text-slate-600 max-h-40 overflow-y-auto">
                  {sync.detail}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        className="shrink-0 text-sm underline-offset-2 hover:underline self-start"
        onClick={onDismiss}
      >
        Dismiss
      </button>
    </div>
  );
}
