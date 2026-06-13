import { describe, it, expect } from "vitest";
import { parseIncomingCallFromPush, parseCallEndedFromPush } from "./incoming-call-push";

describe("parseIncomingCallFromPush", () => {
  const validFlat = {
    lera_type: "incoming_call",
    lera_call_id: "call-1",
    lera_conversation_id: "conv-1",
    lera_caller_id: "user-9",
    lera_call_kind: "video",
  };

  it("returns null for non-object input", () => {
    expect(parseIncomingCallFromPush(null)).toBeNull();
    expect(parseIncomingCallFromPush("x")).toBeNull();
    expect(parseIncomingCallFromPush([1, 2])).toBeNull();
  });

  it("parses lera_* fields from a flat object and upper-cases the kind", () => {
    expect(parseIncomingCallFromPush(validFlat)).toEqual({
      callId: "call-1",
      conversationId: "conv-1",
      callerId: "user-9",
      callKindUpper: "VIDEO",
    });
  });

  it("defaults an unknown/absent call kind to VOICE", () => {
    expect(parseIncomingCallFromPush({ ...validFlat, lera_call_kind: undefined })?.callKindUpper).toBe("VOICE");
    expect(parseIncomingCallFromPush({ ...validFlat, lera_call_kind: "weird" })?.callKindUpper).toBe("VOICE");
  });

  it("returns null when a required field is missing", () => {
    expect(parseIncomingCallFromPush({ ...validFlat, lera_call_id: "" })).toBeNull();
    expect(parseIncomingCallFromPush({ ...validFlat, lera_caller_id: undefined })).toBeNull();
  });

  it("reads lera_* from a JSON-string data field (FCM data shape)", () => {
    const push = { data: JSON.stringify(validFlat) };
    expect(parseIncomingCallFromPush(push)?.callId).toBe("call-1");
  });

  it("reads from an ActionPerformed wrapper (root.actionId + notification.data)", () => {
    const push = { actionId: "tap", notification: { data: validFlat } };
    expect(parseIncomingCallFromPush(push)?.conversationId).toBe("conv-1");
  });

  it("returns null when the type is not incoming_call", () => {
    expect(parseIncomingCallFromPush({ ...validFlat, lera_type: "call_ended" })).toBeNull();
  });
});

describe("parseCallEndedFromPush", () => {
  it("parses a call_ended payload with optional fields", () => {
    expect(
      parseCallEndedFromPush({
        lera_type: "call_ended",
        lera_call_id: "call-2",
        lera_reason: "declined",
      })
    ).toEqual({ callId: "call-2", conversationId: undefined, reason: "declined" });
  });

  it("returns null without a call id or wrong type", () => {
    expect(parseCallEndedFromPush({ lera_type: "call_ended" })).toBeNull();
    expect(parseCallEndedFromPush({ lera_type: "incoming_call", lera_call_id: "c" })).toBeNull();
  });
});
