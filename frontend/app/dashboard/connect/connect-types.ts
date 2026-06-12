// Shared types for the LERA Connect chat page. Extracted from page.tsx to shrink the
// 3.6k-line component; pure type declarations, no runtime code.

export interface UserStory {
  userId: string;
  userName?: string;
  userAvatar?: string;
  stories: any[];
  storyCount: number;
  hasUnviewed: boolean;
}

export type Message = {
  id: string;
  leadId?: string;
  senderId?: string;
  message: string;
  messageType?: string;
  attachmentUrl?: string;
  isRead?: boolean;
  readAt?: string;
  deliveredAt?: string;
  sentAt?: string;
  editedAt?: string;
  senderName?: string;
  isMine?: boolean;
  /** True until POST /api/chat/messages confirms and STOMP/server id is applied */
  pending?: boolean;
  reactions?: { emoji: string; count: number; userIds: string[] }[];
  // Reply feature
  replyToId?: string;
  replyPreview?: string;
  // Forward feature
  forwardedFromId?: string;
  // Audio/Voice message
  audioDurationSeconds?: number;
  audioWaveform?: string;
};

export type Conversation = {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
  type?: string;
  memberCount?: number;
  description?: string;
  // New preference features
  isArchived?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
  pinOrder?: number;
  // Participant tracking for notifications
  participantIds?: string[];
  otherParticipantId?: string;
};

export type User = {
  id: string;
  fullname?: string;
  name?: string;
  email: string;
  avatarUrl?: string;
  roleName?: string;
};

export type Group = {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  memberIds: string[];
  adminIds: string[];
  memberCount: number;
  createdAt?: string;
};

export type ResolvedConversationLabels = {
  displayName: string;
  roleLabel: string | null;
  otherParticipantId?: string;
};

export type CurrentUserLike = Pick<User, "id" | "fullname" | "name" | "email"> | null;

export type MediaPermissionKind = "voice" | "video";
export type MediaPermissionIssue = "unsupported" | "insecure" | "denied" | "not_found" | "unknown";
