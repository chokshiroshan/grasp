# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Grasp is an AI-powered web application for interactive learning from YouTube videos (focused on ML lectures). It combines video playback with an AI chatbot that has full video context, generates study materials, and learns user patterns over time.

## Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + Zustand (state) + Axios (HTTP client)
- **Backend**: Python FastAPI (local server with CORS)
- **Database**: SQLite (structured data) + ChromaDB (vector store)
- **AI**: Multi-LLM support (Claude/OpenAI/Gemini for chat), OpenAI text-embedding-3-small (embeddings)
- **Video**: YouTube iframe API, yt-dlp (transcript extraction)

## Build & Run Commands

### Frontend (Vite Web App)
```bash
cd frontend
npm install
npm run dev        # Development mode (http://localhost:5173)
npm run build      # Production build (outputs to dist/)
npm run preview    # Preview production build
```

### Backend (FastAPI Server)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Then edit with your API keys
python main.py     # Start server on localhost:8000
```

## Environment Variables

Create `.env` file in backend directory:
```
# LLM Provider Selection
LLM_PROVIDER=openai  # Options: openai, anthropic, gemini

# API Keys (only need the one for your chosen provider)
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_gemini_api_key

# Database Paths
DATABASE_PATH=./data/learning.db
CHROMA_PATH=./data/chroma_db

# Logging
LOG_LEVEL=INFO
```

**LLM Provider Options:**
- `openai` - Uses GPT-4o-mini (recommended for cost)
- `anthropic` - Uses Claude Sonnet 4
- `gemini` - Uses Gemini 1.5 Flash

## Architecture

```
project-root/
├── frontend/                  # Vite + React + TypeScript web app
│   ├── src/
│   │   ├── components/        # VideoPlayer, ChatInterface, NotesPanel
│   │   ├── services/
│   │   │   └── api.ts         # Backend API client (Axios)
│   │   ├── store/
│   │   │   └── learningStore.ts    # Zustand state management
│   │   ├── types/             # TypeScript type definitions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── dist/                  # Build output (static files)
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                   # Python FastAPI server
│   ├── main.py                # FastAPI app entry point (with CORS)
│   ├── services/
│   │   ├── youtube_service.py      # yt-dlp transcript extraction
│   │   ├── embedding_service.py    # OpenAI embeddings
│   │   ├── llm_service.py          # Multi-LLM chat (Claude/OpenAI/Gemini)
│   │   ├── learning_service.py     # Pattern analysis (future)
│   │   └── content_generator.py    # Quiz/flashcard generation (future)
│   ├── models/database.py          # SQLite models
│   ├── vector_store/chroma_manager.py  # ChromaDB integration
│   └── requirements.txt
```

## Core Data Flow

1. **Video Loading**: YouTube URL → yt-dlp extracts transcript → Chunks created (500-1000 tokens) → OpenAI embeddings → Stored in SQLite + ChromaDB

2. **RAG Chat**: User question → Embed question → Query ChromaDB for top 5 relevant chunks → Include current timestamp context (±2 min) → Send to selected LLM (Claude/OpenAI/Gemini) → Return response

3. **Content Generation**: Video transcript → Claude generates quizzes/flashcards as JSON → Store in SQLite

## Key API Endpoints

- `POST /api/video/load` - Load YouTube video, extract and chunk transcript
- `POST /api/chat/message` - Send message with RAG context, get Claude response
- `POST /api/generate/quiz/{video_id}` - Generate quiz questions
- `POST /api/generate/flashcards/{video_id}` - Generate flashcards
- `GET /api/flashcards/due` - Get flashcards due for spaced repetition review

## Database Tables

- `videos` - Video metadata and full transcript
- `chunks` - Transcript chunks with timestamps
- `messages` - Chat history with context chunk references
- `notes` - Timestamped notes
- `flashcards` - Cards with SM-2 spaced repetition fields
- `quiz_questions` - Generated quiz questions
- `learning_events` - User interaction tracking for learning analysis

## Implementation Phases

1. **MVP**: App shell, video player, transcript extraction, basic chat, notes
2. **Learning Features**: Quiz generation, flashcards with spaced repetition, code detection
3. **Agentic Features**: Learning pattern analysis, personalized study guides, cross-video synthesis

## Design Guidelines

- Dark mode by default
- Split-pane layout: Video (60%) | Chat/Notes/Quiz tabs (40%)
- Color accents: Chat (blue), Notes (green), Quiz (orange), Flashcards (purple)
- Monospace font for code blocks, sans-serif (Inter/System UI) for text
- Responsive design for web browsers

## Important UI Implementation Details

### Video Player
- YouTube IFrame API with custom controls
- Seek bar uses `isSeekingRef` to prevent timestamp conflicts during dragging
- Player fully reinitializes when switching videos (cleanup + new instance)
- CSS forces iframe to fill container: `#youtube-player iframe { width: 100% !important; height: 100% !important; }`

### Tab Switching (Chat/Notes)
- Both tabs remain mounted but hidden (prevents unmount/remount cycles)
- Each component uses `loadedVideoRef` to load data only once per video
- Prevents unnecessary re-renders and API calls

### State Management
- Zustand store in `learningStore.ts` manages global state
- Video player state (timestamp, playing status) synced to store
- Messages and notes loaded once per video and cached
- No persistence to localStorage (session-based state)

### API Communication
- Axios for HTTP requests to backend
- Base URL configured for localhost:8000 (development)
- CORS enabled on backend for cross-origin requests
- Error handling with user-friendly messages

## Troubleshooting

### Backend Issues
- **"No matching distribution for yt-dlp==X.X.X"**: Use `yt-dlp>=2024.10.22` (flexible version)
- **NumPy compatibility**: Requires `chromadb>=0.5.0` for NumPy 2.x support
- **OpenAI API errors**: Upgrade to `openai>=1.40.0`
- **Anthropic low credits**: Switch to `LLM_PROVIDER=openai` or `gemini`

### Frontend Issues
- **Blank video player**: Check YouTube API loaded, check video ID validity
- **Seek bar jumping**: Fixed with `isSeekingRef` to pause updates while dragging
- **Chat going blank**: Fixed by keeping tabs mounted (hidden) instead of unmounting
- **context_chunks.map error**: Fixed by checking `Array.isArray()` before mapping
- **CORS errors**: Ensure backend is running with CORS enabled (configured in main.py)
- **Cannot connect to backend**: Verify backend is running on localhost:8000

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Deployment

### Frontend (Static Hosting)
```bash
cd frontend
npm run build
# Upload dist/ contents to:
# - Vercel
# - Netlify
# - GitHub Pages
# - Any static hosting service
```

### Backend (Server/VPS)
```bash
cd backend
# Install dependencies
pip install -r requirements.txt
# Configure environment
cp .env.example .env
# Edit .env with production API keys
# Run with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Note**: Frontend needs to be configured to point to backend URL in production (update API base URL in `frontend/src/services/api.ts`).
