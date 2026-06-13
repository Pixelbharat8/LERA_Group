/** Shape returned by PUT /api/leads/:id/convert */
export interface PlacementSyncPayload {
  attempted?: boolean;
  success?: boolean;
  reason?: string;
  detail?: string;
  /** UUID strings for support / log correlation */
  leadId?: string;
  studentId?: string | null;
  /** True when Academy updated an existing placement row for this lead (dedupe by source_lead_id). */
  updatedExisting?: boolean | null;
}

export interface ConvertLeadApiResponse {
  lead?: unknown;
  placementSync?: PlacementSyncPayload;
}

export function formatConvertLeadMessage(data: ConvertLeadApiResponse | Record<string, unknown>): string {
  const ps = (data as ConvertLeadApiResponse).placementSync;
  if (!ps) {
    return "Lead converted successfully!";
  }
  if (!ps.attempted) {
    return `Lead converted.\n${ps.detail || ""}`;
  }
  if (ps.success) {
    if (ps.reason === "SYNC_UPDATED" || ps.updatedExisting === true) {
      return `Lead converted.\nPlacement sync: updated existing record — ${ps.detail || ""}`;
    }
    return `Lead converted.\nPlacement sync: OK — ${ps.detail || "saved to Academy."}`;
  }
  return `Lead converted.\nPlacement sync: ${ps.reason || "failed"}\n${ps.detail || ""}`;
}

/**
 * Friendly text for {@code POST /api/leads/{id}/placement-sync}, which returns a bare
 * PlacementSyncResult (no wrapping {@code lead}). Use together with the same banner UI.
 */
/** True when notes likely match what Connect parses from lead notes (informal placement block). */
export function leadNotesSuggestPlacementImport(combinedNotes: string | undefined): boolean {
  if (!combinedNotes || !combinedNotes.trim()) return false;
  const t = combinedNotes.toLowerCase();
  return (
    /\[placement\]/.test(t) ||
    /scoreoutof16\s*=/.test(t) ||
    /tracken\s*=/.test(t)
  );
}

export function formatPlacementResyncMessage(sync: PlacementSyncPayload | undefined): string {
  if (!sync) {
    return "Placement re-import attempted.";
  }
  if (!sync.attempted) {
    return `Placement re-import skipped.\n${sync.detail || ""}`;
  }
  if (sync.success) {
    if (sync.reason === "SYNC_UPDATED" || sync.updatedExisting === true) {
      return `Placement re-imported: updated existing record — ${sync.detail || ""}`;
    }
    return `Placement re-imported: OK — ${sync.detail || "saved to Academy."}`;
  }
  return `Placement re-import failed: ${sync.reason || "unknown"}\n${sync.detail || ""}`;
}
