import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json

from models.database import init_db, get_db

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
    yield


app = FastAPI(title="Grasp API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models
class VideoLoadRequest(BaseModel):
    url: str


class VideoResponse(BaseModel):
    id: str
    youtube_id: str
    title: str
    duration: int
    chunk_count: int


class ChatMessageRequest(BaseModel):
    video_id: str
    message: str
    current_timestamp: Optional[float] = 0.0


class ChatMessageResponse(BaseModel):
    role: str
    content: str
    context_chunks: list[dict]


class NoteCreate(BaseModel):
    video_id: str
    timestamp: float
    content: str
    tags: Optional[list[str]] = []


class NoteUpdate(BaseModel):
    content: Optional[str] = None
    tags: Optional[list[str]] = None


class NoteResponse(BaseModel):
    id: int
    video_id: str
    timestamp: float
    content: str
    tags: list[str]
    created_at: str
    updated_at: str


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Video endpoints
@app.post("/api/video/load", response_model=VideoResponse)
async def load_video(request: VideoLoadRequest):
    from services.youtube_service import extract_video_data
    from services.embedding_service import embed_chunks
    from vector_store.chroma_manager import store_chunks

    video_data = await extract_video_data(request.url)
    if not video_data:
        raise HTTPException(status_code=400, detail="Failed to extract video data")

    db = await get_db()

    # Check if video already exists
    cursor = await db.execute(
        "SELECT id FROM videos WHERE youtube_id = ?",
        (video_data["youtube_id"],)
    )
    existing = await cursor.fetchone()

    if existing:
        await db.close()
        cursor = await (await get_db()).execute(
            "SELECT COUNT(*) as count FROM chunks WHERE video_id = ?",
            (existing["id"],)
        )
        count = await cursor.fetchone()
        return VideoResponse(
            id=existing["id"],
            youtube_id=video_data["youtube_id"],
            title=video_data["title"],
            duration=video_data["duration"],
            chunk_count=count["count"]
        )

    # Store video
    video_id = video_data["youtube_id"]
    await db.execute(
        """INSERT INTO videos (id, youtube_id, title, duration, transcript)
           VALUES (?, ?, ?, ?, ?)""",
        (video_id, video_data["youtube_id"], video_data["title"],
         video_data["duration"], video_data["transcript"])
    )

    # Store chunks
    for i, chunk in enumerate(video_data["chunks"]):
        await db.execute(
            """INSERT INTO chunks (video_id, chunk_index, start_time, end_time, text)
               VALUES (?, ?, ?, ?, ?)""",
            (video_id, i, chunk["start_time"], chunk["end_time"], chunk["text"])
        )

    await db.commit()
    await db.close()

    # Generate embeddings and store in vector DB
    await embed_chunks(video_id, video_data["chunks"])
    await store_chunks(video_id, video_data["chunks"])

    return VideoResponse(
        id=video_id,
        youtube_id=video_data["youtube_id"],
        title=video_data["title"],
        duration=video_data["duration"],
        chunk_count=len(video_data["chunks"])
    )


@app.get("/api/video/{video_id}")
async def get_video(video_id: str):
    db = await get_db()
    cursor = await db.execute(
        "SELECT * FROM videos WHERE id = ?", (video_id,)
    )
    video = await cursor.fetchone()
    await db.close()

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return dict(video)


@app.get("/api/videos")
async def list_videos():
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, youtube_id, title, duration, processed_at FROM videos ORDER BY processed_at DESC"
    )
    videos = await cursor.fetchall()
    await db.close()
    return [dict(v) for v in videos]


