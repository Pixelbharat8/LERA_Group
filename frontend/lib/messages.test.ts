import { describe, it, expect } from "vitest";
import { mapInboxMessage } from "./messages";

describe("mapInboxMessage", () => {
  it("maps canonical notification fields", () => {
    const msg = mapInboxMessage({
      id: 42,
      title: "Welcome",
      content: "Hello there",
      senderName: "Admin",
      senderRole: "CHAIRMAN",
      createdAt: "2026-06-12T10:00:00",
      isRead: true,
      type: "MESSAGE",
    });
    expect(msg).toMatchObject({
      id: "42",
      subject: "Welcome",
      content: "Hello there",
      sender: "Admin",
      senderRole: "CHAIRMAN",
      timestamp: "2026-06-12T10:00:00",
      read: true,
      priority: "NORMAL",
    });
  });

  it("falls back through alternate field names and defaults", () => {
    const msg = mapInboxMessage({ id: 1, message: "body text" });
    expect(msg.subject).toBe("No Subject");
    expect(msg.content).toBe("body text");
    expect(msg.sender).toBe("MESSAGE"); // falls back to type
    expect(msg.read).toBe(false);
  });

  it("flags HIGH/URGENT types as HIGH priority", () => {
    expect(mapInboxMessage({ id: 1, type: "HIGH_ALERT" }).priority).toBe("HIGH");
    expect(mapInboxMessage({ id: 2, type: "URGENT_NOTICE" }).priority).toBe("HIGH");
    expect(mapInboxMessage({ id: 3, type: "MESSAGE" }).priority).toBe("NORMAL");
  });
});
