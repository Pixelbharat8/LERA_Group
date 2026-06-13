# LERA Connect vs Signal/Telegram/Zalo - Feature Comparison & Improvement Plan

## ✅ IMPLEMENTATION STATUS - January 7, 2026

### Implemented Features:

| Feature | Status | Notes |
|---------|--------|-------|
| **Reply to Message** | ✅ Done | Backend + Frontend UI |
| **Forward Message** | ✅ Done | Backend + Modal UI |
| **Edit Message** | ✅ Done | Backend + Frontend UI |
| **Block/Unblock Users** | ✅ Done | Full CRUD API |
| **Archive Conversations** | ✅ Done | Backend + Context Menu |
| **Mute Conversations** | ✅ Done | With duration option |
| **Pin Conversations** | ✅ Done | With ordering |
| **Read Receipts UI** | ✅ Done | ✓✓ indicators |
| **Delivery Status** | ✅ Done | 🕐/✓/✓✓ icons |
| **Voice Message Support** | ✅ Done | Backend schema ready |
| **Message Edited Indicator** | ✅ Done | Shows "(edited)" |
| **Forwarded Indicator** | ✅ Done | Shows "↪️ Forwarded" |
| **WebSocket Infrastructure** | ✅ Done | STOMP endpoints |
| **Database Schema** | ✅ Done | All new tables/columns |

### New Backend Endpoints:
- `POST /api/chat/messages/{id}/reply` - Reply to message
- `POST /api/chat/messages/{id}/forward` - Forward message
- `PUT /api/chat/messages/{id}` - Edit message
- `POST /api/chat/users/block` - Block user
- `DELETE /api/chat/users/block` - Unblock user
- `GET /api/chat/users/{id}/blocked` - Get blocked users
- `PUT /api/chat/conversations/{id}/archive` - Archive/unarchive
- `PUT /api/chat/conversations/{id}/mute` - Mute/unmute
- `PUT /api/chat/conversations/{id}/pin` - Pin/unpin

### New Database Tables:
- `blocked_users` - Track blocked relationships
- `user_conversation_prefs` - Archive/mute/pin preferences

### New Database Columns (chat_messages):
- `reply_to_id` - Reference to replied message
- `reply_preview` - Preview text of replied message
- `delivered_at` - Delivery timestamp
- `forwarded_from_id` - Reference to original message
- `audio_duration_seconds` - For voice messages
- `audio_waveform` - Waveform data for voice UI

---

## Executive Summary

This document compares LERA Connect with industry-leading messaging apps (Signal, Telegram, Zalo) to identify feature gaps and create a prioritized improvement roadmap.

---

## 1. Feature Comparison Matrix

