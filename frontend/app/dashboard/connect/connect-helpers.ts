// Pure helpers for the LERA Connect chat page. Extracted from page.tsx (no component
// state, no hooks) so the page component is smaller and these are independently testable.
import Cookies from "js-cookie";
import type {
  Conversation,
  User,
  ResolvedConversationLabels,
  CurrentUserLike,
  Message,
  MediaPermissionKind,
  MediaPermissionIssue,
} from "./connect-types";

export const RTC_PEER_CFG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const SYNTHETIC_USER_NAME = /^User [a-f0-9-]{8,}$/i;

/** Quick-access emoji for the composer. */
export const commonEmojis = ["😀", "😂", "❤️", "👍", "🎉", "🔥", "👏", "😊", "🙏", "💪", "✨", "🤝"];

/** Reaction emoji (iMessage/WhatsApp style). */
export const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥"];

/** Message timestamp: time-of-day for today, else short month/day. */
export function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Call duration in mm:ss. */
export function formatCallDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function getMediaPermissionIssue(error: unknown): MediaPermissionIssue {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "denied";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "not_found";
    }
  }
  return "unknown";
}

export function mediaPermissionMessage(kind: MediaPermissionKind, issue: MediaPermissionIssue): string {
  const device = kind === "video" ? "camera and microphone" : "microphone";
  switch (issue) {
    case "unsupported":
      return `This browser does not support ${device} access. Try Chrome, Safari, or Edge on a current version.`;
    case "insecure":
      return `Voice and video calls require HTTPS (or localhost). Open LERA over a secure connection, then try again.`;
    case "denied":
      return `LERA Connect needs ${device} access for calls. Allow it in your browser site settings (lock icon in the address bar), then tap Try again.`;
    case "not_found":
      return kind === "video"
        ? "No camera or microphone was found. Connect a device and try again."
        : "No microphone was found. Connect a microphone and try again.";
    default:
      return `Could not access your ${device}. Check system permissions and try again.`;
  }
}

export function getCurrentUserId(): string {
  const userStr = Cookies.get("userData");
  if (!userStr) return "";
  try {
    return JSON.parse(userStr)?.id || "";
  } catch {
    return "";
  }
}

/** Resolve chat title from userMap when API returns "User e0000000" placeholders. */
export function resolveConversationDisplay(
  conv: Conversation,
  userMap: Map<string, User>,
  currentUserId: string
): ResolvedConversationLabels {
  const otherId =
    conv.otherParticipantId ||
    conv.participantIds?.find((id) => id && id !== currentUserId);

  const rawName = (conv.name || "Unknown").trim();
  const parenMatch = rawName.match(/^(.+?)\s*\((.+?)\)$/);

  if (parenMatch && !SYNTHETIC_USER_NAME.test(parenMatch[1].trim())) {
    return {
      displayName: parenMatch[1].trim(),
      roleLabel: parenMatch[2].trim(),
      otherParticipantId: otherId,
    };
  }

  if (otherId) {
    const u = userMap.get(otherId);
    if (u) {
      const displayName = (u.fullname || u.name || u.email?.split("@")[0] || rawName).trim();
      return {
        displayName,
        roleLabel: u.roleName?.trim() || null,
        otherParticipantId: otherId,
      };
    }
  }

  if (parenMatch) {
    return {
      displayName: parenMatch[1].trim(),
      roleLabel: parenMatch[2].trim(),
      otherParticipantId: otherId,
    };
  }

  return { displayName: rawName, roleLabel: null, otherParticipantId: otherId };
}

export function formatConversationName(displayName: string, roleLabel: string | null): string {
  return roleLabel ? `${displayName} (${roleLabel})` : displayName;
}

export function enhanceConversation(
  conv: Conversation,
  userMap: Map<string, User>,
  currentUserId: string
): Conversation {
  const { displayName, roleLabel, otherParticipantId } = resolveConversationDisplay(
    conv,
    userMap,
    currentUserId
  );
  return {
    ...conv,
    name: formatConversationName(displayName, roleLabel),
    otherParticipantId: otherParticipantId || conv.otherParticipantId,
  };
}

/** Resolve a user id to a display name (sender + receiver message rows). */
export function resolveUserDisplayName(
  userId: string | undefined,
  userMap: Map<string, User>,
  currentUserId: string,
  currentUser?: CurrentUserLike,
  activeConversation?: Conversation | null
): string {
  if (!userId) return "Unknown";
  if (userId === currentUserId) {
    return (
      currentUser?.fullname ||
      currentUser?.name ||
      currentUser?.email?.split("@")[0] ||
      "You"
    ).trim();
  }
  const u = userMap.get(userId);
  if (u) {
    const n = (u.fullname || u.name || u.email?.split("@")[0] || "").trim();
    if (n && !SYNTHETIC_USER_NAME.test(n)) return n;
  }
  if (activeConversation && activeConversation.type !== "GROUP") {
    const { displayName, otherParticipantId } = resolveConversationDisplay(
      activeConversation,
      userMap,
      currentUserId
    );
    if (otherParticipantId === userId && displayName && !SYNTHETIC_USER_NAME.test(displayName)) {
      return displayName;
    }
  }
  return "Unknown";
}

export function processChatMessage(
  raw: Record<string, unknown>,
  userMap: Map<string, User>,
  currentUserId: string,
  currentUser: CurrentUserLike,
  activeConversation: Conversation | null
): Message {
  const senderId = String(raw.senderId ?? "").trim();
  const isMine = senderId !== "" && currentUserId !== "" && senderId === currentUserId;
  const displayName = resolveUserDisplayName(
    senderId,
    userMap,
    currentUserId,
    currentUser,
    activeConversation
  );
  return {
    ...(raw as Message),
    isMine,
    senderName: isMine ? "You" : displayName,
  };
}

export function enhanceMessages(
  msgs: Message[],
  userMap: Map<string, User>,
  currentUserId: string,
  currentUser: CurrentUserLike,
  activeConversation: Conversation | null
): Message[] {
  return msgs.map((m) =>
    processChatMessage(
      { ...m, senderId: m.senderId } as Record<string, unknown>,
      userMap,
      currentUserId,
      currentUser,
      activeConversation
    )
  );
}

/** Normalize ChatMessage JSON from Spring (UUIDs may arrive as strings). */
export function normalizeSavedChatMessage(saved: unknown): Record<string, unknown> {
  const s = saved as Record<string, unknown>;
  const out: Record<string, unknown> = { ...s };
  for (const key of ["id", "senderId", "leadId", "replyToId", "forwardedFromId"] as const) {
    const v = out[key];
    if (v != null && typeof v !== "string") out[key] = String(v);
  }
  return out;
}
