# Grasp - AI-Powered YouTube Learning Platform

An intelligent desktop application that transforms YouTube videos into interactive learning experiences. Chat with AI about video content, take timestamped notes, and get personalized study materials.

![Status](https://img.shields.io/badge/status-MVP-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Backend Tests](https://img.shields.io/badge/backend%20tests-19%20passed-brightgreen)
![Frontend Tests](https://img.shields.io/badge/frontend%20tests-24%20passed-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-48%25-yellow)

## Features

### ✅ Phase 1 (MVP) - Implemented
- **Video Playback**: YouTube video player with custom controls
- **Transcript Extraction**: Automatic transcript extraction from YouTube videos
- **AI Chat with RAG**: Ask questions about video content with context-aware responses
- **Timestamped Notes**: Take notes linked to specific video timestamps
- **Multi-LLM Support**: Choose between Claude, OpenAI GPT, or Google Gemini
- **Vector Search**: Semantic search through video transcripts using ChromaDB

### 🚧 Phase 2 - Planned
- Quiz generation from video content
- Flashcards with spaced repetition
- Code block detection and explanation

### 📅 Phase 3 - Future
- Learning pattern analysis
- Personalized study guides
- Cross-video knowledge synthesis

## Tech Stack

**Frontend:**
- Electron + React + TypeScript
- Tailwind CSS for styling
- Zustand for state management
- React Query for data fetching

**Backend:**
- Python FastAPI
- SQLite for structured data
- ChromaDB for vector storage
- yt-dlp for transcript extraction

**AI/ML:**
- OpenAI (GPT-4o-mini for chat, text-embedding-3-small for embeddings)
- Anthropic Claude (Sonnet 4)
- Google Gemini (1.5 Flash)

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- API keys (at least one):
  - OpenAI API key (recommended)
  - Anthropic API key
  - Google API key

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Grasp
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your API keys
```

### 3. Frontend Setup

```bash
cd electron-app

# Install dependencies
npm install
```

## Configuration

Edit `backend/.env`:

```bash
# Choose your LLM provider
LLM_PROVIDER=openai  # Options: openai, anthropic, gemini

# API Keys (you only need one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Database paths (defaults work fine)
DATABASE_PATH=./data/learning.db
CHROMA_PATH=./data/chroma_db

# Logging
LOG_LEVEL=INFO
```

**LLM Provider Recommendations:**
- `openai` - Best balance of cost and quality (GPT-4o-mini)
- `gemini` - Fast and free tier available
- `anthropic` - Best quality but more expensive (Claude Sonnet 4)

## Usage

### Start the Backend Server

```bash
cd backend
source venv/bin/activate
python main.py
```

Server runs on `http://localhost:8000`

### Start the Electron App

```bash
cd electron-app
npm run dev
```

### Using the App

1. **Load a Video**: Paste a YouTube URL and click "Load"
2. **Watch & Learn**: Video plays on the left (60% width)
3. **Ask Questions**: Use the Chat tab to ask questions about the content
4. **Take Notes**: Switch to Notes tab to create timestamped notes
5. **Export Notes**: Download your notes as Markdown

## Project Structure

```
Grasp/
├── backend/
│   ├── main.py                      # FastAPI app
│   ├── services/
│   │   ├── youtube_service.py       # Video & transcript extraction
│   │   ├── embedding_service.py     # OpenAI embeddings
│   │   ├── llm_service.py           # Multi-LLM chat
│   │   └── ...
│   ├── models/
│   │   └── database.py              # SQLite schema
│   ├── vector_store/
│   │   └── chroma_manager.py        # ChromaDB operations
│   └── requirements.txt
│
├── electron-app/
│   ├── src/
│   │   ├── main/                    # Electron main process
│   │   ├── preload/                 # Preload scripts
│   │   └── renderer/src/
│   │       ├── components/          # React components
│   │       │   ├── VideoPlayer.tsx
│   │       │   ├── ChatInterface.tsx
│   │       │   └── NotesPanel.tsx
│   │       ├── services/api.ts      # Backend API client
│   │       ├── store/               # Zustand state
│   │       └── App.tsx
│   └── package.json
│
├── CLAUDE.md                        # Development guide
└── README.md                        # This file
```

## API Endpoints

### Video Management
- `POST /api/video/load` - Load and process a YouTube video
- `GET /api/video/{video_id}` - Get video details
- `GET /api/videos` - List all processed videos

### Chat
- `POST /api/chat/message` - Send a message with RAG context
- `GET /api/chat/history/{video_id}` - Get chat history for a video

### Notes
- `POST /api/notes` - Create a new note
- `GET /api/notes/{video_id}` - Get notes for a video
- `PUT /api/notes/{id}` - Update a note
- `DELETE /api/notes/{id}` - Delete a note

### Health
- `GET /health` - Check backend status

## Development

### Running Tests

**Backend:**
```bash
cd backend
pytest tests/ -v
```

**Frontend:**
```bash
cd electron-app
npm test
```

### Building for Production

```bash
cd electron-app
npm run build
```

### CI/CD

The project uses GitHub Actions for automated testing, security scanning, and releases:

- **Continuous Integration**: Automatic tests on every push/PR
  - Backend tests (Python 3.11, 3.12)
  - Frontend tests (Vitest)
  - Linting (flake8, ESLint)
  - Multi-platform builds (Ubuntu, macOS, Windows)

- **Security Scanning**: Weekly automated scans
  - CodeQL analysis
  - Dependency vulnerability checks
  - Python security linting (Bandit)

- **Automated Releases**: Tag-based releases
  - Create tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
  - Push: `git push origin v1.0.0`
  - GitHub Actions builds and publishes installers

- **Dependabot**: Weekly dependency updates

See [CI_CD.md](CI_CD.md) for complete CI/CD documentation.

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.11+)
- Verify virtual environment is activated
- Make sure .env file exists with valid API keys
- Check port 8000 is not in use

### Video won't load
- Verify the YouTube video has captions/transcripts available
- Check backend logs for yt-dlp errors
- Some videos may be region-restricted or private

### Chat not working
- Verify `LLM_PROVIDER` is set correctly in .env
- Check your API key is valid and has credits
- Look for errors in backend terminal

### Seek bar jumping
- This is fixed in the current version
- If issue persists, try reloading the video

## Architecture Highlights

### RAG (Retrieval-Augmented Generation)
1. Video transcript split into 500-800 token chunks
2. Each chunk embedded using OpenAI text-embedding-3-small
3. Stored in ChromaDB for semantic search
4. User questions retrieve top 5 relevant chunks + nearby timestamp context
5. LLM generates response using retrieved context

### State Management
- Zustand for global state (video, messages, notes)
- Both Chat and Notes tabs stay mounted (hidden when inactive)
- Prevents re-renders and duplicate API calls

### Video Player
- YouTube IFrame API with custom controls
- Seek bar uses ref to pause timestamp updates while dragging
- Player fully reinitializes when switching videos

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Roadmap

- [ ] Quiz generation
- [ ] Flashcard system with spaced repetition
- [ ] Code block detection and syntax highlighting
- [ ] Learning analytics dashboard
- [ ] Multi-video study sessions
- [ ] Export to Anki/Quizlet
- [ ] Offline mode

## Acknowledgments

- Built with [Claude Code](https://claude.ai/code)
- Uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) for transcript extraction
- Powered by OpenAI, Anthropic, and Google AI APIs

## Support

For issues and questions:
- Open an issue on GitHub
- Check [CLAUDE.md](CLAUDE.md) for development details