| Feature | Signal | Telegram | Zalo | LERA Connect | Gap Status |
|---------|--------|----------|------|--------------|------------|
| **Core Messaging** |
| Text messages | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| Direct messages (1:1) | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| Group chats | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| Message search | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| Delete messages | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| **Real-time Features** |
| WebSocket/Real-time updates | ✅ | ✅ | ✅ | ❌ Polling | 🔴 Critical Gap |
| Typing indicators | ✅ | ✅ | ✅ | ⚠️ Local only | 🟡 Partial |
| Online/Offline status | ✅ | ✅ | ✅ | ⚠️ Static | 🟡 Partial |
| Read receipts (✓✓) | ✅ | ✅ | ✅ | ⚠️ No UI | 🟡 Partial |
| Delivery status | ✅ | ✅ | ✅ | ❌ | 🔴 Gap |
| **Media & Attachments** |
| Image sharing | ✅ | ✅ | ✅ | ⚠️ Basic | 🟡 Partial |
| Video sharing | ✅ | ✅ | ✅ | ⚠️ Basic | 🟡 Partial |
| File sharing | ✅ | ✅ | ✅ | ⚠️ Basic | 🟡 Partial |
| Voice messages | ✅ | ✅ | ✅ | ❌ | 🔴 Gap |
| Stickers | ❌ | ✅ | ✅ | ❌ | 🟡 Nice-to-have |
| GIFs | ❌ | ✅ | ✅ | ❌ | 🟡 Nice-to-have |
| **Message Actions** |
| Reply to message | ✅ | ✅ | ✅ | ❌ | 🔴 Gap |
| Forward message | ✅ | ✅ | ✅ | ❌ | 🟡 Gap |
| Edit message | ❌ | ✅ | ❌ | ❌ | 🟡 Nice-to-have |
| React with emoji | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| Pin message | ❌ | ✅ | ✅ | ❌ | 🟡 Nice-to-have |
| **Voice/Video Calls** |
| Voice calls | ✅ | ✅ | ✅ | ✅ Simulated | 🟡 Needs WebRTC |
| Video calls | ✅ | ✅ | ✅ | ✅ Simulated | 🟡 Needs WebRTC |
| Group calls | ✅ | ✅ | ✅ | ❌ | 🔴 Gap |
| Screen sharing | ❌ | ✅ | ❌ | ❌ | 🟡 Nice-to-have |
| **Organization Features** |
| Archive chats | ✅ | ✅ | ✅ | ❌ | 🟡 Gap |
| Mute notifications | ✅ | ✅ | ✅ | ❌ | 🟡 Gap |
| Pin chats | ✅ | ✅ | ✅ | ❌ | 🟡 Gap |
| Chat folders/categories | ❌ | ✅ | ❌ | ❌ | 🟡 Nice-to-have |
| **Privacy & Security** |
| End-to-end encryption | ✅ | ⚠️ Optional | ⚠️ Basic | ❌ | 🟡 Enterprise consideration |
| Disappearing messages | ✅ | ✅ | ❌ | ❌ | 🟡 Nice-to-have |
| Block users | ✅ | ✅ | ✅ | ❌ | 🔴 Gap |
| Report messages | ✅ | ✅ | ✅ | ❌ | 🟡 Gap |
| **Push Notifications** |
| Browser notifications | ✅ | ✅ | ✅ | ⚠️ Basic | 🟡 Partial |
| Mobile push | ✅ | ✅ | ✅ | ❌ N/A (web) | N/A |
| **Special Features (Telegram)** |
| Channels (broadcast) | ❌ | ✅ | ❌ | ❌ | 🟡 Nice-to-have |
| Bots | ❌ | ✅ | ❌ | ❌ | 🟡 Future |
| Scheduled messages | ❌ | ✅ | ❌ | ❌ | 🟡 Nice-to-have |
| **Special Features (Zalo)** |
| Stories/Moments | ❌ | ❌ | ✅ | ❌ | ❌ Not relevant |
| Mini-apps | ❌ | ❌ | ✅ | ❌ | ❌ Not relevant |

---

## 2. LERA Connect Current Architecture

### What LERA Connect Has:
```
┌─────────────────────────────────────────────────────────────┐
│                    LERA Connect Frontend                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ Conversations│ │   Groups    │ │     Chat Messages      ││
│  │    List     │ │    List     │ │  + Reactions + Emoji   ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │         Voice/Video Calls (Simulated - Local)          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (Polling every 3s)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Connect Service (Port 8086)                 │
│  ┌───────────────────┐  ┌───────────────────────────────┐  │
│  │  ChatController   │  │       CallController          │  │
│  │  - conversations  │  │   - initiate/answer/end       │  │
│  │  - messages       │  │   - in-memory sessions        │  │
│  │  - reactions      │  │                               │  │
│  └───────────────────┘  └───────────────────────────────┘  │
│  ┌───────────────────┐  ┌───────────────────────────────┐  │
│  │  GroupController  │  │   NotificationController      │  │
│  └───────────────────┘  └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     PostgreSQL Database
              (conversations, chat_messages, groups)
```

### Current Limitations:
1. **Polling-based updates** - 3-second delay for new messages
2. **No true P2P calls** - Voice/video is local simulation only
3. **No message threading** - Can't reply to specific messages
4. **No offline support** - Requires constant connection
5. **No push notifications** - Browser-only, manual refresh

---

## 3. Improvement Plan (Prioritized)

### Phase 1: Critical Gaps (1-2 weeks)

#### 1.1 Real-time Messaging with WebSocket
**Priority: 🔴 CRITICAL**

```java
// Backend: Add WebSocket support
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOrigins("*").withSockJS();
    }
}
```

```typescript
// Frontend: WebSocket connection
const socket = new SockJS('/ws');
const stompClient = Stomp.over(socket);
stompClient.subscribe(`/topic/conversation/${conversationId}`, (message) => {
    const newMsg = JSON.parse(message.body);
    setMessages(prev => [...prev, newMsg]);
});
```

