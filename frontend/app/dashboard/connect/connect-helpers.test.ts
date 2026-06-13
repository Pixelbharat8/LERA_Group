import { describe, it, expect } from "vitest";
import {
  resolveConversationDisplay,
  formatConversationName,
  enhanceConversation,
  resolveUserDisplayName,
  getMediaPermissionIssue,
  mediaPermissionMessage,
  normalizeSavedChatMessage,
  formatTime,
  formatCallDuration,
} from "./connect-helpers";
import type { Conversation, User } from "./connect-types";

const ME = "me-1";
const user = (over: Partial<User> & { id: string }): User => ({ email: "", ...over });
const conv = (over: Partial<Conversation> & { id: string; name: string }): Conversation => over;

describe("resolveConversationDisplay", () => {
  it("uses a non-synthetic 'Name (Role)' title directly", () => {
    const r = resolveConversationDisplay(conv({ id: "c", name: "Anna (Teacher)" }), new Map(), ME);
    expect(r).toMatchObject({ displayName: "Anna", roleLabel: "Teacher" });
  });

  it("falls back to the directory when the title is a synthetic 'User <uuid>' placeholder", () => {
    const map = new Map<string, User>([["u2", user({ id: "u2", fullname: "Real Name", roleName: "PARENT" })]]);
    const r = resolveConversationDisplay(
      conv({ id: "c", name: "User abc12345 (PARENT)", participantIds: [ME, "u2"] }),
      map,
      ME
    );
    expect(r).toMatchObject({ displayName: "Real Name", roleLabel: "PARENT", otherParticipantId: "u2" });
  });

  it("resolves the other participant via the directory when there is no paren title", () => {
    const map = new Map<string, User>([["u2", user({ id: "u2", email: "jo@x.com" })]]);
    const r = resolveConversationDisplay(conv({ id: "c", name: "Unknown", otherParticipantId: "u2" }), map, ME);
    expect(r.displayName).toBe("jo"); // email local-part fallback
  });

  it("returns the raw name with no role when nothing else resolves", () => {
    const r = resolveConversationDisplay(conv({ id: "c", name: "Team Chat" }), new Map(), ME);
    expect(r).toMatchObject({ displayName: "Team Chat", roleLabel: null });
  });
});

describe("formatConversationName / enhanceConversation", () => {
  it("appends the role in parentheses, or omits it when null", () => {
    expect(formatConversationName("Anna", "Teacher")).toBe("Anna (Teacher)");
    expect(formatConversationName("Anna", null)).toBe("Anna");
  });

  it("enhanceConversation rewrites the name from the directory", () => {
    const map = new Map<string, User>([["u2", user({ id: "u2", fullname: "Resolved", roleName: "CEO" })]]);
    const out = enhanceConversation(conv({ id: "c", name: "User zzzzzzzz", participantIds: [ME, "u2"] }), map, ME);
    expect(out.name).toBe("Resolved (CEO)");
    expect(out.otherParticipantId).toBe("u2");
  });
});

describe("resolveUserDisplayName", () => {
  it("returns Unknown for a missing id", () => {
    expect(resolveUserDisplayName(undefined, new Map(), ME)).toBe("Unknown");
  });

  it("returns the current user's own name for self", () => {
    expect(resolveUserDisplayName(ME, new Map(), ME, { id: ME, fullname: "Me", name: "", email: "" })).toBe("Me");
  });

  it("returns a directory name but ignores synthetic placeholders", () => {
    const map = new Map<string, User>([
      ["u2", user({ id: "u2", fullname: "Bob" })],
      ["u3", user({ id: "u3", fullname: "User deadbeef" })],
    ]);
    expect(resolveUserDisplayName("u2", map, ME)).toBe("Bob");
    expect(resolveUserDisplayName("u3", map, ME)).toBe("Unknown");
  });
});

describe("getMediaPermissionIssue", () => {
  it("maps DOMException names to issues", () => {
    expect(getMediaPermissionIssue(new DOMException("x", "NotAllowedError"))).toBe("denied");
    expect(getMediaPermissionIssue(new DOMException("x", "NotFoundError"))).toBe("not_found");
    expect(getMediaPermissionIssue(new Error("other"))).toBe("unknown");
  });

  it("produces distinct, non-empty user messages per issue", () => {
    for (const issue of ["unsupported", "insecure", "denied", "not_found", "unknown"] as const) {
      expect(mediaPermissionMessage("voice", issue).length).toBeGreaterThan(0);
    }
  });
});

describe("formatTime / formatCallDuration", () => {
  it("returns empty string for a missing timestamp", () => {
    expect(formatTime(undefined)).toBe("");
    expect(formatTime("")).toBe("");
  });

  it("shows month/day for a non-today date", () => {
    expect(formatTime("2020-01-15T09:00:00")).toMatch(/Jan 15/);
  });

  it("formats call duration as zero-padded mm:ss", () => {
    expect(formatCallDuration(0)).toBe("00:00");
    expect(formatCallDuration(65)).toBe("01:05");
    expect(formatCallDuration(3661)).toBe("61:01");
  });
});

describe("normalizeSavedChatMessage", () => {
  it("coerces non-string id fields to strings", () => {
    const out = normalizeSavedChatMessage({ id: 5, senderId: 9, message: "hi", reactions: [] });
    expect(out.id).toBe("5");
    expect(out.senderId).toBe("9");
    expect(out.message).toBe("hi");
  });
});
