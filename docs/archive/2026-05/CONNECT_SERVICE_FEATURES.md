# Connect Service - Social Media Features Implementation

## Overview

The LERA Connect service has been enhanced with best-in-class features inspired by major messaging platforms:

| Platform | Key Feature Adopted |
|----------|-------------------|
| **Telegram** | Polls/Quizzes with anonymous voting, real-time updates |
| **WeChat/Zalo** | Group messaging, multimedia sharing |
| **Teams** | Professional channels, presence indicators |
| **Signal** | Privacy-focused read receipts |
| **WhatsApp/iMessage** | Message reactions with emoji |

---

## New Features Implemented

### 1. WebSocket Real-Time Messaging ⚡

**Files Created:**
- `config/WebSocketConfig.java` - STOMP WebSocket configuration
- `controller/WebSocketChatController.java` - Real-time message handling

**Endpoints:**
```
WebSocket: ws://localhost:8086/ws/chat

Message Topics:
- /topic/chat/{conversationId} - Receive messages for a conversation
- /user/queue/messages - Personal messages
- /topic/user/{userId}/status - User online/offline status
- /topic/chat/{conversationId}/typing - Typing indicators
```

**Message Mappings:**
| Destination | Purpose |
|------------|---------|
| `/app/chat/{conversationId}` | Send message to conversation |
| `/app/typing/{conversationId}` | Send typing indicator |
| `/app/read/{conversationId}` | Send read receipt |
| `/app/reaction/{conversationId}` | Add emoji reaction |
| `/app/presence` | Update online/offline status |

---

### 2. Telegram-Style Polls & Quizzes 📊

**Files Created:**
- `entity/ChatPoll.java` - Poll entity
- `entity/ChatPollOption.java` - Poll options
- `entity/ChatPollVote.java` - Vote tracking
- `repository/ChatPollRepository.java`
- `repository/ChatPollOptionRepository.java`
- `repository/ChatPollVoteRepository.java`
- `controller/PollController.java` - Full REST API

**Poll Types:**
- **SINGLE** - Single choice poll
- **MULTIPLE** - Multiple choice poll
- **QUIZ** - Quiz with correct answer (revealed after voting/close)

**REST API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat/polls` | Create poll |
| GET | `/api/chat/polls/{pollId}` | Get poll details |
| GET | `/api/chat/polls/conversation/{id}` | Get conversation polls |
| POST | `/api/chat/polls/vote` | Vote on poll |
| POST | `/api/chat/polls/{pollId}/close` | Close poll |
| DELETE | `/api/chat/polls/{pollId}` | Delete poll |

**Sample Create Poll Request:**
```json
{
  "conversationId": "uuid",
  "question": "What time works best for the meeting?",
  "options": ["9 AM", "10 AM", "2 PM", "3 PM"],
  "pollType": "SINGLE",
  "isAnonymous": false,
  "expiresAt": "2024-01-10T18:00:00"
}
```

**For Quiz Mode:**
```json
{
  "conversationId": "uuid",
  "question": "What is 2 + 2?",
  "options": ["3", "4", "5", "6"],
  "pollType": "QUIZ",
  "correctOption": 1,
  "isAnonymous": true
}
```

---

### 3. Message Reactions 👍❤️😂

**Files Created:**
- `entity/ChatMessageReaction.java` - Reaction entity
- `repository/ChatMessageReactionRepository.java`
- `controller/ReactionController.java` - Full REST API

**Supported Emojis:**
```
👍 👎 ❤️ 😂 😮 😢 😡 🎉 🔥 💯
```

**REST API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat/reactions` | Add/toggle reaction |
| GET | `/api/chat/reactions/message/{messageId}` | Get message reactions |
| POST | `/api/chat/reactions/batch` | Get reactions for multiple messages |
| DELETE | `/api/chat/reactions/{messageId}/{emoji}` | Remove specific reaction |
| GET | `/api/chat/reactions/emojis` | Get supported emojis |

**Toggle Behavior (like iMessage):**
- First tap: Add reaction
- Second tap on same emoji: Remove reaction

---

## Database Schema

### New Tables