**Benefits:**
- Instant message delivery
- Real typing indicators
- Live online status
- Battery/bandwidth efficient

#### 1.2 Reply to Message
**Priority: 🔴 HIGH**

```sql
-- Database: Add reply_to_id column
ALTER TABLE chat_messages ADD COLUMN reply_to_id UUID REFERENCES chat_messages(id);
ALTER TABLE chat_messages ADD COLUMN reply_preview TEXT;
```

```typescript
// Frontend: Reply UI
const [replyingTo, setReplyingTo] = useState<Message | null>(null);

// Show reply preview above input
{replyingTo && (
  <div className="bg-gray-100 p-2 border-l-4 border-blue-500">
    <span className="font-medium">{replyingTo.senderName}</span>
    <p className="text-sm truncate">{replyingTo.message}</p>
    <button onClick={() => setReplyingTo(null)}>✕</button>
  </div>
)}
```

#### 1.3 Delivery & Read Receipts UI
**Priority: 🔴 HIGH**

```typescript
// Message status icons
const MessageStatus = ({ message, isLast }) => {
  if (!message.isMine) return null;
  
  return (
    <span className="text-xs ml-1">
      {message.deliveredAt && !message.readAt && '✓'}  {/* Delivered */}
      {message.readAt && '✓✓'}                          {/* Read */}
      {!message.deliveredAt && '🕐'}                    {/* Pending */}
    </span>
  );
};
```

#### 1.4 Block Users
**Priority: 🔴 HIGH**

```sql
-- Database: Blocked users table
CREATE TABLE blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES users(id),
    blocked_id UUID NOT NULL REFERENCES users(id),
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blocker_id, blocked_id)
);
```

---

### Phase 2: Important Features (2-4 weeks)

#### 2.1 Voice Messages
**Priority: 🟡 MEDIUM**

```typescript
// Frontend: Voice recorder
const VoiceRecorder = () => {
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    
    mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      uploadVoiceMessage(blob);
    };
    
    mediaRecorder.current.start();
    setRecording(true);
  };
  
  return (
    <button onMouseDown={startRecording} onMouseUp={stopRecording}>
      🎤 {recording ? 'Recording...' : 'Hold to record'}
    </button>
  );
};
```

#### 2.2 Forward Messages
**Priority: 🟡 MEDIUM**

```typescript
const forwardMessage = async (messageId: string, toConversationIds: string[]) => {
  await apiFetch('/api/chat/messages/forward', {
    method: 'POST',
    body: JSON.stringify({ messageId, toConversationIds })
  });
};
```

#### 2.3 Archive/Mute/Pin Chats
**Priority: 🟡 MEDIUM**

```sql
-- Database: User conversation preferences
CREATE TABLE user_conversation_prefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    is_archived BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    muted_until TIMESTAMP,
    UNIQUE(user_id, conversation_id)
);
```

#### 2.4 True WebRTC Calls
**Priority: 🟡 MEDIUM**

```
Architecture for Real Calls:
┌──────────┐         ┌──────────────┐         ┌──────────┐
│  User A  │◄───────►│  Signaling   │◄───────►│  User B  │
│          │         │   Server     │         │          │
│  WebRTC  │         │  (WebSocket) │         │  WebRTC  │
└──────────┘         └──────────────┘         └──────────┘
      │                                              │
      │         ICE Candidates Exchange              │
      │◄────────────────────────────────────────────►│
      │                                              │
      │              P2P Media Stream                │
      │◄════════════════════════════════════════════►│
```

