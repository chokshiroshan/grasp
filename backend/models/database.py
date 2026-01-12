import aiosqlite
import os
from pathlib import Path

DATABASE_PATH = os.getenv("DATABASE_PATH", "./data/learning.db")


async def get_db():
    """Get database connection."""
    Path(DATABASE_PATH).parent.mkdir(parents=True, exist_ok=True)
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    """Initialize database with schema."""
    db = await get_db()

    await db.executescript("""
        -- Videos table
        CREATE TABLE IF NOT EXISTS videos (
            id TEXT PRIMARY KEY,
            youtube_id TEXT UNIQUE,
            title TEXT,
            duration INTEGER,
            transcript TEXT,
            processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            watched_duration INTEGER DEFAULT 0
        );

        -- Transcript chunks
        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id TEXT,
            chunk_index INTEGER,
            start_time REAL,
            end_time REAL,
            text TEXT,
            FOREIGN KEY (video_id) REFERENCES videos(id)
        );

        -- Chat history
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id TEXT,
            timestamp REAL,
            role TEXT,
            content TEXT,
            context_chunks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (video_id) REFERENCES videos(id)
        );

        -- Notes
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id TEXT,
            timestamp REAL,
            content TEXT,
            tags TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (video_id) REFERENCES videos(id)
        );

        -- Flashcards
        CREATE TABLE IF NOT EXISTS flashcards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        CREATE TABLE IF NOT EXISTS quiz_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id TEXT,
            question TEXT,
            options TEXT,
            correct_index INTEGER,
            explanation TEXT,
            FOREIGN KEY (video_id) REFERENCES videos(id)
        );

        -- Learning patterns
        CREATE TABLE IF NOT EXISTS learning_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id TEXT,
            event_type TEXT,
            topic TEXT,
            performance REAL,
            metadata TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (video_id) REFERENCES videos(id)
        );

        -- Create indexes for common queries
        CREATE INDEX IF NOT EXISTS idx_chunks_video_id ON chunks(video_id);
        CREATE INDEX IF NOT EXISTS idx_messages_video_id ON messages(video_id);
        CREATE INDEX IF NOT EXISTS idx_notes_video_id ON notes(video_id);
        CREATE INDEX IF NOT EXISTS idx_learning_events_video_id ON learning_events(video_id);
    """)

    await db.commit()
    await db.close()
