# Changelog

All notable changes to Grasp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CI/CD pipeline with GitHub Actions
- Automated testing for backend and frontend
- Security scanning with CodeQL and Bandit
- Dependabot for automated dependency updates
- Code coverage tracking

## [1.0.0] - 2024-01-12

### Added
- Initial release of Grasp MVP (Phase 1)
- YouTube video transcript extraction with yt-dlp
- RAG-based AI chat powered by LLMs (Claude, OpenAI, Gemini)
- Semantic search using ChromaDB and OpenAI embeddings
- Timestamped note-taking functionality
- Electron desktop application with React + TypeScript
- FastAPI backend with SQLite database
- Multi-LLM provider support (Anthropic, OpenAI, Google)
- Custom video player with YouTube IFrame API
- Split-pane UI with resizable panels
- Dark mode interface
- Comprehensive test suite (43 tests total)
  - 19 backend tests (pytest)
  - 24 frontend tests (vitest)
- Complete documentation
  - README.md with setup instructions
  - API.md with endpoint documentation
  - CLAUDE.md for AI assistant context

### Technical Details
- **Backend**: Python 3.11+, FastAPI, SQLite, ChromaDB
- **Frontend**: Electron, React 18, TypeScript, Tailwind CSS
- **Testing**: pytest, vitest, React Testing Library
- **AI Models**: Claude Sonnet, GPT-4o-mini, Gemini 1.5 Flash
- **Embeddings**: OpenAI text-embedding-3-small

[Unreleased]: https://github.com/roshanchokshi/grasp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/roshanchokshi/grasp/releases/tag/v1.0.0