**Required Components:**
- STUN server (can use Google's: stun:stun.l.google.com:19302)
- TURN server (for NAT traversal - Coturn or Twilio)
- WebSocket signaling for offer/answer/ICE exchange

---

### Phase 3: Nice-to-Have Features (1-2 months)

#### 3.1 Stickers & GIFs
- Integrate GIPHY API for GIF search
- Create custom sticker packs for LERA Academy

#### 3.2 Message Editing
- Allow editing within 15-minute window
- Show "edited" indicator

#### 3.3 Scheduled Messages
- Schedule messages for future delivery
- Useful for reminders to students/parents

#### 3.4 Chat Folders
- Organize chats by category (Students, Parents, Staff)
- Auto-categorization based on user roles

#### 3.5 Disappearing Messages
- Self-destructing messages after X hours/days
- Useful for sensitive information

---

## 4. Technical Implementation Roadmap

### Database Schema Additions

```sql
-- Phase 1: Reply support
ALTER TABLE chat_messages ADD COLUMN reply_to_id UUID REFERENCES chat_messages(id);
ALTER TABLE chat_messages ADD COLUMN delivered_at TIMESTAMP;

-- Phase 1: Block users
CREATE TABLE blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID REFERENCES users(id),
    blocked_id UUID REFERENCES users(id),
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phase 2: User preferences
CREATE TABLE user_conversation_prefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    conversation_id UUID REFERENCES conversations(id),
    is_archived BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    pin_order INT DEFAULT 0
);

-- Phase 2: Voice messages
ALTER TABLE chat_messages ADD COLUMN audio_duration_seconds INT;
ALTER TABLE chat_messages ADD COLUMN audio_waveform JSONB;

-- Phase 3: Message edits
ALTER TABLE chat_messages ADD COLUMN edited_at TIMESTAMP;
ALTER TABLE chat_messages ADD COLUMN original_message TEXT;
```

### Backend Dependencies to Add

```xml
<!-- pom.xml additions for Connect Service -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-messaging</artifactId>
</dependency>
```

### Frontend Dependencies to Add

```json
// package.json additions
{
  "dependencies": {
    "sockjs-client": "^1.6.1",
    "@stomp/stompjs": "^7.0.0",
    "simple-peer": "^9.11.1"  // For WebRTC
  }
}
```

---

## 5. Competitive Advantage for LERA Connect

While Signal/Telegram/Zalo are general-purpose, LERA Connect should focus on **education-specific features**:

| LERA-Specific Feature | Description | Unique Value |
|----------------------|-------------|--------------|
| **Role-based visibility** | Teachers only see their students/parents | ✅ Implemented |
| **Class group chats** | Auto-created for each class | 🟡 Possible |
| **Homework sharing** | Share assignments directly | 🟡 Future |
| **Parent-Teacher meetings** | Schedule video calls | 🟡 Future |
| **Attendance notifications** | Auto-alert parents | 🟡 Future |
| **Grade announcements** | Broadcast exam results | 🟡 Future |
| **AI Tutor integration** | Chat with AI for help | 🟡 Future |
| **Content moderation** | Filter inappropriate content | 🟡 Future |

---

## 6. Summary: Priority Action Items

### Immediate (This Week):
1. ✅ **Chat filtering by participant** - DONE
2. ✅ **Conversation validation** - DONE
3. 🔴 **Add WebSocket for real-time** - HIGH PRIORITY

### Short-term (2 weeks):
4. 🔴 Reply to message feature
5. 🔴 Read receipt UI (✓✓ indicators)
6. 🔴 Block user functionality
7. 🟡 Voice message recording

### Medium-term (1 month):
8. 🟡 True WebRTC calls (not simulated)
9. 🟡 Archive/Mute/Pin chats
10. 🟡 Forward messages

### Long-term (2+ months):
11. 🟡 Education-specific features (class groups, homework, etc.)
12. 🟡 Stickers and GIFs
13. 🟡 Message scheduling
14. 🟡 End-to-end encryption (enterprise consideration)

---

## 7. Effort Estimation

| Feature | Backend | Frontend | Testing | Total |
|---------|---------|----------|---------|-------|
| WebSocket real-time | 3 days | 2 days | 1 day | **6 days** |
| Reply to message | 1 day | 2 days | 0.5 day | **3.5 days** |
| Read receipts UI | 0.5 day | 1 day | 0.5 day | **2 days** |
| Block users | 1 day | 1 day | 0.5 day | **2.5 days** |
| Voice messages | 1 day | 2 days | 1 day | **4 days** |
| WebRTC calls | 5 days | 4 days | 2 days | **11 days** |
| Archive/Mute/Pin | 1 day | 2 days | 0.5 day | **3.5 days** |

**Total Phase 1+2 Estimate: ~32 days**

---

*Document Created: January 7, 2026*
*Author: GitHub Copilot*
*Version: 1.0*
