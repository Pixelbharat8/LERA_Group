/**
 * Parse LERA Connect incoming-call payloads from Capacitor / FCM / APNs shapes
 * and deep-link into {@code /dashboard/connect} when the user is not already there.
 */

export type ParsedIncomingCall = {
  callId: string;
  conversationId: string;
  callerId: string;
  callKindUpper: string;
};

export type ParsedCallEnded = {
  callId: string;
  conversationId?: string;
  reason?: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v != null && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function stringField(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  if (v == null) return undefined;
  const s = String(v).trim();
  return s || undefined;
}

function parseDataField(data: unknown): Record<string, unknown> | null {
  if (data == null) return null;
  if (typeof data === "string") {
    try {
      return asRecord(JSON.parse(data));
    } catch {
      return null;
    }
  }
  return asRecord(data);
}

function pickIncomingFields(obj: Record<string, unknown> | null): ParsedIncomingCall | null {
  if (!obj) return null;
  if (stringField(obj, "lera_type") !== "incoming_call") return null;
  const callId = stringField(obj, "lera_call_id");
  const conversationId = stringField(obj, "lera_conversation_id");
  const callerId = stringField(obj, "lera_caller_id");
  if (!callId || !conversationId || !callerId) return null;
  const kind = (stringField(obj, "lera_call_kind") || "VOICE").toUpperCase();
  return {
    callId,
    conversationId,
    callerId,
    callKindUpper: kind === "VIDEO" ? "VIDEO" : "VOICE",
  };
}

function pickCallEndedFields(obj: Record<string, unknown> | null): ParsedCallEnded | null {
  if (!obj) return null;
  if (stringField(obj, "lera_type") !== "call_ended") return null;
  const callId = stringField(obj, "lera_call_id");
  if (!callId) return null;
  return {
    callId,
    conversationId: stringField(obj, "lera_conversation_id"),
    reason: stringField(obj, "lera_reason"),
  };
}

export function parseCallEndedFromPush(raw: unknown): ParsedCallEnded | null {
  const root = asRecord(raw);
  if (!root) return null;

  let notification = root;
  if ("actionId" in root && root.notification != null) {
    const inner = asRecord(root.notification);
    if (inner) notification = inner;
  }

  const fromData = pickCallEndedFields(parseDataField(notification.data));
  if (fromData) return fromData;

  return pickCallEndedFields(notification);
}

export function openCallEndedFromNativePush(parsed: ParsedCallEnded): void {
  if (typeof window === "undefined") return;
  const qs = new URLSearchParams({
    callEnded: "1",
    callId: parsed.callId,
  });
  if (parsed.reason) qs.set("reason", parsed.reason);
  if (parsed.conversationId) qs.set("conversationId", parsed.conversationId);

  const onConnect = window.location.pathname.includes("/dashboard/connect");
  if (!onConnect) {
    window.location.assign(`/dashboard/connect?${qs.toString()}`);
    return;
  }

  window.dispatchEvent(new CustomEvent("lera:call-ended", { detail: parsed }));
}

/**
 * Accepts {@link PushNotificationSchema}, {@link ActionPerformed}, or a generic object
 * whose {@code data} (string or object) carries {@code lera_*} keys.
 */
export function parseIncomingCallFromPush(raw: unknown): ParsedIncomingCall | null {
  const root = asRecord(raw);
  if (!root) return null;

  let notification = root;
  if ("actionId" in root && root.notification != null) {
    const inner = asRecord(root.notification);
    if (inner) notification = inner;
  }

  const fromData = pickIncomingFields(parseDataField(notification.data));
  if (fromData) return fromData;

  return pickIncomingFields(notification);
}

/** Native / Web Push entry: incoming ring or remote hangup (decline / end). */
export function openIncomingCallFromNativePush(raw: unknown): void {
  if (typeof window === "undefined") return;
  const ended = parseCallEndedFromPush(raw);
  if (ended) {
    openCallEndedFromNativePush(ended);
    return;
  }
  const parsed = parseIncomingCallFromPush(raw);
  if (!parsed) return;

  const qs = new URLSearchParams({
    incomingCall: "1",
    callId: parsed.callId,
    conversationId: parsed.conversationId,
    callerId: parsed.callerId,
    callKind: parsed.callKindUpper,
  }).toString();

  const onConnect = window.location.pathname.includes("/dashboard/connect");
  if (!onConnect) {
    window.location.assign(`/dashboard/connect?${qs}`);
    return;
  }

  window.dispatchEvent(new CustomEvent("lera:incoming-call", { detail: parsed }));
}