# Chat endpoints
@app.post("/api/chat/message", response_model=ChatMessageResponse)
async def send_chat_message(request: ChatMessageRequest):
    from services.llm_service import get_chat_response
    from services.embedding_service import embed_text
    from vector_store.chroma_manager import query_similar_chunks

    # Get relevant chunks via RAG
    question_embedding = await embed_text(request.message)
    similar_chunks = await query_similar_chunks(
        request.video_id,
        question_embedding,
        n_results=5
    )

    # Get chunks near current timestamp
    db = await get_db()
    cursor = await db.execute(
        """SELECT * FROM chunks
           WHERE video_id = ? AND start_time >= ? AND end_time <= ?
           ORDER BY start_time""",
        (request.video_id,
         max(0, request.current_timestamp - 120),
         request.current_timestamp + 120)
    )
    timestamp_chunks = await cursor.fetchall()
    timestamp_chunks = [dict(c) for c in timestamp_chunks]

    # Get video info
    cursor = await db.execute(
        "SELECT title FROM videos WHERE id = ?", (request.video_id,)
    )
    video = await cursor.fetchone()
    video_title = video["title"] if video else "Unknown Video"

    # Combine context
    context_chunks = similar_chunks + [c for c in timestamp_chunks if c not in similar_chunks]

    # Get Claude response
    response = await get_chat_response(
        question=request.message,
        context_chunks=context_chunks,
        video_title=video_title,
        current_timestamp=request.current_timestamp
    )

    # Store messages
    await db.execute(
        """INSERT INTO messages (video_id, timestamp, role, content, context_chunks)
           VALUES (?, ?, 'user', ?, ?)""",
        (request.video_id, request.current_timestamp, request.message,
         json.dumps([c.get("id") or c.get("chunk_index") for c in context_chunks]))
    )
    await db.execute(
        """INSERT INTO messages (video_id, timestamp, role, content, context_chunks)
           VALUES (?, ?, 'assistant', ?, ?)""",
        (request.video_id, request.current_timestamp, response,
         json.dumps([c.get("id") or c.get("chunk_index") for c in context_chunks]))
    )
    await db.commit()
    await db.close()

    return ChatMessageResponse(
        role="assistant",
        content=response,
        context_chunks=context_chunks
    )


@app.get("/api/chat/history/{video_id}")
async def get_chat_history(video_id: str):
    db = await get_db()
    cursor = await db.execute(
        """SELECT * FROM messages WHERE video_id = ? ORDER BY created_at""",
        (video_id,)
    )
    messages = await cursor.fetchall()
    await db.close()
    return [dict(m) for m in messages]


# Notes endpoints
@app.post("/api/notes", response_model=NoteResponse)
async def create_note(note: NoteCreate):
    db = await get_db()
    cursor = await db.execute(
        """INSERT INTO notes (video_id, timestamp, content, tags)
           VALUES (?, ?, ?, ?)""",
        (note.video_id, note.timestamp, note.content, json.dumps(note.tags))
    )
    note_id = cursor.lastrowid
    await db.commit()

    cursor = await db.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
    created_note = await cursor.fetchone()
    await db.close()

    return NoteResponse(
        id=created_note["id"],
        video_id=created_note["video_id"],
        timestamp=created_note["timestamp"],
        content=created_note["content"],
        tags=json.loads(created_note["tags"]) if created_note["tags"] else [],
        created_at=str(created_note["created_at"]),
        updated_at=str(created_note["updated_at"])
    )


@app.get("/api/notes/{video_id}")
async def get_notes(video_id: str):
    db = await get_db()
    cursor = await db.execute(
        """SELECT * FROM notes WHERE video_id = ? ORDER BY timestamp""",
        (video_id,)
    )
    notes = await cursor.fetchall()
    await db.close()

    return [
        NoteResponse(
            id=n["id"],
            video_id=n["video_id"],
            timestamp=n["timestamp"],
            content=n["content"],
            tags=json.loads(n["tags"]) if n["tags"] else [],
            created_at=str(n["created_at"]),
            updated_at=str(n["updated_at"])
        )
        for n in notes
    ]


@app.put("/api/notes/{note_id}", response_model=NoteResponse)
async def update_note(note_id: int, note: NoteUpdate):
    db = await get_db()

    # Get existing note
    cursor = await db.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
    existing = await cursor.fetchone()
    if not existing:
        await db.close()
        raise HTTPException(status_code=404, detail="Note not found")

    # Update fields
    content = note.content if note.content is not None else existing["content"]
    tags = json.dumps(note.tags) if note.tags is not None else existing["tags"]

    await db.execute(
        """UPDATE notes SET content = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?""",
        (content, tags, note_id)
    )
    await db.commit()

    cursor = await db.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
    updated = await cursor.fetchone()
    await db.close()

    return NoteResponse(
        id=updated["id"],
        video_id=updated["video_id"],
        timestamp=updated["timestamp"],
        content=updated["content"],
        tags=json.loads(updated["tags"]) if updated["tags"] else [],
        created_at=str(updated["created_at"]),
        updated_at=str(updated["updated_at"])
    )


@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: int):
    db = await get_db()
    cursor = await db.execute("SELECT id FROM notes WHERE id = ?", (note_id,))
    if not await cursor.fetchone():
        await db.close()
        raise HTTPException(status_code=404, detail="Note not found")

    await db.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    await db.commit()
    await db.close()
    return {"status": "deleted"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
