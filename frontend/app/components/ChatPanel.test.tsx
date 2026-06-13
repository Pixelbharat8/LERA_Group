import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPanel from "./ChatPanel";
import * as chat from "../../lib/chat";

// Mock the chat API layer so the component is tested in isolation (no network).
vi.mock("../../lib/chat", () => ({
  loadConversations: vi.fn(),
  loadConversationMessages: vi.fn(),
  sendChatMessage: vi.fn(),
  startConversation: vi.fn(),
  markConversationRead: vi.fn(),
}));
vi.mock("../../lib/auth-context", () => ({
  getAuthUserIdFromCookie: () => "me-123",
}));

const m = vi.mocked;

const baseProps = {
  recipients: [{ id: "t1", name: "Ms. Lan", subtitle: "Alice · A1" }],
  recipientNoun: "teacher",
  breadcrumbHref: "/dashboard/parent",
  breadcrumbLabel: "Dashboard",
};

describe("ChatPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m(chat.loadConversations).mockResolvedValue([]);
    m(chat.loadConversationMessages).mockResolvedValue([]);
    m(chat.markConversationRead).mockResolvedValue(undefined);
    m(chat.sendChatMessage).mockResolvedValue(undefined);
    m(chat.startConversation).mockResolvedValue("new-conv");
  });

  it("renders existing conversations returned by the backend", async () => {
    m(chat.loadConversations).mockResolvedValue([
      { id: "c1", name: "Ms. Lan", lastMessage: "You: hi", unreadCount: 2 },
    ]);
    render(<ChatPanel {...baseProps} />);
    expect(await screen.findByText("Ms. Lan")).toBeInTheDocument();
    expect(screen.getByText("You: hi")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // unread badge
  });

  it("lists recipients in the New message picker", async () => {
    render(<ChatPanel {...baseProps} />);
    await screen.findByText(/No conversations yet/i); // initial load settled
    await userEvent.click(screen.getByRole("button", { name: /New message/i }));
    expect(screen.getByText("Ms. Lan")).toBeInTheDocument();
    expect(screen.getByText("Alice · A1")).toBeInTheDocument();
  });

  it("opens a conversation, marks it read, and sends a message", async () => {
    m(chat.loadConversations).mockResolvedValue([{ id: "c1", name: "Ms. Lan", lastMessage: "" }]);
    m(chat.loadConversationMessages).mockResolvedValue([
      { id: "m1", senderId: "t1", message: "Hello parent", sentAt: "2026-06-12T10:00:00" },
    ]);
    render(<ChatPanel {...baseProps} />);

    await userEvent.click(await screen.findByText("Ms. Lan"));
    expect(await screen.findByText("Hello parent")).toBeInTheDocument();
    expect(chat.markConversationRead).toHaveBeenCalledWith("c1");

    await userEvent.type(screen.getByPlaceholderText(/Type a message/i), "Hi teacher");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(chat.sendChatMessage).toHaveBeenCalledWith("c1", "Hi teacher");
  });

  it("starts a new conversation when a recipient is picked", async () => {
    render(<ChatPanel {...baseProps} />);
    await screen.findByText(/No conversations yet/i);
    await userEvent.click(screen.getByRole("button", { name: /New message/i }));
    await userEvent.click(screen.getByText("Ms. Lan"));
    expect(chat.startConversation).toHaveBeenCalledWith("t1");
  });
});
