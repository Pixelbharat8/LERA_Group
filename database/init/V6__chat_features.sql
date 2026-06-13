-- V6: Chat and Messaging Features Tables
-- Migration for Connect Service Chat functionality

-- Chat Groups
CREATE TABLE IF NOT EXISTS chat_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url VARCHAR(500),
    group_type VARCHAR(50) DEFAULT 'private', -- 'private', 'public', 'class', 'department'
    max_members INTEGER DEFAULT 256,
    owner_id BIGINT REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Group Members
CREATE TABLE IF NOT EXISTS chat_group_members (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT REFERENCES chat_groups(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'admin', 'moderator', 'member'
    muted_until TIMESTAMP,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- Conversations (direct messages)
CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    conversation_type VARCHAR(50) DEFAULT 'direct', -- 'direct', 'group'
    group_id BIGINT REFERENCES chat_groups(id),
    last_message_at TIMESTAMP,
    last_message_preview VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation Participants
CREATE TABLE IF NOT EXISTS conversation_participants (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT REFERENCES conversations(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    unread_count INTEGER DEFAULT 0,
    last_read_at TIMESTAMP,
    is_muted BOOLEAN DEFAULT false,
    muted_until TIMESTAMP,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

-- Chat Attachments
CREATE TABLE IF NOT EXISTS chat_attachments (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES chat_messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Message Reactions
CREATE TABLE IF NOT EXISTS chat_message_reactions (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

-- Chat Polls
CREATE TABLE IF NOT EXISTS chat_polls (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES chat_messages(id) ON DELETE CASCADE,
    question VARCHAR(500) NOT NULL,
    poll_type VARCHAR(50) DEFAULT 'single', -- 'single', 'multiple'
    is_anonymous BOOLEAN DEFAULT false,
    allows_add_options BOOLEAN DEFAULT false,
    expires_at TIMESTAMP,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Poll Options
CREATE TABLE IF NOT EXISTS chat_poll_options (
    id BIGSERIAL PRIMARY KEY,
    poll_id BIGINT REFERENCES chat_polls(id) ON DELETE CASCADE,
    option_text VARCHAR(255) NOT NULL,
    option_order INTEGER DEFAULT 0,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Poll Votes
CREATE TABLE IF NOT EXISTS chat_poll_votes (
    id BIGSERIAL PRIMARY KEY,
    poll_id BIGINT REFERENCES chat_polls(id) ON DELETE CASCADE,
    option_id BIGINT REFERENCES chat_poll_options(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, option_id, user_id)
);

-- Blocked Users
CREATE TABLE IF NOT EXISTS blocked_users (
    id BIGSERIAL PRIMARY KEY,
    blocker_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    blocked_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blocker_id, blocked_id)
);

-- User Online Status
CREATE TABLE IF NOT EXISTS user_online_status (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    is_online BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMP,
    status_message VARCHAR(255),
    status_emoji VARCHAR(50),
    device_info JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Conversation Preferences
CREATE TABLE IF NOT EXISTS user_conversation_prefs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    notification_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    desktop_notification BOOLEAN DEFAULT true,
    email_notification BOOLEAN DEFAULT false,
    show_read_receipts BOOLEAN DEFAULT true,
    show_typing_indicator BOOLEAN DEFAULT true,
    settings JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class Group Chats
CREATE TABLE IF NOT EXISTS class_group_chats (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT REFERENCES classes(id) ON DELETE CASCADE,
    group_id BIGINT REFERENCES chat_groups(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, group_id)
);

-- Indexes
CREATE INDEX idx_chat_groups_owner ON chat_groups(owner_id);
CREATE INDEX idx_chat_group_members_user ON chat_group_members(user_id);
CREATE INDEX idx_chat_group_members_group ON chat_group_members(group_id);
CREATE INDEX idx_conversations_type ON conversations(conversation_type);
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_chat_attachments_message ON chat_attachments(message_id);
CREATE INDEX idx_chat_reactions_message ON chat_message_reactions(message_id);
CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_user_online_status_user ON user_online_status(user_id);