```sql
-- Polls
CREATE TABLE chat_polls (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL,
    created_by UUID NOT NULL,
    question VARCHAR(500) NOT NULL,
    poll_type VARCHAR(20) DEFAULT 'SINGLE',
    correct_option INTEGER,
    is_anonymous BOOLEAN DEFAULT FALSE,
    allows_multiple BOOLEAN DEFAULT FALSE,
    is_closed BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    closed_at TIMESTAMP
);

-- Poll Options
CREATE TABLE chat_poll_options (
    id UUID PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES chat_polls(id),
    option_index INTEGER NOT NULL,
    option_text VARCHAR(200) NOT NULL,
    vote_count INTEGER DEFAULT 0
);

-- Poll Votes
CREATE TABLE chat_poll_votes (
    id UUID PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES chat_polls(id),
    option_id UUID NOT NULL REFERENCES chat_poll_options(id),
    user_id UUID NOT NULL,
    voted_at TIMESTAMP NOT NULL,
    UNIQUE(poll_id, user_id, option_id)
);

-- Message Reactions
CREATE TABLE chat_message_reactions (
    id UUID PRIMARY KEY,
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    reacted_at TIMESTAMP NOT NULL,
    UNIQUE(message_id, user_id, emoji)
);
```

---

## Frontend Integration Guide

### Connecting to WebSocket

```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8086/ws/chat'),
  connectHeaders: {
    'X-User-Id': currentUserId
  },
  onConnect: () => {
    // Subscribe to conversation
    client.subscribe(`/topic/chat/${conversationId}`, (message) => {
      const msg = JSON.parse(message.body);
      handleNewMessage(msg);
    });
    
    // Subscribe to typing indicators
    client.subscribe(`/topic/chat/${conversationId}/typing`, (message) => {
      handleTypingIndicator(JSON.parse(message.body));
    });
    
    // Subscribe to poll updates
    client.subscribe(`/topic/chat/${conversationId}/poll`, (message) => {
      handlePollUpdate(JSON.parse(message.body));
    });
    
    // Subscribe to reaction updates
    client.subscribe(`/topic/chat/${conversationId}/reactions`, (message) => {
      handleReactionUpdate(JSON.parse(message.body));
    });
  }
});

client.activate();
```

### Sending Messages via WebSocket

```javascript
// Send message
client.publish({
  destination: `/app/chat/${conversationId}`,
  body: JSON.stringify({
    content: "Hello!",
    messageType: "TEXT"
  })
});

// Send typing indicator
client.publish({
  destination: `/app/typing/${conversationId}`,
  body: JSON.stringify({ isTyping: true })
});

// Send read receipt
client.publish({
  destination: `/app/read/${conversationId}`,
  body: JSON.stringify({ lastReadMessageId: messageId })
});
```

---

## Configuration Added

**pom.xml:**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

---

## Comparison with Competitors

| Feature | LERA Connect | Telegram | Teams | WeChat | Zalo |
|---------|-------------|----------|-------|--------|------|
| Real-time WebSocket | ✅ | ✅ | ✅ | ✅ | ✅ |
| Polls/Voting | ✅ | ✅ | ✅ | ❌ | ❌ |
| Quiz Mode | ✅ | ✅ | ❌ | ❌ | ❌ |
| Anonymous Polls | ✅ | ✅ | ❌ | ❌ | ❌ |
| Emoji Reactions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Typing Indicators | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read Receipts | ✅ | ✅ | ✅ | ✅ | ✅ |
| Online Presence | ✅ | ✅ | ✅ | ✅ | ✅ |
| File Sharing | ✅ | ✅ | ✅ | ✅ | ✅ |
| Group Chat | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Build Status

```bash
cd backend/connect_service
mvn compile -DskipTests

# Result: BUILD SUCCESS
# Compiled: 62 source files
```

---

## Next Steps

1. **Frontend Integration**: Update the Next.js frontend to use WebSocket instead of polling
2. **Push Notifications**: Integrate with Firebase/APNs for mobile push
3. **Message Editing**: Add ability to edit sent messages (like Telegram)
4. **Message Deletion**: Add "delete for everyone" feature
5. **Voice Messages**: Add voice recording and playback
6. **Video Calls**: Integrate WebRTC for video conferencing

---

*Document generated: January 2024*
*Author: GitHub Copilot*
