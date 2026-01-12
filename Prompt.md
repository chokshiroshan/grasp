# Project: AI-Powered YouTube Learning Platform

## Overview
Build a desktop application that enables interactive learning from YouTube videos (specifically ML lectures like Andrej Karpathy's content) with an AI chatbot that has full video context, generates study materials, and learns user patterns over time.

## Tech Stack
- **Frontend**: Electron + React + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI (local server)
- **Database**: SQLite (structured data) + ChromaDB (vector store)
- **AI**: Claude API (primary), OpenAI embeddings API
- **Video**: YouTube iframe API, yt-dlp for transcripts
- **Additional**: Axios, React Query, Zustand (state management)

## Architecture
```
project-root/
├── electron-app/          # Electron + React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── NotesPanel.tsx
│   │   │   ├── FlashcardView.tsx
│   │   │   └── QuizView.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── store/
│   │   │   └── learningStore.ts
│   │   ├── App.tsx
│   │   └── main.ts
│   └── package.json
│
├── backend/               # Python FastAPI server
│   ├── main.py
│   ├── services/
│   │   ├── youtube_service.py      # Transcript extraction
│   │   ├── embedding_service.py    # Vector embeddings
│   │   ├── claude_service.py       # Claude API integration
│   │   ├── learning_service.py     # Pattern analysis
│   │   └── content_generator.py    # Quiz/flashcard generation
│   ├── models/
│   │   └── database.py
│   ├── vector_store/
│   │   └── chroma_manager.py
│   └── requirements.txt
│
└── README.md
```

## Core Features to Implement

### Phase 1: MVP (Weeks 1-4)

#### 1. Desktop App Shell
- Initialize Electron app with React + TypeScript
- Create split-pane layout: Video (60%) | Chat/Notes (40%)
- Implement YouTube iframe player with controls
- Add URL input to load videos

#### 2. Transcript Extraction Pipeline
- Install and configure yt-dlp
- Create API endpoint: `POST /api/video/load` that:
  - Takes YouTube URL
  - Extracts transcript using yt-dlp
  - Chunks transcript semantically (500-1000 tokens per chunk)
  - Stores in SQLite with metadata (video_id, title, duration, chunks)
  - Returns success + video metadata

#### 3. Vector Store Setup
- Initialize ChromaDB locally
- Create embedding service using OpenAI text-embedding-3-small
- Generate embeddings for each transcript chunk
- Store in ChromaDB with metadata: {chunk_id, video_id, timestamp, text}

#### 4. Chat Interface with Context
- Create chat UI component with message history
- Implement RAG system:
  - On user question, embed the question
  - Query ChromaDB for top 5 relevant chunks
  - Include current timestamp context (±2 minutes of current playback position)
  - Send to Claude API with system prompt:
```
    You are an AI learning assistant helping a student understand ML lectures.
    
    Context from video transcript:
    {relevant_chunks}
    
    Current timestamp: {current_time}
    Video: {video_title}
    
    Answer the student's question using the video context. Be technical but clear.
    If explaining code, provide examples. If explaining math, break it down step by step.
```
- Display AI response with markdown rendering
- Track conversation history in SQLite

#### 5. Basic Note-Taking
- Create notes panel with simple text editor
- Auto-save notes to SQLite (linked to video_id + timestamp)
- Allow manual timestamp bookmarks
- Export notes as markdown

### Phase 2: Learning Features (Weeks 5-6)

#### 6. Code Block Detection
- Parse transcript for code segments using regex/AST
- Highlight code blocks in chat responses
- Create "Explain this code" button that sends code + surrounding context to Claude
- Store extracted code snippets in database

#### 7. Quiz Generation
- Create endpoint: `POST /api/generate/quiz`
- Send video transcript summary to Claude with prompt:
```
  Based on this ML lecture content:
  {summary}
  
  Generate 5 multiple-choice questions that test understanding of:
  - Key concepts
  - Mathematical intuition
  - Code implementation details
  
  Return JSON format:
  {
    "questions": [
      {
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "correct": 0,
        "explanation": "..."
      }
    ]
  }
```
- Create quiz UI with scoring and explanations
- Track quiz performance in database

#### 8. Flashcard System
- Endpoint: `POST /api/generate/flashcards`
- Generate flashcards from key concepts in video
- Implement spaced repetition algorithm (SM-2)
- UI for flashcard review with flip animation
- Track review history and performance

### Phase 3: Agentic Features (Weeks 7-8)

#### 9. Learning Pattern Analysis
- Track in database:
  - Questions asked (topic, complexity, timestamp)
  - Quiz performance by topic
  - Time spent on different video segments
  - Flashcard review patterns
- Create learning profile:
```python
  {
    "weak_topics": ["backpropagation", "chain rule"],
    "strong_topics": ["neural network basics"],
    "preferred_explanation_style": "code-first",
    "question_frequency": {...}
  }
```

#### 10. Personalized Study Guides
- After video completion, generate:
  - Key concepts summary
  - Code implementations review
  - Math concepts breakdown
  - Suggested prerequisites based on questions asked
- Use learning profile to customize content
- Store as markdown in database

#### 11. Cross-Video Learning
- Endpoint: `POST /api/analyze/learning-path`
- When multiple videos watched, analyze:
  - Common concepts across videos
  - Progressive complexity
  - Knowledge gaps
- Generate consolidated cheat sheets
- Create concept graph visualization (use mermaid diagrams)

#### 12. Smart Recommendations
- Based on learning patterns, suggest:
  - "Review backpropagation before next video"
  - "Rewatch 23:15-26:30 on attention mechanism"
  - "You might benefit from [related video]"
- Display as notifications/suggestions in UI

## Technical Implementation Details

### Database Schema (SQLite)
```sql
-- Videos table
CREATE TABLE videos (
    id TEXT PRIMARY KEY,
    youtube_id TEXT UNIQUE,
    title TEXT,
    duration INTEGER,
    transcript TEXT,
    processed_at TIMESTAMP,
    watched_duration INTEGER DEFAULT 0
);

-- Transcript chunks
CREATE TABLE chunks (
    id INTEGER PRIMARY KEY,
    video_id TEXT,
    chunk_index INTEGER,
    start_time REAL,
    end_time REAL,
    text TEXT,
    FOREIGN KEY (video_id) REFERENCES videos(id)
);

-- Chat history
CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    video_id TEXT,
    timestamp REAL,
    role TEXT, -- 'user' or 'assistant'
    content TEXT,
    context_chunks TEXT, -- JSON array of chunk IDs used
    created_at TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id)
);

-- Notes
CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    video_id TEXT,
    timestamp REAL,
    content TEXT,
    tags TEXT, -- JSON array
    created_at TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id)
);

-- Flashcards
CREATE TABLE flashcards (
    id INTEGER PRIMARY KEY,
    video_id TEXT,
    front TEXT,
    back TEXT,
    next_review TIMESTAMP,
    ease_factor REAL DEFAULT 2.5,
    interval INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    FOREIGN KEY (video_id) REFERENCES videos(id)
);

-- Quiz questions
CREATE TABLE quiz_questions (
    id INTEGER PRIMARY KEY,
    video_id TEXT,
    question TEXT,
    options TEXT, -- JSON array
    correct_index INTEGER,
    explanation TEXT,
    FOREIGN KEY (video_id) REFERENCES videos(id)
);

-- Learning patterns
CREATE TABLE learning_events (
    id INTEGER PRIMARY KEY,
    video_id TEXT,
    event_type TEXT, -- 'question', 'quiz_answer', 'flashcard_review', 'rewatch'
    topic TEXT,
    performance REAL, -- 0-1 score if applicable
    metadata TEXT, -- JSON
    created_at TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id)
);
```

### API Endpoints
```python
# Video Management
POST   /api/video/load          # Load YouTube video and extract transcript
GET    /api/video/{video_id}    # Get video details
GET    /api/videos              # List all videos

# Chat
POST   /api/chat/message        # Send message, get AI response with context
GET    /api/chat/history/{video_id}  # Get chat history

# Learning Materials
POST   /api/generate/quiz/{video_id}
POST   /api/generate/flashcards/{video_id}
POST   /api/generate/summary/{video_id}
GET    /api/flashcards/due      # Get due flashcards for review
POST   /api/flashcards/{id}/review  # Record flashcard review

# Notes
POST   /api/notes               # Create note
GET    /api/notes/{video_id}    # Get notes for video
PUT    /api/notes/{id}          # Update note

# Learning Analytics
GET    /api/analytics/profile   # Get learning profile
GET    /api/analytics/patterns  # Get learning patterns
POST   /api/recommendations     # Get personalized recommendations
```

### Environment Variables (.env)
```
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key
DATABASE_PATH=./data/learning.db
CHROMA_PATH=./data/chroma_db
LOG_LEVEL=INFO
```

## UI/UX Requirements

### Main Window Layout
```
┌─────────────────────────────────────────────────────────┐
│  [← Back]  [Video Title]              [Settings] [Help] │
├──────────────────────────┬──────────────────────────────┤
│                          │ ┌─ Chat ─┬─ Notes ─┬─ Quiz ┐│
│                          │ │                            ││
│   YouTube Video Player   │ │   Chat Interface           ││
│                          │ │   with context             ││
│   [Progress Bar]         │ │                            ││
│   [Play/Pause] [Speed]   │ │   [Ask question...]        ││
│                          │ │                            ││
│                          │ │   [Generate Quiz]          ││
│                          │ │   [Create Flashcards]      ││
│                          │ │   [Export Notes]           ││
└──────────────────────────┴──────────────────────────────┘
```

### Design System
- Use Tailwind CSS
- Dark mode by default (easier for long sessions)
- Color scheme: Dark bg with accent colors for different features
  - Chat: Blue accent
  - Notes: Green accent
  - Quiz: Orange accent
  - Flashcards: Purple accent
- Monospace font for code blocks
- Sans-serif for text (Inter or System UI)

## Implementation Priority

**Start with:**
1. Electron app shell + YouTube player
2. Backend server with transcript extraction
3. Basic chat with Claude API (no RAG yet, just send full transcript)
4. Simple note-taking

**Then add:**
5. Vector store + RAG for better context
6. Quiz and flashcard generation
7. Code block detection

**Finally:**
8. Learning pattern analysis
9. Personalized recommendations
10. Cross-video synthesis

## Success Criteria

**MVP is successful when:**
- Can load any YouTube video with transcript
- Can ask questions and get contextually accurate answers
- Can take notes with timestamps
- Notes and chat history persist between sessions

**Full version is successful when:**
- Quiz questions are relevant and challenging
- Flashcards actually help with retention (test after 1 week)
- AI detects learning patterns (weak topics identified correctly)
- Study guides are personalized and useful
- System feels like it "knows" how I learn

## Development Instructions for Claude Code

Please build this project incrementally:

1. **Start with project structure**: Set up the folders, package.json, requirements.txt
2. **Backend first**: Build the FastAPI server with basic endpoints before frontend
3. **Test each feature**: Provide example curl commands or test scripts for each endpoint
4. **Frontend incrementally**: Build one component at a time, test with mock data first
5. **Integration**: Connect frontend to backend once both are stable
6. **Document as you go**: Add comments explaining complex logic, especially for RAG and learning analysis

After each major feature, pause and ask if it works as expected before continuing.

Let's start with Phase 1, Step 1: Initialize the Electron app with React + TypeScript and create the basic layout.