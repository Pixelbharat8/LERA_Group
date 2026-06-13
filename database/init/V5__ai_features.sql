-- V5: AI Features Tables
-- Migration for AI Tutor, Learning Progress, and Recommendations

-- Learning Paths
CREATE TABLE IF NOT EXISTS learning_paths (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    difficulty_level VARCHAR(50),
    estimated_hours INTEGER,
    prerequisites JSONB,
    outcomes JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Tutor Sessions
CREATE TABLE IF NOT EXISTS ai_tutor_sessions (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(100),
    topic VARCHAR(255),
    session_type VARCHAR(50),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    messages_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    session_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES ai_tutor_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    tokens_used INTEGER,
    model VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Assessments
CREATE TABLE IF NOT EXISTS ai_assessments (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(100),
    topic VARCHAR(255),
    assessment_type VARCHAR(50), -- 'quiz', 'test', 'practice'
    total_questions INTEGER,
    correct_answers INTEGER,
    score DECIMAL(5,2),
    time_spent_minutes INTEGER,
    difficulty_level VARCHAR(50),
    strengths JSONB,
    weaknesses JSONB,
    recommendations JSONB,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Learning Progress
CREATE TABLE IF NOT EXISTS ai_learning_progress (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    learning_path_id BIGINT REFERENCES learning_paths(id),
    subject VARCHAR(100),
    topic VARCHAR(255),
    mastery_level DECIMAL(5,2) DEFAULT 0, -- 0-100
    time_spent_minutes INTEGER DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    assessments_count INTEGER DEFAULT 0,
    average_score DECIMAL(5,2),
    last_activity_at TIMESTAMP,
    progress_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50), -- 'topic', 'resource', 'practice', 'review'
    subject VARCHAR(100),
    topic VARCHAR(255),
    priority INTEGER DEFAULT 5, -- 1-10
    reason TEXT,
    resource_type VARCHAR(50),
    resource_id BIGINT,
    resource_url VARCHAR(500),
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    metadata JSONB,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_ai_tutor_sessions_student ON ai_tutor_sessions(student_id);
CREATE INDEX idx_ai_tutor_sessions_status ON ai_tutor_sessions(status);
CREATE INDEX idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX idx_ai_assessments_student ON ai_assessments(student_id);
CREATE INDEX idx_ai_learning_progress_student ON ai_learning_progress(student_id);
CREATE INDEX idx_ai_recommendations_student ON ai_recommendations(student_id);
CREATE INDEX idx_ai_recommendations_type ON ai_recommendations(recommendation_type);
