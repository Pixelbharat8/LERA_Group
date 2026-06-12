import { describe, it, expect, vi, beforeEach } from "vitest";
import * as api from "./api";
import {
  loadConversations,
  sendChatMessage,
  startConversation,
  markConversationRead,
} from "./chat";

vi.mock("./api", () => ({ apiFetch: vi.fn() }));
vi.mock("./auth-context", () => ({ getAuthUserIdFromCookie: () => "me-1" }));

const apiFetch = vi.mocked(api.apiFetch);

describe("lib/chat", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loadConversations returns [] when the backend returns a non-array", async () => {
    apiFetch.mockResolvedValueOnce({ error: "boom" });
    expect(await loadConversations()).toEqual([]);
  });

  it("sendChatMessage posts the conversation, current user as sender, and message", async () => {
    apiFetch.mockResolvedValueOnce({});
    await sendChatMessage("conv-1", "hi there");
    expect(apiFetch).toHaveBeenCalledWith("/api/chat/messages", {
      method: "POST",
      body: JSON.stringify({
        conversationId: "conv-1",
        senderId: "me-1",
        message: "hi there",
        messageType: "TEXT",
      }),
    });
  });

  it("startConversation returns the conversation id from the response", async () => {
    apiFetch.mockResolvedValueOnce({ id: "conv-new", existing: false });
    expect(await startConversation("t-9")).toBe("conv-new");
    expect(apiFetch).toHaveBeenCalledWith("/api/chat/conversations", {
      method: "POST",
      body: JSON.stringify({ senderId: "me-1", recipientId: "t-9", participantIds: ["me-1", "t-9"] }),
    });
  });

  it("startConversation throws if the backend returns no id", async () => {
    apiFetch.mockResolvedValueOnce({});
    await expect(startConversation("t-9")).rejects.toThrow(/Could not start conversation/);
  });

  it("markConversationRead PUTs and swallows errors", async () => {
    apiFetch.mockRejectedValueOnce(new Error("offline"));
    await expect(markConversationRead("conv-1")).resolves.toBeUndefined();
    expect(apiFetch).toHaveBeenCalledWith("/api/chat/conversations/conv-1/read", { method: "PUT" });
  });
});
