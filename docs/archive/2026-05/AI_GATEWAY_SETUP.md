# 🤖 AI Gateway Configuration Guide

## Current Status
- **AI Gateway**: ✅ Running on port 8087
- **OpenAI API**: ⚠️ Not configured (using intelligent fallback)
- **Fallback Mode**: ✅ Working with educational responses

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/health` | GET | Check AI service health |
| `/api/ai/chat` | POST | Chat with AI tutor |
| `/api/ai/tutor` | POST | Get tutoring help |
| `/api/ai/assess` | POST | Assess student answers |
| `/api/ai/learning-path` | POST | Generate learning path |
| `/api/ai/generate-questions` | POST | Generate quiz questions |
| `/api/ai/exam-content` | POST | Generate exam content |

## Setting Up Real OpenAI API

### Option 1: Environment Variable (Recommended)

```bash
# Set the API key in your terminal
export OPENAI_API_KEY="sk-your-openai-api-key-here"

# Then restart the AI Gateway
cd /Users/rahulsharma/LERA_Group/backend/ai_gateway
mvn spring-boot:run -DskipTests
```

### Option 2: Add to application.properties

Edit `/backend/ai_gateway/src/main/resources/application.properties`:

```properties
# OpenAI API Configuration
openai.api.key=sk-your-openai-api-key-here
```

⚠️ **Note**: Don't commit API keys to git! Use environment variables in production.

### Option 3: Create .env file

Create `/backend/ai_gateway/.env`:
```
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

## Getting an OpenAI API Key

1. Go to https://platform.openai.com
2. Sign in or create an account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)

## Test Commands

```bash
# Check AI health
curl http://localhost:8087/api/ai/health | jq .

# Test chat (will use fallback if no API key)
curl -X POST http://localhost:8087/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Explain present tense", "subject": "English"}'

# Test tutoring
curl -X POST http://localhost:8087/api/ai/tutor \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I use articles?", "subject": "English", "level": "beginner"}'

# Test assessment
curl -X POST http://localhost:8087/api/ai/assess \
  -H "Content-Type: application/json" \
  -d '{"answer": "I am go to school", "correctAnswer": "I am going to school", "subject": "English"}'
```

## Supported Models

| Provider | Model | Best For |
|----------|-------|----------|
| OpenAI | gpt-4o-mini | Fast, cost-effective (recommended) |
| OpenAI | gpt-4 | Complex tasks |
| OpenAI | gpt-4-turbo | Long context |

## Fallback Behavior

When OpenAI API is not configured, the system provides:
- ✅ Intelligent educational responses
- ✅ Grammar explanations
- ✅ Vocabulary tips
- ✅ Study advice

This ensures the system works even without an API key!

## Restart AI Gateway

```bash
# Kill existing instance
pkill -f "ai_gateway" 

# Start with API key
OPENAI_API_KEY="sk-your-key" mvn spring-boot:run -DskipTests
```

## All Services Status

```bash
# Check all services
for port in 8081 8082 8083 8084 8085 8086 8087; do
  echo -n "Port $port: "
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:$port/api" 2>/dev/null || echo "not running"
done
```

## Troubleshooting

### Error: "OpenAI API key not configured"
→ Set the OPENAI_API_KEY environment variable

### Error: "401 Unauthorized"
→ Your API key is invalid or expired

### Error: "429 Too Many Requests"
→ You've hit the rate limit, wait a moment

### AI Gateway not starting
```bash
# Check logs
tail -100 /tmp/ai_gateway.log
```
