"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "../../../lib/api";
import { loadChatUserDirectory } from "../../../lib/users-directory";
import type { ParsedIncomingCall, ParsedCallEnded } from "../../../lib/incoming-call-push";
import { uploadChatAttachment } from "../../../lib/upload-file";
import { useConnectStomp, type StompChatPayload, type StompTypingPayload, type StompWebrtcPayload } from "../../../lib/use-connect-stomp";
import { StoriesBar, StoryViewer, CreateStoryModal, type Story } from "../../../components/Stories";
import type {
  UserStory,
  Message,
  Conversation,
  User,
  Group,
  MediaPermissionKind,
  MediaPermissionIssue,
} from "./connect-types";
import {
  RTC_PEER_CFG,
  SYNTHETIC_USER_NAME,
  getMediaPermissionIssue,
  mediaPermissionMessage,
  getCurrentUserId,
  resolveConversationDisplay,
  enhanceConversation,
  resolveUserDisplayName,
  processChatMessage,
  enhanceMessages,
  normalizeSavedChatMessage,
} from "./connect-helpers";

export default function LeraConnectPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"chats" | "groups">("chats");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  /** Remote participants currently typing (STOMP), excluding self */
  const [remoteTypers, setRemoteTypers] = useState<{ userId: string; displayName: string }[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [mediaPermissionPrompt, setMediaPermissionPrompt] = useState<{
    kind: MediaPermissionKind;
    issue: MediaPermissionIssue;
  } | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'ended'>('idle');
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [incomingCallType, setIncomingCallType] = useState<'voice' | 'video'>('voice');
  const [incomingCaller, setIncomingCaller] = useState<{ id: string; name: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'message' | 'conversation'; id: string } | null>(null);
  // Reply to message feature
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  // Forward message feature
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  // Conversation preferences
  const [showConversationMenu, setShowConversationMenu] = useState<string | null>(null);
  // Block user feature
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [showBlockConfirm, setShowBlockConfirm] = useState<{ userId: string; userName: string } | null>(null);
  // Edit message feature
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  // Stories feature
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyViewerData, setStoryViewerData] = useState<{ userStories: UserStory[]; index: number } | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [editStory, setEditStory] = useState<Story | null>(null);
  const [storiesRefresh, setStoriesRefresh] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const remoteTypingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const lastTypingTrueSentRef = useRef(0);
  const publishTypingRef = useRef<((isTyping: boolean) => void) | null>(null);
  const stompConnectedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const activeCallIdRef = useRef<string | null>(null);
  const signalingConversationIdRef = useRef<string | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingRemoteOfferRef = useRef<{ type: "offer"; sdp?: string } | null>(null);
  const publishWebrtcRef = useRef<
    ((conversationId: string, payload: Record<string, unknown>) => void) | null
  >(null);
  const fetchMessagesRef = useRef<
    ((conversationId: string, conversationCtx?: Conversation | null) => Promise<void>) | null
  >(null);

  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const stopMediaStreams = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  }, []);

  /** Tear down local/remote call UI — STOMP hangup, Web Push, or callEnded deep link. */
  const performRemoteHangupCleanup = useCallback(
    (callId: string) => {
      const active = activeCallIdRef.current;
      if (active != null && active !== callId) return;

      setCallStatus("ended");
      stopCallTimer();
      pendingIceRef.current = [];
      pendingRemoteOfferRef.current = null;
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      activeCallIdRef.current = null;
      signalingConversationIdRef.current = null;
      stopMediaStreams();
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      setTimeout(() => {
        setShowCallModal(false);
        setShowVideoModal(false);
        setCallStatus("idle");
        setShowIncomingCall(false);
        setIncomingCaller(null);
      }, 800);
    },
    [stopMediaStreams]
  );

  const flushPendingIce = async (pc: RTCPeerConnection) => {
    const buf = pendingIceRef.current.splice(0, pendingIceRef.current.length);
    for (const c of buf) {
      try {
        await pc.addIceCandidate(c);
      } catch {
        // ignore invalid/late candidates
      }
    }
  };

  const addIceCandidateSafe = async (pc: RTCPeerConnection, init: RTCIceCandidateInit) => {
    if (!pc.remoteDescription) {
      pendingIceRef.current.push(init);
      return;
    }
    try {
      await pc.addIceCandidate(init);
    } catch {
      // ignore
    }
  };

  const buildPeerConnection = useCallback(() => {
    if (typeof RTCPeerConnection === "undefined") {
      throw new Error("WebRTC is not supported in this environment");
    }
    const pc = new RTCPeerConnection(RTC_PEER_CFG);
    pc.onicecandidate = (ev) => {
      const callId = activeCallIdRef.current;
      const convId = signalingConversationIdRef.current;
      if (!ev.candidate || !callId || !convId) return;
      publishWebrtcRef.current?.(convId, {
        type: "ice",
        callId,
        candidate: ev.candidate.toJSON(),
      });
    };
    pc.ontrack = (ev) => {
      const [stream] = ev.streams;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
      void remoteAudioRef.current?.play().catch(() => {});
    };
    const stream = localStreamRef.current;
    if (stream) stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    return pc;
  }, []);

  // Re-resolve placeholders once /api/users has loaded (list, header, messages)
  useEffect(() => {
    if (userMap.size === 0) return;
    const currentUserId = getCurrentUserId();
    setConversations((prev) =>
      prev.map((c) => enhanceConversation(c, userMap, currentUserId))
    );
    setActiveConversation((prev) =>
      prev ? enhanceConversation(prev, userMap, currentUserId) : null
    );
    setMessages((prev) =>
      prev.length > 0
        ? enhanceMessages(prev, userMap, currentUserId, currentUser, activeConversation)
        : prev
    );
  }, [userMap, activeConversation?.id, currentUser]);

  useEffect(() => {
    fetchInitialData();
    // Request notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
    const conversationsPolling = setInterval(() => {
      refreshConversations();
    }, 5000);
    return () => {
      clearInterval(conversationsPolling);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const typingIdentity = useMemo(() => {
    const uid = getCurrentUserId().trim();
    if (!uid) return null;
    const name = resolveUserDisplayName(uid, userMap, uid, currentUser, activeConversation);
    return { userId: uid, userName: name };
  }, [userMap, currentUser, activeConversation]);

  const handleRemoteTyping = useCallback((payload: StompTypingPayload) => {
    const uid = (payload.userId ?? "").trim();
    if (!uid || uid === getCurrentUserId().trim()) return;
    const displayName =
      payload.userName && payload.userName.trim() ? payload.userName.trim() : "Someone";

    const timers = remoteTypingTimersRef.current;
    const existing = timers.get(uid);
    if (existing) clearTimeout(existing);

    if (!payload.isTyping) {
      timers.delete(uid);
      setRemoteTypers((prev) => prev.filter((t) => t.userId !== uid));
      return;
    }

    setRemoteTypers((prev) => {
      const others = prev.filter((t) => t.userId !== uid);
      return [...others, { userId: uid, displayName }];
    });

    const t = setTimeout(() => {
      timers.delete(uid);
      setRemoteTypers((prev) => prev.filter((x) => x.userId !== uid));
    }, 4500);
    timers.set(uid, t);
  }, []);

  useEffect(() => {
    remoteTypingTimersRef.current.forEach((t) => clearTimeout(t));
    remoteTypingTimersRef.current.clear();
    setRemoteTypers([]);
  }, [activeConversation?.id]);

  const handleStompMessage = useCallback(
    (payload: StompChatPayload) => {
      if (!payload.id || !payload.conversationId) return;
      const currentUserId = getCurrentUserId();
      const processed = processChatMessage(
        {
          id: payload.id,
          senderId: payload.senderId,
          message: payload.message,
          messageType: payload.messageType,
          attachmentUrl: payload.attachmentUrl,
          replyToId: payload.replyToId,
          replyPreview: payload.replyPreview,
          forwardedFromId: payload.forwardedFromId,
          sentAt: payload.sentAt,
          isRead: payload.isRead,
        } as Record<string, unknown>,
        userMap,
        currentUserId,
        currentUser,
        activeConversation
      );
      setMessages((prev) => {
        if (prev.some((m) => m.id === processed.id)) return prev;
        return [...prev, processed];
      });
      void refreshConversations();
    },
    [userMap, currentUser, activeConversation]
  );

  const webrtcConversationIds = useMemo(
    () => conversations.map((c) => c.id).filter((id): id is string => Boolean(id)),
    [conversations]
  );

  const handleWebrtc = useCallback(
    (payload: StompWebrtcPayload) => {
      void (async () => {
        const self = getCurrentUserId().trim();
        const from = (payload.fromUserId ?? "").trim();
        const ptype = payload.type ?? "";

        if (ptype === "ring") {
          const callerId = (payload.callerId ?? "").trim();
          if (!callerId || callerId === self) return;
          const convId = (payload.conversationId ?? "").trim();
          if (!convId) return;
          signalingConversationIdRef.current = convId;
          activeCallIdRef.current = payload.callId ?? null;
          const rawType = (payload.callType ?? "VOICE").toUpperCase();
          const ct = rawType === "VIDEO" ? "video" : "voice";
          setIncomingCallType(ct);
          const name = resolveUserDisplayName(callerId, userMap, self, currentUser, null);
          setIncomingCaller({ id: callerId, name });
          setShowIncomingCall(true);
          const match = conversations.find((c) => c.id === convId);
          if (match) {
            let enhanced = enhanceConversation(match, userMap, self);
            if (!enhanced.otherParticipantId && match.participantIds?.length) {
              const otherId = match.participantIds.find((id) => id !== self);
              if (otherId) {
                enhanced = enhanceConversation(
                  { ...enhanced, otherParticipantId: otherId },
                  userMap,
                  self
                );
              }
            }
            setActiveConversation(enhanced);
            void fetchMessagesRef.current?.(convId, enhanced);
          }
          return;
        }

        if (from && from === self) return;

        const callId = payload.callId ?? "";
        if (!callId) return;

        if (ptype === "hangup") {
          performRemoteHangupCleanup(callId);
          return;
        }

        const pc = pcRef.current;
        if (!pc) {
          if (ptype === "offer" && payload.sdp) {
            pendingRemoteOfferRef.current = { type: "offer", sdp: payload.sdp };
            activeCallIdRef.current = callId;
            const convFromPayload = (payload.conversationId ?? "").trim();
            if (convFromPayload) signalingConversationIdRef.current = convFromPayload;
          }
          return;
        }

        if (activeCallIdRef.current !== callId) return;

        if (ptype === "offer" && payload.sdp) {
          try {
            await pc.setRemoteDescription({ type: "offer", sdp: payload.sdp });
            await flushPendingIce(pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            const convId = signalingConversationIdRef.current;
            if (convId) {
              publishWebrtcRef.current?.(convId, { type: "answer", callId, sdp: answer.sdp });
            }
            setCallStatus("connected");
            startCallTimer();
          } catch (e) {
            console.error(e);
          }
          return;
        }

        if (ptype === "answer" && payload.sdp) {
          try {
            await pc.setRemoteDescription({ type: "answer", sdp: payload.sdp });
            await flushPendingIce(pc);
            setCallStatus("connected");
            startCallTimer();
          } catch (e) {
            console.error(e);
          }
          return;
        }

        if (ptype === "ice" && payload.candidate) {
          const cand = payload.candidate as RTCIceCandidateInit;
          await addIceCandidateSafe(pc, cand);
        }
      })();
    },
    [userMap, currentUser, conversations, performRemoteHangupCleanup]
  );

  const { connected: stompConnected, publishTyping, publishWebrtc } = useConnectStomp({
    conversationId: activeConversation?.id ?? null,
    enabled: Boolean(activeConversation?.id),
    onChatMessage: handleStompMessage,
    onTyping: handleRemoteTyping,
    typingIdentity,
    webrtcConversationIds,
    onWebrtc: handleWebrtc,
  });

  publishTypingRef.current = publishTyping;
  publishWebrtcRef.current = publishWebrtc;
  stompConnectedRef.current = stompConnected;

  useEffect(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    if (activeConversation) {
      const pollMs = stompConnected ? 15000 : 2000;
      pollingIntervalRef.current = setInterval(() => {
        refreshMessages(activeConversation.id);
      }, pollMs);
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [activeConversation?.id, stompConnected]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getUserName = useCallback(
    (userId?: string): string =>
      resolveUserDisplayName(userId, userMap, getCurrentUserId(), currentUser, activeConversation),
    [userMap, currentUser, activeConversation]
  );

  const refreshConversations = async () => {
    try {
      // Get userId directly from cookies to ensure we always have the latest value
      const userStr = Cookies.get("userData");
      let userId = '';
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user?.id || '';
        } catch (e) {}
      }
      
      if (!userId) {
        console.log("No userId found for conversation refresh");
        return;
      }
      
      const conversationsData = await apiFetch(`/api/chat/conversations?userId=${userId}`).catch(() => []);
      const convs = Array.isArray(conversationsData) ? conversationsData : [];
      setConversations(convs.map((c: Conversation) => enhanceConversation(c, userMap, userId)));
    } catch (error) {
      // Silently fail
    }
  };

  const refreshMessages = async (conversationId: string) => {
    try {
      const userStr = Cookies.get("userData");
      const storedUser = userStr ? JSON.parse(userStr) : null;
      const currentUserId = (storedUser?.id?.toString() || "").trim();

      let localUserMap = userMap;
      if (localUserMap.size === 0) {
        const usersArray = (await loadChatUserDirectory()) as User[];
        localUserMap = new Map<string, User>();
        usersArray.forEach((u: User) => {
          localUserMap.set(u.id, u);
        });
        setUserMap(localUserMap);
        setUsers(usersArray);
      }

      const convCtx = activeConversation?.id === conversationId ? activeConversation : null;
      const messagesData = await apiFetch(`/api/chat/conversations/${conversationId}/messages`).catch(() => []);
      const msgs = Array.isArray(messagesData) ? messagesData : [];
      const processedMsgs = msgs
        .filter((m: { messageType?: string }) => m.messageType !== "SYSTEM")
        .map((m: Record<string, unknown>) =>
          processChatMessage(m, localUserMap, currentUserId, currentUser ?? storedUser, convCtx)
        );
      
      // Only update if messages changed
      if (JSON.stringify(processedMsgs.map(m => m.id)) !== JSON.stringify(messages.map(m => m.id))) {
        setMessages(processedMsgs);
        // Check for new messages and show notification
        if (processedMsgs.length > messages.length && messages.length > 0) {
          const newMsgs = processedMsgs.slice(messages.length);
          newMsgs.forEach((msg: any) => {
            if (!msg.isMine && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('New Message - LERA Connect', {
                body: `${msg.senderName}: ${msg.message}`,
                icon: '/favicon.ico',
                tag: msg.id,
              });
              // Play notification sound
              try {
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => {});
              } catch (e) {}
            }
          });
        }
      }
    } catch (error) {
      // Silently fail
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Get current user from Cookies
      const userStr = Cookies.get("userData");
      let user = null;
      let userId = '';
      if (userStr) {
        try {
          user = JSON.parse(userStr);
          userId = user?.id || '';
          setCurrentUser(user);
        } catch (e) {
          console.error("Error parsing userData cookie:", e);
        }
      }
      
      if (!userId) {
        console.error("No user ID found - cannot load conversations");
        setLoading(false);
        return;
      }
      
      const usersArray = (await loadChatUserDirectory()) as User[];
      setUsers(usersArray);
      const uMap = new Map<string, User>();
      usersArray.forEach((u: User) => {
        uMap.set(u.id, u);
      });
      setUserMap(uMap);
      
      // Fetch conversations with userId for proper filtering
      console.log("Fetching conversations for userId:", userId);
      const conversationsData = await apiFetch(`/api/chat/conversations?userId=${userId}`).catch(() => []);
      const convs = Array.isArray(conversationsData) ? conversationsData : [];
      console.log("Received conversations:", convs.length);
      setConversations(convs.map((c: Conversation) => enhanceConversation(c, uMap, userId)));
      
      // Fetch groups
      const groupsData = await apiFetch(`/api/groups/user/${encodeURIComponent(userId)}`).catch(() => []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      
      // Fetch unread notifications
      if (user?.id) {
        const notifCount = await apiFetch(`/api/notifications/user/${user.id}/unread/count`).catch(() => ({ count: 0 }));
        setUnreadNotifications(notifCount?.count || 0);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (
    conversationId: string,
    conversationCtx?: Conversation | null
  ) => {
    setMessagesLoading(true);
    try {
      const userStr = Cookies.get("userData");
      const storedUser = userStr ? JSON.parse(userStr) : null;
      const currentUserId = (storedUser?.id || "").toString().trim();
      const convCtx = conversationCtx ?? (activeConversation?.id === conversationId ? activeConversation : null);

      const localUserMap = new Map<string, User>();
      const usersArray = (await loadChatUserDirectory()) as User[];
      usersArray.forEach((u: User) => {
        localUserMap.set(u.id, u);
      });
      setUserMap(localUserMap);
      setUsers(usersArray);

      const messagesData = await apiFetch(`/api/chat/conversations/${conversationId}/messages`).catch(() => []);
      const msgs = Array.isArray(messagesData) ? messagesData : [];

      const processedMsgs = msgs
        .filter((m: { messageType?: string }) => m.messageType !== "SYSTEM")
        .map((m: Record<string, unknown>) =>
          processChatMessage(
            m,
            localUserMap,
            currentUserId,
            currentUser ?? storedUser,
            convCtx
          )
        );
      setMessages(processedMsgs);
      await apiFetch(`/api/chat/conversations/${conversationId}/read`, { method: "PUT" }).catch(() => {});
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  fetchMessagesRef.current = fetchMessages;

  const applyIncomingCallPayload = useCallback(
    (callId: string, conversationId: string, callerId: string, callKindRaw: string) => {
      const self = getCurrentUserId().trim();
      if (!self || callerId === self) return;
      if (activeCallIdRef.current === callId) return;

      signalingConversationIdRef.current = conversationId;
      activeCallIdRef.current = callId;
      setIncomingCallType(callKindRaw === "VIDEO" ? "video" : "voice");
      setIncomingCaller({
        id: callerId,
        name: resolveUserDisplayName(callerId, userMap, self, currentUser, null),
      });
      setShowIncomingCall(true);

      const match = conversations.find((c) => c.id === conversationId);
      if (match) {
        let enhanced = enhanceConversation(match, userMap, self);
        if (!enhanced.otherParticipantId && match.participantIds?.length) {
          const otherId = match.participantIds.find((id) => id !== self);
          if (otherId) {
            enhanced = enhanceConversation(
              { ...enhanced, otherParticipantId: otherId },
              userMap,
              self
            );
          }
        }
        setActiveConversation(enhanced);
        void fetchMessagesRef.current?.(conversationId, enhanced);
      }
    },
    [userMap, currentUser, conversations]
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const uid = getCurrentUserId().trim();
      if (!uid || cancelled) return;
      try {
        const list = (await apiFetch(`/api/calls/active?userId=${encodeURIComponent(uid)}`)) as Array<{
          callId?: string;
          conversationId?: string;
          callType?: string;
          status?: string;
          callerId?: string;
        }>;
        if (!Array.isArray(list) || cancelled) return;
        const ring = list.find(
          (c) =>
            c?.status === "RINGING" &&
            c.callerId &&
            c.callerId !== uid &&
            c.callId &&
            c.conversationId
        );
        if (!ring?.callId || !ring.conversationId || !ring.callerId) return;
        if (activeCallIdRef.current === ring.callId) return;

        applyIncomingCallPayload(
          ring.callId,
          ring.conversationId,
          ring.callerId,
          (ring.callType ?? "VOICE").toUpperCase()
        );
      } catch {
        // ignore
      }
    };
    const t = setInterval(() => void run(), 5000);
    void run();
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [conversations, userMap, currentUser, applyIncomingCallPayload]);

  /** Open incoming-call UI when user lands from a Web Push notification (see public/sw.js). */
  useEffect(() => {
    if (typeof window === "undefined" || loading) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("incomingCall") !== "1") return;

    const callId = url.searchParams.get("callId")?.trim();
    const conversationId = url.searchParams.get("conversationId")?.trim();
    const callerId = url.searchParams.get("callerId")?.trim();
    const callKindRaw = (url.searchParams.get("callKind") || "VOICE").toUpperCase();
    if (!callId || !conversationId || !callerId) return;

    const self = getCurrentUserId().trim();
    if (!self || callerId === self) return;

    if (activeCallIdRef.current !== callId) {
      applyIncomingCallPayload(callId, conversationId, callerId, callKindRaw);
    }

    url.searchParams.delete("incomingCall");
    url.searchParams.delete("callId");
    url.searchParams.delete("conversationId");
    url.searchParams.delete("callKind");
    url.searchParams.delete("callerId");
    const qs = url.searchParams.toString();
    window.history.replaceState({}, "", `${url.pathname}${qs ? `?${qs}` : ""}`);
  }, [loading, conversations, userMap, currentUser, applyIncomingCallPayload]);

  /** Foreground / in-app: Capacitor routes incoming-call pushes here (see lib/native-push.ts). */
  useEffect(() => {
    const fn = (ev: Event) => {
      const ce = ev as CustomEvent<ParsedIncomingCall>;
      const d = ce.detail;
      if (!d?.callId || !d.conversationId || !d.callerId) return;
      applyIncomingCallPayload(d.callId, d.conversationId, d.callerId, d.callKindUpper);
    };
    window.addEventListener("lera:incoming-call", fn as EventListener);
    return () => window.removeEventListener("lera:incoming-call", fn as EventListener);
  }, [applyIncomingCallPayload]);

  const selectConversation = (conv: Conversation) => {
    const currentUserId = getCurrentUserId();
    let enhancedConv = enhanceConversation(conv, userMap, currentUserId);
    if (!enhancedConv.otherParticipantId && conv.participantIds?.length) {
      const otherId = conv.participantIds.find((id) => id !== currentUserId);
      if (otherId) {
        enhancedConv = enhanceConversation(
          { ...enhancedConv, otherParticipantId: otherId },
          userMap,
          currentUserId
        );
      }
    }
    setActiveConversation(enhancedConv);
    fetchMessages(conv.id, enhancedConv);
  };

  const selectGroup = (group: Group) => {
    const groupConv: Conversation = {
      id: group.id,
      name: group.name,
      description: group.description,
      type: "GROUP",
      memberCount: group.memberCount,
      isOnline: true,
    };
    setActiveConversation(groupConv);
    fetchMessages(group.id, groupConv);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sending) return;
    
    // Get sender ID from cookies to ensure we have it
    const userStr = Cookies.get("userData");
    let senderId = currentUser?.id;
    let senderName = currentUser?.fullname || currentUser?.name || "";
    if (!senderId && userStr) {
      try {
        const parsed = JSON.parse(userStr);
        senderId = parsed?.id || parsed?.userId;
        senderName = parsed?.fullname || parsed?.name || senderName;
      } catch (e) {}
    }
    
    if (!senderId) {
      alert("Unable to identify sender. Please refresh and try again.");
      return;
    }

    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    lastTypingTrueSentRef.current = 0;
    publishTypingRef.current?.(false);

    const trimmedText = newMessage.trim();
    const replySnapshot = replyingTo;
    let optimisticId: string | null = null;

    setSending(true);
    try {
      if (editingMessage) {
        await apiFetch(`/api/chat/messages/${editingMessage.id}`, {
          method: "PUT",
          body: JSON.stringify({
            senderId: senderId,
            message: trimmedText,
          }),
        });
        setEditingMessage(null);
        setNewMessage("");
        setReplyingTo(null);
        fetchMessages(activeConversation.id);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id
              ? { ...c, lastMessage: trimmedText, lastMessageTime: new Date().toISOString() }
              : c
          )
        );
      } else {
        optimisticId = `pending-${
          typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto
            ? globalThis.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        }`;
        const optimistic: Message = {
          id: optimisticId,
          leadId: activeConversation.id,
          senderId: String(senderId),
          message: trimmedText,
          messageType: "TEXT",
          isMine: true,
          senderName: "You",
          pending: true,
          sentAt: new Date().toISOString(),
          ...(replySnapshot
            ? {
                replyToId: replySnapshot.id,
                replyPreview: replySnapshot.message?.substring(0, 100),
              }
            : {}),
        };
        setMessages((prev) => [...prev, optimistic]);
        setNewMessage("");
        setReplyingTo(null);

        const payload: Record<string, unknown> = {
          conversationId: activeConversation.id,
          senderId: senderId,
          message: trimmedText,
          messageType: "TEXT",
        };
        if (replySnapshot) {
          payload.replyToId = replySnapshot.id;
          payload.replyPreview = replySnapshot.message?.substring(0, 100);
        }

        const saved = await apiFetch("/api/chat/messages", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const processed = processChatMessage(
          normalizeSavedChatMessage(saved),
          userMap,
          String(senderId),
          currentUser,
          activeConversation
        );
        setMessages((prev) => {
          const next = prev.filter((m) => m.id !== optimisticId);
          if (next.some((m) => m.id === processed.id)) return next;
          return [...next, processed];
        });

        try {
          let recipientUserId: string | null = null;

          if (activeConversation.type !== "GROUP") {
            if (activeConversation.otherParticipantId) {
              recipientUserId = activeConversation.otherParticipantId;
            } else if (activeConversation.participantIds && activeConversation.participantIds.length > 0) {
              recipientUserId =
                activeConversation.participantIds.find((id) => id !== senderId) || null;
            }
          }

          if (recipientUserId) {
            await apiFetch("/api/notifications", {
              method: "POST",
              body: JSON.stringify({
                type: "MESSAGE",
                title: `New message from ${senderName}`,
                titleVi: `Tin nhắn mới từ ${senderName}`,
                message: trimmedText.substring(0, 100) + (trimmedText.length > 100 ? "..." : ""),
                userId: recipientUserId,
                referenceType: "message",
                referenceId: activeConversation.id,
              }),
            });
          }
        } catch {
          // non-critical
        }

        fetchMessages(activeConversation.id);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id
              ? { ...c, lastMessage: trimmedText, lastMessageTime: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (error: unknown) {
      console.error("Error sending message:", error);
      const errorMsg =
        error instanceof Error ? error.message : typeof error === "object" && error && "error" in error
          ? String((error as { error: unknown }).error)
          : "Unknown error";
      if (optimisticId) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setNewMessage(trimmedText);
        setReplyingTo(replySnapshot);
      }
      alert(`Failed to send message: ${errorMsg}`);
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = async (user: User) => {
    try {
      // Get current user from cookies to send both participants
      const userStr = Cookies.get("userData");
      let storedUser = null;
      try {
        storedUser = userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        // Try URL decoding if direct parse fails
        try {
          storedUser = userStr ? JSON.parse(decodeURIComponent(userStr)) : null;
        } catch (e2) {
          console.error("Failed to parse userData cookie:", e2);
        }
      }
      const senderId = storedUser?.id || currentUser?.id || '';
      
      // Validate IDs before sending
      if (!senderId) {
        alert("Error: Unable to get your user ID. Please login again.");
        console.error("No senderId found. storedUser:", storedUser, "currentUser:", currentUser);
        return;
      }
      if (!user.id) {
        alert("Error: Selected user has no ID.");
        console.error("No user.id found:", user);
        return;
      }
      
      console.log('[Connect] Creating conversation:', { senderId, recipientId: user.id });
      
      const result = await apiFetch("/api/chat/conversations", {
        method: "POST",
        body: JSON.stringify({ 
          senderId: senderId,
          recipientId: user.id,
          participantIds: [senderId, user.id]
        }),
      });
      if (result && result.id) {
        const newConv: Conversation = {
          id: result.id,
          name: user.fullname || user.name || user.email,
          avatarUrl: user.avatarUrl,
          lastMessage: "Conversation started",
          unreadCount: 0,
          isOnline: true,
          type: "DIRECT",
          participantIds: [senderId, user.id],
          otherParticipantId: user.id,
        };
        setConversations(prev => [newConv, ...prev]);
        setActiveConversation(newConv);
        fetchMessages(result.id);
      } else if (result && result.error) {
        alert(`Failed to create conversation: ${result.error}`);
        return;
      }
      setShowNewChatModal(false);
      setSearchTerm("");
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      const errorMsg = error?.message || error?.error || "Unknown error";
      alert(`Failed to create conversation: ${errorMsg}`);
    }
  };

  // === NEW FEATURES: Reply, Forward, Block, Archive, Mute, Pin ===

  // Reply to a message
  const handleReplyTo = (message: Message) => {
    setReplyingTo(message);
    setShowMessageMenu(null);
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Forward message
  const handleForward = (message: Message) => {
    setForwardingMessage(message);
    setShowForwardModal(true);
    setShowMessageMenu(null);
  };

  // Confirm forward to selected conversations
  const confirmForward = async (toConversationIds: string[]) => {
    if (!forwardingMessage || toConversationIds.length === 0) return;
    try {
      await apiFetch(`/api/chat/messages/${forwardingMessage.id}/forward`, {
        method: "POST",
        body: JSON.stringify({
          senderId: currentUser?.id,
          toConversationIds,
        }),
      });
      setShowForwardModal(false);
      setForwardingMessage(null);
      alert(`Message forwarded to ${toConversationIds.length} conversation(s)`);
    } catch (error) {
      console.error("Error forwarding message:", error);
      alert("Failed to forward message");
    }
  };

  // Edit message
  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setNewMessage(message.message);
    setShowMessageMenu(null);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingMessage(null);
    setNewMessage("");
  };

  // Archive conversation
  const archiveConversation = async (conversationId: string, archive: boolean = true) => {
    try {
      await apiFetch(`/api/chat/conversations/${conversationId}/archive`, {
        method: "PUT",
        body: JSON.stringify({
          userId: currentUser?.id,
          archive,
        }),
      });
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, isArchived: archive } : c
      ));
      if (archive && activeConversation?.id === conversationId) {
        setActiveConversation(null);
      }
      setShowConversationMenu(null);
    } catch (error) {
      console.error("Error archiving conversation:", error);
    }
  };

  // Mute conversation
  const muteConversation = async (conversationId: string, mute: boolean = true, durationHours?: number) => {
    try {
      await apiFetch(`/api/chat/conversations/${conversationId}/mute`, {
        method: "PUT",
        body: JSON.stringify({
          userId: currentUser?.id,
          mute,
          durationHours,
        }),
      });
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, isMuted: mute } : c
      ));
      setShowConversationMenu(null);
    } catch (error) {
      console.error("Error muting conversation:", error);
    }
  };

  // Pin conversation
  const pinConversation = async (conversationId: string, pin: boolean = true) => {
    try {
      await apiFetch(`/api/chat/conversations/${conversationId}/pin`, {
        method: "PUT",
        body: JSON.stringify({
          userId: currentUser?.id,
          pin,
        }),
      });
      setConversations(prev => {
        const updated = prev.map(c =>
          c.id === conversationId ? { ...c, isPinned: pin } : c
        );
        // Sort: pinned first, then by last message time
        return updated.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0;
        });
      });
      setShowConversationMenu(null);
    } catch (error) {
      console.error("Error pinning conversation:", error);
    }
  };

  // Block user
  const blockUser = async (userId: string) => {
    try {
      await apiFetch("/api/chat/users/block", {
        method: "POST",
        body: JSON.stringify({
          blockerId: currentUser?.id,
          blockedId: userId,
        }),
      });
      setBlockedUsers(prev => new Set(Array.from(prev).concat(userId)));
      setShowBlockConfirm(null);
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  // Unblock user
  const unblockUser = async (userId: string) => {
    try {
      await apiFetch(`/api/chat/users/block?blockerId=${currentUser?.id}&blockedId=${userId}`, {
        method: "DELETE",
      });
      setBlockedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
    }
  };

  // Fetch blocked users on load
  const fetchBlockedUsers = async () => {
    if (!currentUser?.id) return;
    try {
      const data = await apiFetch(`/api/chat/users/${currentUser.id}/blocked`);
      const blockedIds = (data || []).map((b: any) => b.blockedUserId);
      setBlockedUsers(new Set(blockedIds));
    } catch (error) {
      // Silently fail
    }
  };

  // === END NEW FEATURES ===

  const createGroup = async () => {
    if (!newGroupName.trim() || selectedMembers.length === 0) {
      alert("Please enter a group name and select at least one member");
      return;
    }
    try {
      const result = await apiFetch("/api/groups", {
        method: "POST",
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDescription.trim(),
          createdBy: currentUser?.id,
          memberIds: selectedMembers,
        }),
      });
      if (result && result.id) {
        const newGroup: Group = {
          id: result.id,
          name: newGroupName.trim(),
          description: newGroupDescription.trim(),
          memberIds: selectedMembers,
          adminIds: [currentUser?.id || ""],
          memberCount: selectedMembers.length + 1,
        };
        setGroups(prev => [newGroup, ...prev]);
        selectGroup(newGroup);
      }
      setShowNewGroupModal(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setSelectedMembers([]);
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeConversation) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadChatAttachment(file, {
        uploadedBy: currentUser?.id || "",
      });
      if (result && result.fileUrl) {
        await apiFetch("/api/chat/messages", {
          method: "POST",
          body: JSON.stringify({
            conversationId: activeConversation.id,
            senderId: currentUser?.id,
            message: `📎 ${result.fileName}`,
            messageType: result.fileType?.toUpperCase() || "FILE",
            attachmentUrl: result.fileUrl,
          }),
        });
        fetchMessages(activeConversation.id);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
    }
    if (stompConnectedRef.current && publishTypingRef.current && typingIdentity?.userId) {
      const now = Date.now();
      if (now - lastTypingTrueSentRef.current > 750) {
        lastTypingTrueSentRef.current = now;
        publishTypingRef.current(true);
      }
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (stompConnectedRef.current && publishTypingRef.current && typingIdentity?.userId) {
        publishTypingRef.current(false);
      }
    }, 2000);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  // Common emoji list for quick access
  const commonEmojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '👏', '😊', '🙏', '💪', '✨', '🤝'];
  
  // Reaction emojis (like iMessage/WhatsApp)
  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!activeConversation) return;
    try {
      await apiFetch("/api/chat/reactions", {
        method: "POST",
        headers: {
          "X-User-Id": currentUser?.id || "",
        },
        body: JSON.stringify({
          messageId,
          conversationId: activeConversation.id,
          emoji,
        }),
      });
      setShowReactionPicker(null);
      // Refresh messages to get updated reactions
      fetchMessages(activeConversation.id);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  // Fetch unread notification count
  const fetchUnreadNotifications = async () => {
    try {
      if (!currentUser?.id) return;
      const result = await apiFetch(`/api/notifications/user/${currentUser.id}/unread/count`).catch(() => ({ count: 0 }));
      setUnreadNotifications(result?.count || 0);
    } catch (error) {
      // Silently fail
    }
  };

  // Format call duration
  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const requestAudioStream = async (): Promise<boolean> => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaPermissionPrompt({ kind: "voice", issue: "unsupported" });
      return false;
    }
    if (!window.isSecureContext) {
      setMediaPermissionPrompt({ kind: "voice", issue: "insecure" });
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setMediaPermissionPrompt(null);
      return true;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setMediaPermissionPrompt({
        kind: "voice",
        issue: getMediaPermissionIssue(error),
      });
      return false;
    }
  };

  const requestVideoStream = async (): Promise<boolean> => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaPermissionPrompt({ kind: "video", issue: "unsupported" });
      return false;
    }
    if (!window.isSecureContext) {
      setMediaPermissionPrompt({ kind: "video", issue: "insecure" });
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;
      setMediaPermissionPrompt(null);
      return true;
    } catch (error) {
      console.error("Error accessing camera/microphone:", error);
      setMediaPermissionPrompt({
        kind: "video",
        issue: getMediaPermissionIssue(error),
      });
      return false;
    }
  };

  const retryMediaPermission = async () => {
    if (!mediaPermissionPrompt) return;
    const { kind } = mediaPermissionPrompt;
    if (kind === "voice") {
      await requestAudioStream();
    } else {
      await requestVideoStream();
    }
  };

  /** Remote hangup via Web Push / URL when STOMP did not deliver hangup (e.g. tab background). */
  useEffect(() => {
    const onCallEnded = (ev: Event) => {
      const ce = ev as CustomEvent<ParsedCallEnded>;
      const d = ce.detail;
      if (!d?.callId) return;
      performRemoteHangupCleanup(d.callId);
    };
    window.addEventListener("lera:call-ended", onCallEnded as EventListener);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("callEnded") === "1") {
        const callId = url.searchParams.get("callId")?.trim();
        if (callId) {
          performRemoteHangupCleanup(callId);
          url.searchParams.delete("callEnded");
          url.searchParams.delete("callId");
          url.searchParams.delete("reason");
          url.searchParams.delete("conversationId");
          const qs = url.searchParams.toString();
          window.history.replaceState({}, "", `${url.pathname}${qs ? `?${qs}` : ""}`);
        }
      }
    }

    return () => window.removeEventListener("lera:call-ended", onCallEnded as EventListener);
  }, [performRemoteHangupCleanup]);

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle speaker (for demo purposes, as browser speaker control is limited)
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // In a real app, you'd route audio to different outputs
  };

  // Toggle camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isCameraOn;
      });
      setIsCameraOn(!isCameraOn);
    }
  };

  useEffect(() => {
    if (!showVideoModal) return;
    const v = localVideoRef.current;
    if (v && localStreamRef.current) {
      v.srcObject = localStreamRef.current;
    }
  }, [showVideoModal, callStatus, isCameraOn]);

  // Start a voice call
  const startCall = async () => {
    if (!activeConversation) return;
    signalingConversationIdRef.current = activeConversation.id;

    const hasPermission = await requestAudioStream();
    if (!hasPermission) return;

    setShowCallModal(true);
    setCallStatus("calling");
    setIsMuted(false);
    setIsSpeakerOn(true);

    try {
      const data = (await apiFetch("/api/calls/initiate", {
        method: "POST",
        body: JSON.stringify({
          conversationId: activeConversation.id,
          callerId: currentUser?.id,
          callType: "VOICE",
        }),
      })) as { callId?: string };
      const callId = typeof data?.callId === "string" ? data.callId : null;
      if (!callId) throw new Error("Missing call id");
      activeCallIdRef.current = callId;
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      const pc = buildPeerConnection();
      pcRef.current = pc;
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      publishWebrtcRef.current?.(activeConversation.id, {
        type: "offer",
        callId,
        sdp: offer.sdp,
      });
    } catch (error) {
      console.error("Error starting call:", error);
      setCallStatus("ended");
      pendingIceRef.current = [];
      pendingRemoteOfferRef.current = null;
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      activeCallIdRef.current = null;
      signalingConversationIdRef.current = null;
      stopMediaStreams();
      setTimeout(() => {
        setShowCallModal(false);
        setCallStatus("idle");
      }, 900);
    }
  };

  // Start a video call
  const startVideoCall = async () => {
    if (!activeConversation) return;
    signalingConversationIdRef.current = activeConversation.id;

    const hasPermission = await requestVideoStream();
    if (!hasPermission) return;

    setShowVideoModal(true);
    setCallStatus("calling");
    setIsMuted(false);
    setIsCameraOn(true);

    try {
      const data = (await apiFetch("/api/calls/initiate", {
        method: "POST",
        body: JSON.stringify({
          conversationId: activeConversation.id,
          callerId: currentUser?.id,
          callType: "VIDEO",
        }),
      })) as { callId?: string };
      const callId = typeof data?.callId === "string" ? data.callId : null;
      if (!callId) throw new Error("Missing call id");
      activeCallIdRef.current = callId;
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      const pc = buildPeerConnection();
      pcRef.current = pc;
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      publishWebrtcRef.current?.(activeConversation.id, {
        type: "offer",
        callId,
        sdp: offer.sdp,
      });
    } catch (error) {
      console.error("Error starting video call:", error);
      setCallStatus("ended");
      pendingIceRef.current = [];
      pendingRemoteOfferRef.current = null;
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      activeCallIdRef.current = null;
      signalingConversationIdRef.current = null;
      stopMediaStreams();
      setTimeout(() => {
        setShowVideoModal(false);
        setCallStatus("idle");
      }, 900);
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCaller) return;
    const callId = activeCallIdRef.current;
    const userId = getCurrentUserId();
    if (!callId || !userId) return;

    if (incomingCallType === "voice") {
      const hasPermission = await requestAudioStream();
      if (!hasPermission) {
        setShowIncomingCall(false);
        setIncomingCaller(null);
        try {
          await apiFetch("/api/calls/reject", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ callId, userId }),
          });
        } catch (e) {
          console.error(e);
        }
        activeCallIdRef.current = null;
        signalingConversationIdRef.current = null;
        pendingRemoteOfferRef.current = null;
        return;
      }
      setShowCallModal(true);
    } else {
      const hasPermission = await requestVideoStream();
      if (!hasPermission) {
        setShowIncomingCall(false);
        setIncomingCaller(null);
        try {
          await apiFetch("/api/calls/reject", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ callId, userId }),
          });
        } catch (e) {
          console.error(e);
        }
        activeCallIdRef.current = null;
        signalingConversationIdRef.current = null;
        pendingRemoteOfferRef.current = null;
        return;
      }
      setShowVideoModal(true);
    }

    setShowIncomingCall(false);
    setCallStatus("calling");
    setIsMuted(false);
    setIsSpeakerOn(true);
    setIsCameraOn(incomingCallType === "video");

    try {
      await apiFetch("/api/calls/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, userId }),
      });
    } catch (error) {
      console.error("Error accepting call:", error);
    }

    try {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      const pc = buildPeerConnection();
      pcRef.current = pc;
      const offerInit = pendingRemoteOfferRef.current;
      if (offerInit?.sdp) {
        await pc.setRemoteDescription({ type: "offer", sdp: offerInit.sdp });
        await flushPendingIce(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        const convId = signalingConversationIdRef.current;
        if (convId) {
          publishWebrtcRef.current?.(convId, { type: "answer", callId, sdp: answer.sdp });
        }
        pendingRemoteOfferRef.current = null;
        setCallStatus("connected");
        startCallTimer();
      }
    } catch (e) {
      console.error(e);
      setCallStatus("ended");
    }
  };

  // Reject incoming call
  const rejectCall = async () => {
    const callId = activeCallIdRef.current;
    const userId = getCurrentUserId();
    setShowIncomingCall(false);
    setIncomingCaller(null);

    if (callId && userId) {
      try {
        await apiFetch("/api/calls/reject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callId, userId }),
        });
      } catch (error) {
        console.error("Error rejecting call:", error);
      }
    }
    activeCallIdRef.current = null;
    signalingConversationIdRef.current = null;
    pendingRemoteOfferRef.current = null;
  };

  // End call
  const endCall = async () => {
    const callId = activeCallIdRef.current;
    const userId = getCurrentUserId();
    const convId = signalingConversationIdRef.current;
    if (publishWebrtcRef.current && callId && convId) {
      try {
        publishWebrtcRef.current(convId, { type: "hangup", callId });
      } catch {
        // ignore
      }
    }
    if (callId && userId) {
      try {
        await apiFetch(
          `/api/calls/${encodeURIComponent(callId)}/end?userId=${encodeURIComponent(userId)}`,
          { method: "POST" }
        );
      } catch {
        // ignore
      }
    }
    setCallStatus("ended");
    stopCallTimer();
    pendingIceRef.current = [];
    pendingRemoteOfferRef.current = null;
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    activeCallIdRef.current = null;
    signalingConversationIdRef.current = null;
    stopMediaStreams();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setTimeout(() => {
      setShowCallModal(false);
      setShowVideoModal(false);
      setCallStatus("idle");
      setShowIncomingCall(false);
      setIncomingCaller(null);
    }, 1000);
  };

  // Delete a message
  const deleteMessage = async (messageId: string) => {
    if (!activeConversation) return;
    try {
      await apiFetch(`/api/chat/messages/${messageId}`, {
        method: "DELETE",
      });
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setShowMessageMenu(null);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }
  };

  // Delete a conversation
  const deleteConversation = async (conversationId: string) => {
    try {
      await apiFetch(`/api/chat/conversations/${conversationId}`, {
        method: "DELETE",
      });
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Failed to delete conversation");
    }
  };

  const getFileIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "image": return "🖼️";
      case "video": return "🎬";
      case "audio": return "🎵";
      case "document": return "📄";
      default: return "📎";
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    (u.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    u.id !== currentUser?.id
  );

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const canPostStories = (u: User | null) => {
    if (!u?.roleName) return false;
    const r = u.roleName.toUpperCase().replace(/[-\s]+/g, "_");
    return new Set([
      "SUPER_ADMIN",
      "CHAIRMAN",
      "CEO",
      "DIRECTOR",
      "CENTER_MANAGER",
      "CENTER_ADMIN",
      "ACADEMIC_MANAGER",
      "TEACHER",
      "STAFF",
    ]).has(r);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-gray-50" onClick={() => setShowReactionPicker(null)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-2xl">💬</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">LERA Connect</h1>
            <p className="text-emerald-100 text-sm">Stay connected with your team</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button className="relative p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all" title="Notifications">
            <span className="text-xl">🔔</span>
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
          
          {totalUnread > 0 && (
            <span className="bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold animate-pulse shadow-lg">
              {totalUnread} new
            </span>
          )}
          <button
            onClick={() => setShowNewGroupModal(true)}
            className="bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 backdrop-blur-sm border border-white/30"
          >
            <span>👥</span> New Group
          </button>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 font-semibold shadow-lg"
          >
            <span>✨</span> New Chat
          </button>
        </div>
      </div>

      {/* Stories Bar */}
      {currentUser && (
        <StoriesBar 
          onStoryClick={(userStories, index) => {
            setStoryViewerData({ userStories, index });
            setShowStoryViewer(true);
          }}
          onCreateClick={() => {
            setEditStory(null);
            setShowCreateStory(true);
          }}
          currentUserId={currentUser.id}
          users={userMap}
          allowCreate={canPostStories(currentUser)}
          refreshKey={storiesRefresh}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 bg-white border-r flex flex-col shadow-lg">
          {/* Tabs */}
          <div className="flex border-b bg-gray-50">
            <button
              onClick={() => setActiveTab("chats")}
              className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 ${
                activeTab === "chats"
                  ? "text-emerald-600 border-b-2 border-emerald-500 bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="mr-2">💬</span> Chats ({conversations.length})
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 ${
                activeTab === "groups"
                  ? "text-emerald-600 border-b-2 border-emerald-500 bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="mr-2">👥</span> Groups ({groups.length})
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b bg-gray-50/50">
            <div className="relative">
              <input
                type="text"
                placeholder={activeTab === "chats" ? "Search conversations..." : "Search groups..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-11 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
              </div>
            ) : activeTab === "chats" ? (
              filteredConversations.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl">💬</span>
                  </div>
                  <h3 className="text-gray-800 font-semibold mb-2">No conversations yet</h3>
                  <p className="text-gray-500 text-sm mb-4">Start chatting with your colleagues</p>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
                  >
                    Start a new chat →
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const { displayName, roleLabel } = resolveConversationDisplay(
                    conv,
                    userMap,
                    getCurrentUserId()
                  );

                  return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`flex items-center gap-4 p-4 cursor-pointer border-b hover:bg-gray-50 transition-all duration-200 group/conv ${
                      activeConversation?.id === conv.id ? "bg-emerald-50 border-l-4 border-l-emerald-500" : ""
                    }`}
                  >
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {displayName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      {conv.isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{displayName}</h3>
                          {roleLabel && (
                            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                              {roleLabel}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{formatTime(conv.lastMessageTime)}</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{conv.lastMessage || "No messages yet"}</p>
                    </div>
                    {(conv.unreadCount || 0) > 0 && (
                      <span className="bg-emerald-500 text-white text-xs min-w-[22px] h-[22px] rounded-full flex items-center justify-center font-semibold shadow">
                        {conv.unreadCount}
                      </span>
                    )}
                    
                    {/* Conversation status indicators */}
                    <div className="flex items-center gap-1">
                      {conv.isPinned && (
                        <span className="text-xs" title="Pinned">📌</span>
                      )}
                      {conv.isMuted && (
                        <span className="text-xs text-gray-400" title="Muted">🔕</span>
                      )}
                    </div>
                    
                    {/* Context menu button */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConversationMenu(showConversationMenu === conv.id ? null : conv.id);
                        }}
                        className="opacity-0 group-hover/conv:opacity-100 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                        title="More options"
                      >
                        ⋮
                      </button>
                      
                      {/* Context menu dropdown */}
                      {showConversationMenu === conv.id && (
                        <div 
                          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border z-50 py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => pinConversation(conv.id, !conv.isPinned)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <span>{conv.isPinned ? '📌' : '📍'}</span>
                            {conv.isPinned ? 'Unpin' : 'Pin to top'}
                          </button>
                          <button
                            onClick={() => muteConversation(conv.id, !conv.isMuted)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <span>{conv.isMuted ? '🔔' : '🔕'}</span>
                            {conv.isMuted ? 'Unmute' : 'Mute'}
                          </button>
                          <button
                            onClick={() => archiveConversation(conv.id, !conv.isArchived)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <span>📁</span>
                            {conv.isArchived ? 'Unarchive' : 'Archive'}
                          </button>
                          <hr className="my-2 border-gray-100" />
                          <button
                            onClick={() => {
                              setShowConversationMenu(null);
                              setShowDeleteConfirm({ type: 'conversation', id: conv.id });
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                          >
                            <span>🗑️</span>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )})
              )
            ) : (
              filteredGroups.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl">👥</span>
                  </div>
                  <h3 className="text-gray-800 font-semibold mb-2">No groups yet</h3>
                  <p className="text-gray-500 text-sm mb-4">Create a group to collaborate with your team</p>
                  <button
                    onClick={() => setShowNewGroupModal(true)}
                    className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
                  >
                    Create a new group →
                  </button>
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => selectGroup(group)}
                    className={`flex items-center gap-4 p-4 cursor-pointer border-b hover:bg-gray-50 transition-all duration-200 ${
                      activeConversation?.id === group.id ? "bg-purple-50 border-l-4 border-l-purple-500" : ""
                    }`}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      👥
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate mb-1">{group.name}</h3>
                      <p className="text-sm text-gray-500 truncate">
                        {group.memberCount} members {group.description ? `• ${group.description}` : ""}
                      </p>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-100">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b px-6 py-4 flex items-center gap-4 shadow-sm">
                {(() => {
                  const { displayName, roleLabel } = resolveConversationDisplay(
                    activeConversation,
                    userMap,
                    getCurrentUserId()
                  );

                  return (
                    <>
                      <div className={`w-12 h-12 ${
                        activeConversation.type === "GROUP" 
                          ? "bg-gradient-to-br from-purple-400 to-pink-500" 
                          : "bg-gradient-to-br from-emerald-400 to-teal-500"
                      } rounded-full flex items-center justify-center text-white font-bold shadow-md`}>
                        {activeConversation.type === "GROUP" ? "👥" : displayName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="font-bold text-gray-900 text-lg">{displayName}</h2>
                          {roleLabel && (
                            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                              {roleLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          {stompConnected && (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                              Live
                            </span>
                          )}
                          {activeConversation.type === "GROUP"
                            ? `${activeConversation.memberCount || 0} members`
                            : activeConversation.isOnline ? "🟢 Online" : "⚪ Offline"}
                        </p>
                      </div>
                    </>
                  );
                })()}
                <div className="flex items-center gap-2">
                  <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors" title="Search">🔍</button>
                  <button onClick={startCall} className="p-2.5 text-gray-500 hover:bg-emerald-100 hover:text-emerald-600 rounded-xl transition-colors" title="Voice Call">📞</button>
                  <button onClick={startVideoCall} className="p-2.5 text-gray-500 hover:bg-blue-100 hover:text-blue-600 rounded-xl transition-colors" title="Video Call">🎥</button>
                  <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors" title="More">⋮</button>
                </div>
              </div>

              {/* Messages */}
              <div 
                className="flex-1 overflow-y-auto p-6 space-y-4"
                style={{
                  background: "linear-gradient(135deg, #f0f4f8 0%, #e8f0f4 100%)",
                }}
              >
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center bg-white/90 px-8 py-6 rounded-2xl shadow-lg backdrop-blur-sm">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                        <span className="text-3xl">👋</span>
                      </div>
                      <h3 className="text-gray-800 font-semibold mb-2">Start the conversation</h3>
                      <p className="text-gray-500 text-sm">Send a message to begin chatting</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const currentUserId = getCurrentUserId();
                    const receiverLabel =
                      msg.senderName &&
                      msg.senderName !== "Unknown" &&
                      !SYNTHETIC_USER_NAME.test(msg.senderName)
                        ? msg.senderName
                        : resolveUserDisplayName(
                            msg.senderId,
                            userMap,
                            currentUserId,
                            currentUser,
                            activeConversation
                          );
                    const senderInitial = (
                      msg.isMine
                        ? resolveUserDisplayName(
                            currentUserId,
                            userMap,
                            currentUserId,
                            currentUser,
                            activeConversation
                          )
                        : receiverLabel
                    ).charAt(0).toUpperCase() || "?";
                    const actionBtnClass = msg.isMine
                      ? "p-1 rounded-full text-white/80 hover:bg-white/25 hover:text-white"
                      : "p-1 rounded-full text-gray-400 hover:bg-gray-100";

                    return (
                    <div
                      key={msg.id || index}
                      className={`flex items-end gap-2 group w-full ${msg.isMine ? "justify-end" : "justify-start"}`}
                    >
                      {!msg.isMine && (
                        <div
                          className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          title={receiverLabel}
                        >
                          {senderInitial}
                        </div>
                      )}
                      
                      <div
                        className={`flex items-end gap-1 max-w-[min(85%,42rem)] ${
                          msg.isMine ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div className="relative min-w-0 flex-1">
                        {/* Reaction picker dropdown */}
                        {showReactionPicker === msg.id && !msg.pending && (
                          <div className={`absolute ${msg.isMine ? 'right-0' : 'left-0'} -top-12 bg-white rounded-full shadow-xl border p-2 flex gap-1 z-20`}>
                            {reactionEmojis.map((emoji, idx) => (
                              <button
                                key={idx}
                                onClick={() => addReaction(msg.id, emoji)}
                                className="text-xl hover:scale-125 transition-transform p-1"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div
                          className={`min-w-[120px] rounded-2xl px-4 py-3 shadow-md ${
                            msg.pending ? "opacity-[0.88] " : ""
                          }${
                            msg.isMine
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-sm"
                              : "bg-white text-gray-900 rounded-bl-sm border border-gray-100"
                          }`}
                        >
                          {msg.messageType === "SYSTEM" ? (
                            <p className="text-xs text-center text-gray-500 italic">{msg.message}</p>
                          ) : (
                            <>
                              {/* Reply preview */}
                              {msg.replyToId && msg.replyPreview && (
                                <div className={`mb-2 p-2 rounded-lg border-l-4 ${
                                  msg.isMine 
                                    ? "bg-white/20 border-white/50" 
                                    : "bg-gray-100 border-emerald-400"
                                }`}>
                                  <p className={`text-xs ${msg.isMine ? "text-emerald-100" : "text-gray-500"}`}>
                                    ↩️ Reply
                                  </p>
                                  <p className={`text-sm truncate ${msg.isMine ? "text-white/80" : "text-gray-600"}`}>
                                    {msg.replyPreview}
                                  </p>
                                </div>
                              )}
                              
                              {/* Forwarded indicator */}
                              {msg.forwardedFromId && (
                                <p className={`text-xs mb-1 ${msg.isMine ? "text-emerald-100" : "text-gray-400"}`}>
                                  ↪️ Forwarded
                                </p>
                              )}
                              
                              {/* Show sender name for group chats or received messages */}
                              {!msg.isMine && activeConversation?.type === "GROUP" && (
                                <p className="text-xs font-semibold mb-1 text-emerald-600">
                                  {receiverLabel}
                                </p>
                              )}
                              {msg.attachmentUrl && (
                                <div className={`mb-2 p-3 rounded-lg ${msg.isMine ? "bg-white/20" : "bg-gray-100"}`}>
                                  <a 
                                    href={msg.attachmentUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 ${msg.isMine ? "text-white" : "text-emerald-600"} hover:underline`}
                                  >
                                    <span className="text-xl">{getFileIcon(msg.messageType)}</span>
                                    <span className="text-sm">View Attachment</span>
                                  </a>
                                </div>
                              )}
                              
                              {/* Audio/Voice message */}
                              {msg.messageType === "AUDIO" && msg.audioDurationSeconds && (
                                <div className={`flex items-center gap-2 mb-2 p-2 rounded-lg ${msg.isMine ? "bg-white/20" : "bg-gray-100"}`}>
                                  <button className="text-xl">🎵</button>
                                  <div className="flex-1 h-1 bg-gray-300 rounded-full">
                                    <div className="w-1/3 h-full bg-emerald-500 rounded-full"></div>
                                  </div>
                                  <span className={`text-xs ${msg.isMine ? "text-white" : "text-gray-500"}`}>
                                    {Math.floor(msg.audioDurationSeconds / 60)}:{(msg.audioDurationSeconds % 60).toString().padStart(2, '0')}
                                  </span>
                                </div>
                              )}
                              
                              <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                              <p className={`text-xs mt-2 flex items-center gap-1 ${msg.isMine ? "text-emerald-100 justify-end" : "text-gray-400 justify-start"}`}>
                                {msg.pending ? "…" : formatTime(msg.sentAt)}
                                {msg.editedAt && !msg.pending && (
                                  <span className="italic ml-1">(edited)</span>
                                )}
                                {msg.isMine && (
                                  <span className="ml-1">
                                    {msg.pending ? "Sending…" : msg.readAt ? "✓✓" : msg.deliveredAt ? "✓" : "🕐"}
                                  </span>
                                )}
                              </p>
                            </>
                          )}
                        </div>
                        
                        {/* Display reactions if any */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className={`flex gap-1 mt-1 ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                            {msg.reactions.map((r, idx) => (
                              <span key={idx} className="bg-white border rounded-full px-2 py-0.5 text-sm shadow-sm">
                                {r.emoji} {r.count > 1 && <span className="text-xs text-gray-500">{r.count}</span>}
                              </span>
                            ))}
                          </div>
                        )}
                        </div>

                        {!msg.pending && (
                        <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReplyTo(msg);
                            }}
                            className={`${actionBtnClass} hover:text-emerald-500`}
                            title="Reply"
                          >
                            ↩️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleForward(msg);
                            }}
                            className={`${actionBtnClass} hover:text-blue-500`}
                            title="Forward"
                          >
                            ↪️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id);
                            }}
                            className={actionBtnClass}
                            title="Add reaction"
                          >
                            😊
                          </button>
                          {msg.isMine && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditMessage(msg);
                                }}
                                className={`${actionBtnClass} hover:text-yellow-300`}
                                title="Edit message"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteConfirm({ type: "message", id: msg.id });
                                }}
                                className={`${actionBtnClass} hover:bg-red-500/30 hover:text-red-100`}
                                title="Delete message"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                        )}

                      </div>

                      {msg.isMine && (
                        <div
                          className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          title="You"
                        >
                          {senderInitial}
                        </div>
                      )}
                    </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                    title="Attach file"
                  >
                    {uploading ? "⏳" : "📎"}
                  </button>
                  
                  {/* Reply/Edit Preview Bar */}
                  {(replyingTo || editingMessage) && (
                    <div className="absolute -top-16 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm rounded-t-xl">
                      <div className={`w-1 h-10 rounded-full ${editingMessage ? 'bg-yellow-500' : 'bg-emerald-500'}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${editingMessage ? 'text-yellow-600' : 'text-emerald-600'}`}>
                          {editingMessage ? '✏️ Editing message' : `↩️ Reply to ${replyingTo?.senderName}`}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {editingMessage ? editingMessage.message : replyingTo?.message}
                        </p>
                      </div>
                      <button
                        onClick={() => editingMessage ? cancelEdit() : cancelReply()}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors" 
                      title="Emoji"
                    >
                      😊
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-14 left-0 bg-white rounded-xl shadow-xl border p-3 z-10">
                        <div className="grid grid-cols-6 gap-2">
                          {commonEmojis.map((emoji, idx) => (
                            <button
                              key={idx}
                              onClick={() => addEmoji(emoji)}
                              className="text-2xl hover:bg-gray-100 p-2 rounded-lg transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleMessageChange}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder={editingMessage ? "Edit your message..." : replyingTo ? `Reply to ${replyingTo.senderName}...` : "Type your message..."}
                    className="flex-1 px-5 py-3.5 bg-gray-100 rounded-full focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all duration-200 border border-transparent focus:border-emerald-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="p-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {sending ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <span className="text-lg">➤</span>
                    )}
                  </button>
                </div>
                {(remoteTypers.length > 0 || isTyping) && (
                  <div className="text-xs text-gray-400 mt-2 ml-2">
                    {remoteTypers.length > 0 ? (
                      <span>
                        {remoteTypers.length === 1
                          ? `${remoteTypers[0].displayName} is typing…`
                          : remoteTypers.length === 2
                            ? `${remoteTypers[0].displayName} and ${remoteTypers[1].displayName} are typing…`
                            : `${remoteTypers[0].displayName} and ${remoteTypers.length - 1} others are typing…`}
                        {isTyping ? " · You are typing too" : ""}
                      </span>
                    ) : (
                      <span>You are typing…</span>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
              <div className="text-center max-w-md px-8">
                <div className="w-40 h-40 mx-auto mb-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-2xl">
                  <span className="text-7xl">💬</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to LERA Connect</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Connect with your team, share files, and collaborate in real-time. 
                  Start a conversation or create a group to get started!
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl font-semibold"
                  >
                    <span>✨</span> New Chat
                  </button>
                  <button
                    onClick={() => setShowNewGroupModal(true)}
                    className="bg-white text-emerald-600 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 shadow-lg font-semibold border border-emerald-200"
                  >
                    <span>👥</span> New Group
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <h3 className="text-xl font-bold">New Conversation</h3>
              </div>
              <button 
                onClick={() => { setShowNewChatModal(false); setSearchTerm(""); }}
                className="text-white/80 hover:text-white text-2xl font-light transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 border-b bg-gray-50">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-11 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>

            <div className="overflow-y-auto max-h-96">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="font-medium">No users found</p>
                  <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => startNewConversation(user)}
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-emerald-50 border-b transition-all duration-200"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {(user.fullname || user.email)?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{user.fullname || user.name || "User"}</h4>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.roleName && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full mt-1 inline-block font-medium">
                          {user.roleName}
                        </span>
                      )}
                    </div>
                    <span className="text-emerald-500 text-xl">→</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Group Modal */}
      {showNewGroupModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <h3 className="text-xl font-bold">Create New Group</h3>
              </div>
              <button 
                onClick={() => { setShowNewGroupModal(false); setNewGroupName(""); setNewGroupDescription(""); setSelectedMembers([]); setSearchTerm(""); }}
                className="text-white/80 hover:text-white text-2xl font-light transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 border-b space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Group Name *</label>
                <input
                  type="text"
                  placeholder="Enter group name..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="What's this group about?"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Add Members *</label>
                <span className="text-sm text-purple-600 font-medium">{selectedMembers.length} selected</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users to add..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-11 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>

            <div className="overflow-y-auto max-h-64">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => toggleMemberSelection(user.id)}
                  className={`flex items-center gap-4 p-4 cursor-pointer border-b transition-all duration-200 ${
                    selectedMembers.includes(user.id) ? "bg-purple-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    selectedMembers.includes(user.id) 
                      ? "bg-purple-500 border-purple-500 text-white" 
                      : "border-gray-300"
                  }`}>
                    {selectedMembers.includes(user.id) && "✓"}
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow">
                    {(user.fullname || user.email)?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{user.fullname || user.name || "User"}</h4>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 border-t">
              <button
                onClick={createGroup}
                disabled={!newGroupName.trim() || selectedMembers.length === 0}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3.5 rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg"
              >
                Create Group ({selectedMembers.length} members)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Microphone / camera permission (replaces blocking browser alert) */}
      {mediaPermissionPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 flex items-center gap-3">
              <span className="text-2xl">{mediaPermissionPrompt.kind === "video" ? "🎥" : "🎙️"}</span>
              <h3 className="text-lg font-bold">
                {mediaPermissionPrompt.kind === "video"
                  ? "Camera & microphone needed"
                  : "Microphone access needed"}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-sm leading-relaxed">
                {mediaPermissionMessage(mediaPermissionPrompt.kind, mediaPermissionPrompt.issue)}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => void retryMediaPermission()}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => setMediaPermissionPrompt(null)}
                  className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Call Modal - Modern FaceTime-style */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <audio ref={remoteAudioRef} autoPlay playsInline className="sr-only" />
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent animate-pulse"></div>
            {/* Floating orbs */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative h-full flex flex-col items-center justify-center text-white p-6">
            {/* Caller Avatar with ring animation */}
            <div className="relative mb-8">
              {callStatus === 'calling' && (
                <>
                  <div className="absolute inset-0 w-40 h-40 rounded-full border-4 border-white/30 animate-ping"></div>
                  <div className="absolute inset-0 w-40 h-40 rounded-full border-2 border-white/50 animate-pulse"></div>
                </>
              )}
              {callStatus === 'connected' && (
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse blur-md"></div>
              )}
              <div className="relative w-40 h-40 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20">
                <span className="text-7xl">{activeConversation?.name?.charAt(0)?.toUpperCase() || "?"}</span>
              </div>
            </div>
            
            {/* Caller Info */}
            <h2 className="text-3xl font-bold mb-2 tracking-tight">{activeConversation?.name?.split(' (')[0]}</h2>
            <div className="flex items-center gap-2 mb-12">
              {callStatus === 'calling' && (
                <>
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></span>
                  <span className="text-lg text-gray-300">Calling...</span>
                </>
              )}
              {callStatus === 'connected' && (
                <>
                  <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-lg text-green-300">Connected • {formatCallDuration(callDuration)}</span>
                </>
              )}
              {callStatus === 'ended' && (
                <span className="text-lg text-red-300">Call Ended</span>
              )}
            </div>
            
            {/* Sound wave animation for connected calls */}
            {callStatus === 'connected' && !isMuted && (
              <div className="flex items-center gap-1.5 mb-12">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full"
                    style={{
                      animation: `soundWave 0.5s ease-in-out infinite`,
                      animationDelay: `${i * 0.1}s`,
                      height: '40px',
                    }}
                  ></div>
                ))}
              </div>
            )}
            
            {/* Muted indicator */}
            {callStatus === 'connected' && isMuted && (
              <div className="flex items-center gap-2 mb-12 px-4 py-2 bg-red-500/20 rounded-full border border-red-400/30">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
                <span className="text-red-300 text-sm font-medium">Microphone Muted</span>
              </div>
            )}
            
            {/* Call Controls */}
            <div className="flex items-center gap-6">
              <button 
                onClick={toggleMute}
                className={`w-16 h-16 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 border hover:scale-110 ${
                  isMuted 
                    ? 'bg-red-500/30 border-red-400/50 hover:bg-red-500/40' 
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
              
              <button 
                onClick={endCall}
                className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 border-4 border-red-400/30"
                title="End Call"
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              </button>
              
              <button 
                onClick={toggleSpeaker}
                className={`w-16 h-16 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 border hover:scale-110 ${
                  !isSpeakerOn 
                    ? 'bg-yellow-500/30 border-yellow-400/50 hover:bg-yellow-500/40' 
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                }`}
                title={isSpeakerOn ? "Speaker Off" : "Speaker On"}
              >
                {isSpeakerOn ? (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* CSS for sound wave animation */}
          <style jsx>{`
            @keyframes soundWave {
              0%, 100% { height: 10px; }
              50% { height: 40px; }
            }
          `}</style>
        </div>
      )}

      {/* Video Call Modal - Modern FaceTime-style */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black overflow-hidden">
          {/* Full screen video background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
            {/* Simulated remote video with animated gradient */}
            <div className="absolute inset-0 flex items-center justify-center">
              {callStatus === 'calling' ? (
                <div className="text-center animate-pulse">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 w-48 h-48 rounded-full border-4 border-blue-400/40 animate-ping"></div>
                    <div className="relative w-48 h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                      <span className="text-8xl">{activeConversation?.name?.charAt(0)?.toUpperCase() || "?"}</span>
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3">{activeConversation?.name?.split(' (')[0]}</h2>
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                    </div>
                    <span className="text-blue-300 text-lg ml-2">Connecting video...</span>
                  </div>
                </div>
              ) : callStatus === 'connected' ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-6 bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28" />
                    </svg>
                  </div>
                  <p className="text-2xl text-red-400 font-semibold">Call Ended</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Top bar with caller info */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-6">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center font-bold text-lg">
                  {activeConversation?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{activeConversation?.name?.split(' (')[0]}</h3>
                  <p className="text-sm text-gray-300 flex items-center gap-2">
                    {callStatus === 'connected' && (
                      <>
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Video Connected</span>
                      </>
                    )}
                    {callStatus === 'calling' && 'Connecting...'}
                    {callStatus === 'ended' && 'Ended'}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-300 flex items-center gap-2">
                {callStatus === 'connected' && (
                  <>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span>{formatCallDuration(callDuration)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Self video preview (bottom right) */}
          {callStatus === 'connected' && (
            <div className="absolute bottom-32 right-6 w-36 h-48 bg-black rounded-2xl shadow-2xl border-2 border-white/10 overflow-hidden group cursor-move hover:border-white/30 transition-all">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {/* Drag indicator */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          )}
          
          {/* Bottom controls bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8">
            <div className="flex items-center justify-center gap-5">
              {/* Flip Camera */}
              <button 
                className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 border border-white/10 hover:scale-110 group"
                title="Flip Camera"
              >
                <svg className="w-6 h-6 text-white group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              {/* Camera Toggle */}
              <button 
                onClick={toggleCamera}
                className={`w-14 h-14 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 border hover:scale-110 ${
                  !isCameraOn 
                    ? 'bg-red-500/30 border-red-400/50 hover:bg-red-500/40' 
                    : 'bg-white/10 border-white/10 hover:bg-white/20'
                }`}
                title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
              >
                {isCameraOn ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
              </button>
              
              {/* Mute */}
              <button 
                onClick={toggleMute}
                className={`w-14 h-14 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 border hover:scale-110 ${
                  isMuted 
                    ? 'bg-red-500/30 border-red-400/50 hover:bg-red-500/40' 
                    : 'bg-white/10 border-white/10 hover:bg-white/20'
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
              
              {/* End Call */}
              <button 
                onClick={endCall}
                className="w-18 h-18 px-8 py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 border-2 border-red-400/30"
                title="End Call"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              </button>
              
              {/* Screen Share */}
              <button 
                className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 border border-white/10 hover:scale-110"
                title="Share Screen"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              
              {/* Effects */}
              <button 
                className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 border border-white/10 hover:scale-110"
                title="Effects"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      {showIncomingCall && incomingCaller && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent animate-pulse"></div>
            {/* Floating orbs */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-teal-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative h-full flex flex-col items-center justify-center text-white p-6">
            {/* Incoming call type indicator */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              {incomingCallType === 'video' ? (
                <>
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Incoming Video Call</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm font-medium">Incoming Voice Call</span>
                </>
              )}
            </div>
            
            {/* Caller Avatar with ring animation */}
            <div className="relative mb-8">
              <div className="absolute inset-0 w-44 h-44 rounded-full border-4 border-emerald-400/40 animate-ping"></div>
              <div className="absolute inset-0 w-44 h-44 rounded-full border-2 border-emerald-300/60 animate-pulse"></div>
              <div className="absolute -inset-4 rounded-full border-2 border-white/20 animate-pulse delay-500"></div>
              <div className="relative w-44 h-44 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20">
                <span className="text-8xl">{incomingCaller.name?.charAt(0)?.toUpperCase() || "?"}</span>
              </div>
            </div>
            
            {/* Caller Info */}
            <h2 className="text-4xl font-bold mb-3 tracking-tight">{incomingCaller.name}</h2>
            <div className="flex items-center gap-2 mb-16">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
              </div>
              <span className="text-lg text-emerald-300 ml-2">Incoming call...</span>
            </div>
            
            {/* Accept/Reject Buttons */}
            <div className="flex items-center gap-12">
              {/* Reject Button */}
              <div className="flex flex-col items-center gap-3">
                <button 
                  onClick={rejectCall}
                  className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 border-4 border-red-400/30"
                  title="Reject Call"
                >
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                </button>
                <span className="text-sm text-gray-300 font-medium">Decline</span>
              </div>
              
              {/* Accept Button */}
              <div className="flex flex-col items-center gap-3">
                <button 
                  onClick={acceptCall}
                  className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 border-4 border-green-400/30 animate-pulse"
                  title="Accept Call"
                >
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <span className="text-sm text-gray-300 font-medium">Accept</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forward Message Modal */}
      {showForwardModal && forwardingMessage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">↪️</span>
                <h3 className="text-xl font-bold">Forward Message</h3>
              </div>
              <button 
                onClick={() => { setShowForwardModal(false); setForwardingMessage(null); }}
                className="text-white/80 hover:text-white text-2xl font-light transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Message preview */}
            <div className="p-4 bg-gray-50 border-b">
              <p className="text-xs text-gray-500 mb-1">Message to forward:</p>
              <p className="text-sm text-gray-700 line-clamp-3">{forwardingMessage.message}</p>
            </div>

            <div className="p-4 border-b">
              <p className="text-sm font-semibold text-gray-700 mb-2">Select conversations to forward to:</p>
            </div>

            <div className="overflow-y-auto max-h-72">
              {conversations.filter(c => c.id !== activeConversation?.id).map((conv) => {
                const { displayName } = resolveConversationDisplay(
                  conv,
                  userMap,
                  getCurrentUserId()
                );
                return (
                  <div
                    key={conv.id}
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-blue-50 border-b transition-all duration-200"
                  >
                    <input
                      type="checkbox"
                      id={`forward-${conv.id}`}
                      className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`forward-${conv.id}`} className="flex items-center gap-3 flex-1 cursor-pointer">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {displayName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="font-semibold text-gray-900">{displayName}</span>
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => { setShowForwardModal(false); setForwardingMessage(null); }}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const checked = Array.from(document.querySelectorAll<HTMLInputElement>('input[id^="forward-"]:checked'))
                    .map(el => el.id.replace('forward-', ''));
                  if (checked.length > 0) {
                    confirmForward(checked);
                  } else {
                    alert('Please select at least one conversation');
                  }
                }}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
              >
                Forward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🗑️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Delete {showDeleteConfirm.type === 'message' ? 'Message' : 'Conversation'}?
              </h3>
              <p className="text-gray-500 mb-6">
                {showDeleteConfirm.type === 'message' 
                  ? 'This message will be permanently deleted.' 
                  : 'This conversation and all its messages will be permanently deleted.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm.type === 'message') {
                      deleteMessage(showDeleteConfirm.id);
                    } else {
                      deleteConversation(showDeleteConfirm.id);
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {showStoryViewer && storyViewerData && currentUser && (
        <StoryViewer
          userStories={storyViewerData.userStories}
          initialUserIndex={storyViewerData.index}
          onClose={() => {
            setShowStoryViewer(false);
            setStoryViewerData(null);
          }}
          currentUserId={currentUser.id}
          onEditStory={
            canPostStories(currentUser)
              ? (story) => {
                  setShowStoryViewer(false);
                  setStoryViewerData(null);
                  setEditStory(story);
                  setShowCreateStory(true);
                }
              : undefined
          }
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && currentUser && (
        <CreateStoryModal
          onClose={() => {
            setShowCreateStory(false);
            setEditStory(null);
          }}
          onCreated={() => {
            setShowCreateStory(false);
            setEditStory(null);
            setStoriesRefresh((k) => k + 1);
          }}
          userId={currentUser.id}
          initialStory={editStory}
        />
      )}
    </div>
  );
}
