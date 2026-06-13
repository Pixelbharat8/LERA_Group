"use client";

import { Client, IMessage } from "@stomp/stompjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type StompChatPayload = {
  id?: string;
  conversationId?: string;
  senderId?: string;
  senderName?: string;
  message?: string;
  messageType?: string;
  attachmentUrl?: string;
  replyToId?: string;
  replyPreview?: string;
  forwardedFromId?: string;
  sentAt?: string;
  isRead?: boolean;
  error?: string;
};

export type StompTypingPayload = {
  conversationId?: string;
  userId?: string;
  userName?: string;
  isTyping?: boolean;
  timestamp?: string;
};

/** WebRTC signaling + server-issued ring frames on `/topic/webrtc/{conversationId}` */
export type StompWebrtcPayload = {
  type?: string;
  callId?: string;
  conversationId?: string;
  callerId?: string;
  callType?: string;
  sdp?: string;
  candidate?: RTCIceCandidateInit;
  fromUserId?: string;
  timestamp?: string;
};

type UseConnectStompOptions = {
  conversationId: string | null;
  enabled: boolean;
  onChatMessage: (payload: StompChatPayload) => void;
  /** When set, subscribes to `/topic/typing/{conversationId}` */
  onTyping?: (payload: StompTypingPayload) => void;
  /** Required for outbound typing frames (must match JWT user). */
  typingIdentity?: { userId: string; userName: string } | null;
  /**
   * Subscribe to `/topic/webrtc/{id}` for each id (e.g. all loaded conversations)
   * so incoming calls are received even when another chat is focused.
   */
  webrtcConversationIds?: string[];
  onWebrtc?: (payload: StompWebrtcPayload) => void;
};

/**
 * Subscribes to /topic/chat/{conversationId} when a conversation is open.
 * Optionally subscribes to typing indicators and exposes publishTyping for /app/typing/{id}.
 * Falls back silently if WebSocket auth is unavailable (polling remains active).
 */
export function useConnectStomp({
  conversationId,
  enabled,
  onChatMessage,
  onTyping,
  typingIdentity,
  webrtcConversationIds,
  onWebrtc,
}: UseConnectStompOptions) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  const onMessageRef = useRef(onChatMessage);
  onMessageRef.current = onChatMessage;

  const onTypingRef = useRef(onTyping);
  onTypingRef.current = onTyping;

  const typingIdentityRef = useRef(typingIdentity);
  typingIdentityRef.current = typingIdentity;

  const onWebrtcRef = useRef(onWebrtc);
  onWebrtcRef.current = onWebrtc;

  const webrtcSubKey = useMemo(
    () => Array.from(new Set((webrtcConversationIds ?? []).filter(Boolean))).sort().join(","),
    [webrtcConversationIds]
  );

  const handleChatFrame = useCallback((message: IMessage) => {
    try {
      const body = JSON.parse(message.body) as StompChatPayload;
      if (body.error) return;
      onMessageRef.current(body);
    } catch {
      // ignore malformed frames
    }
  }, []);

  const handleTypingFrame = useCallback((message: IMessage) => {
    const handler = onTypingRef.current;
    if (!handler) return;
    try {
      const body = JSON.parse(message.body) as StompTypingPayload;
      handler(body);
    } catch {
      // ignore malformed frames
    }
  }, []);

  const handleWebrtcFrame = useCallback((message: IMessage) => {
    const handler = onWebrtcRef.current;
    if (!handler) return;
    try {
      const body = JSON.parse(message.body) as StompWebrtcPayload;
      handler(body);
    } catch {
      // ignore malformed frames
    }
  }, []);

  const publishTyping = useCallback((isTyping: boolean) => {
    const client = clientRef.current;
    const cid = conversationIdRef.current;
    const idty = typingIdentityRef.current;
    if (!client?.connected || !cid || !idty?.userId) return;
    try {
      client.publish({
        destination: `/app/typing/${cid}`,
        body: JSON.stringify({
          userId: idty.userId,
          userName: idty.userName ?? "",
          isTyping,
        }),
      });
    } catch {
      // ignore send failures
    }
  }, []);

  const publishWebrtc = useCallback((targetConversationId: string, payload: Record<string, unknown>) => {
    const client = clientRef.current;
    const idty = typingIdentityRef.current;
    if (!client?.connected || !targetConversationId?.trim() || !idty?.userId) return;
    try {
      client.publish({
        destination: `/app/webrtc/${targetConversationId.trim()}`,
        body: JSON.stringify({
          ...payload,
          userId: idty.userId,
        }),
      });
    } catch {
      // ignore send failures
    }
  }, []);

  useEffect(() => {
    if (!enabled || !conversationId || typeof window === "undefined") {
      setConnected(false);
      return;
    }

    let cancelled = false;
    let client: Client | null = null;

    const connect = async () => {
      try {
        const res = await fetch("/api/chat/ws-url", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { url?: string };
        if (!data.url || cancelled) return;

        client = new Client({
          brokerURL: data.url,
          reconnectDelay: 8000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          onConnect: () => {
            if (cancelled || !client) return;
            setConnected(true);
            client.subscribe(`/topic/chat/${conversationId}`, handleChatFrame);
            if (onTypingRef.current) {
              client.subscribe(`/topic/typing/${conversationId}`, handleTypingFrame);
            }
            if (onWebrtcRef.current && webrtcSubKey) {
              for (const wid of webrtcSubKey.split(",")) {
                if (wid) client.subscribe(`/topic/webrtc/${wid}`, handleWebrtcFrame);
              }
            }
          },
          onDisconnect: () => {
            if (!cancelled) setConnected(false);
          },
          onStompError: () => {
            if (!cancelled) setConnected(false);
          },
          onWebSocketClose: () => {
            if (!cancelled) setConnected(false);
          },
        });

        clientRef.current = client;
        client.activate();
      } catch {
        if (!cancelled) setConnected(false);
      }
    };

    void connect();

    return () => {
      cancelled = true;
      setConnected(false);
      if (client) {
        try {
          client.deactivate();
        } catch {
          // ignore teardown errors
        }
      }
      clientRef.current = null;
    };
  }, [conversationId, enabled, handleChatFrame, handleTypingFrame, handleWebrtcFrame, webrtcSubKey]);

  return { connected, publishTyping, publishWebrtc };
}
