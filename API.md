# Grasp API Documentation

## Base URL

```
http://localhost:8000
```

## Authentication

Currently, the API does not require authentication as it's a local application.

## Endpoints

### Health Check

#### GET /health

Check if the backend server is running.

**Response**
```json
{
  "status": "healthy"
}
```

**Status Codes**
- `200 OK` - Server is running

---

### Video Management

#### POST /api/video/load

Load and process a YouTube video. Extracts transcript, creates chunks, generates embeddings, and stores in database.

**Request Body**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response**
```json
{
  "id": "VIDEO_ID",
  "youtube_id": "VIDEO_ID",
  "title": "Video Title",
  "duration": 3600,
  "chunk_count": 45
}
```

**Status Codes**
- `200 OK` - Video loaded successfully
- `400 Bad Request` - Invalid URL or video unavailable
- `500 Internal Server Error` - Processing error

**Notes**
- First request may take 30-60 seconds to process
- Video must have captions/transcripts available
- Returns existing video if already processed

---

#### GET /api/video/{video_id}

Get details of a specific video.

**Parameters**
- `video_id` (path) - The video ID

**Response**
```json
{
  "id": "VIDEO_ID",
  "youtube_id": "VIDEO_ID",
  "title": "Video Title",
  "duration": 3600,
  "transcript": "Full transcript text...",
  "processed_at": "2024-01-01T12:00:00",
  "watched_duration": 1200
}
```

**Status Codes**
- `200 OK` - Video found
- `404 Not Found` - Video does not exist

---

#### GET /api/videos

List all processed videos.

**Response**
```json
[
  {
    "id": "VIDEO_ID_1",
    "youtube_id": "VIDEO_ID_1",
    "title": "First Video",
    "duration": 1800,
    "processed_at": "2024-01-01T12:00:00"
  },
  {
    "id": "VIDEO_ID_2",
    "youtube_id": "VIDEO_ID_2",
    "title": "Second Video",
    "duration": 2400,
    "processed_at": "2024-01-02T14:30:00"
  }
]
```

**Status Codes**
- `200 OK` - Success (returns empty array if no videos)

---

### Chat

#### POST /api/chat/message

Send a message and get AI response with RAG context.

**Request Body**
```json
{
  "video_id": "VIDEO_ID",
  "message": "What is explained at 5:23?",
  "current_timestamp": 323.5
}
```

**Response**
```json
{
  "role": "assistant",
  "content": "At 5:23, the video explains...",
  "context_chunks": [
    {
      "text": "Relevant transcript chunk...",
      "start_time": 320.0,
      "end_time": 325.0,
      "chunk_index": 12,
      "distance": 0.234
    }
  ]
}
```

**Status Codes**
- `200 OK` - Response generated successfully
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - LLM API error

**Notes**
- Uses RAG to retrieve relevant context from transcript
- Includes chunks near current timestamp (±2 minutes)
- LLM provider set via `LLM_PROVIDER` environment variable
- Response stored in chat history

---

#### GET /api/chat/history/{video_id}

Get chat history for a specific video.

**Parameters**
- `video_id` (path) - The video ID

**Response**
```json
[
  {
    "id": 1,
    "video_id": "VIDEO_ID",
    "timestamp": 120.5,
    "role": "user",
    "content": "What is backpropagation?",
    "context_chunks": "[0, 1, 2]",
    "created_at": "2024-01-01T12:00:00"
  },
  {
    "id": 2,
    "video_id": "VIDEO_ID",
    "timestamp": 120.5,
    "role": "assistant",
    "content": "Backpropagation is...",
    "context_chunks": "[0, 1, 2]",
    "created_at": "2024-01-01T12:00:01"
  }
]
```

**Status Codes**
- `200 OK` - Success (returns empty array if no history)

---

### Notes

#### POST /api/notes

Create a new note.

**Request Body**
```json
{
  "video_id": "VIDEO_ID",
  "timestamp": 42.5,
  "content": "Important point about neural networks",
  "tags": ["neural-networks", "important"]
}
```

**Response**
```json
{
  "id": 1,
  "video_id": "VIDEO_ID",
  "timestamp": 42.5,
  "content": "Important point about neural networks",
  "tags": ["neural-networks", "important"],
  "created_at": "2024-01-01T12:00:00",
  "updated_at": "2024-01-01T12:00:00"
}
```

**Status Codes**
- `200 OK` - Note created successfully
- `400 Bad Request` - Missing required fields

---

#### GET /api/notes/{video_id}

Get all notes for a specific video.

**Parameters**
- `video_id` (path) - The video ID

**Response**
```json
[
  {
    "id": 1,
    "video_id": "VIDEO_ID",
    "timestamp": 42.5,
    "content": "First note",
    "tags": ["important"],
    "created_at": "2024-01-01T12:00:00",
    "updated_at": "2024-01-01T12:00:00"
  },
  {
    "id": 2,
    "video_id": "VIDEO_ID",
    "timestamp": 120.0,
    "content": "Second note",
    "tags": [],
    "created_at": "2024-01-01T12:15:00",
    "updated_at": "2024-01-01T12:15:00"
  }
]
```

**Status Codes**
- `200 OK` - Success (returns empty array if no notes)

**Notes**
- Notes returned sorted by timestamp

---

#### PUT /api/notes/{note_id}

Update an existing note.

**Parameters**
- `note_id` (path) - The note ID

**Request Body**
```json
{
  "content": "Updated content",
  "tags": ["updated", "important"]
}
```

**Response**
```json
{
  "id": 1,
  "video_id": "VIDEO_ID",
  "timestamp": 42.5,
  "content": "Updated content",
  "tags": ["updated", "important"],
  "created_at": "2024-01-01T12:00:00",
  "updated_at": "2024-01-01T12:30:00"
}
```

**Status Codes**
- `200 OK` - Note updated successfully
- `404 Not Found` - Note does not exist

**Notes**
- All fields are optional
- Omitted fields retain their current values
- `updated_at` is automatically set to current time

---

#### DELETE /api/notes/{note_id}

Delete a note.

**Parameters**
- `note_id` (path) - The note ID

**Response**
```json
{
  "status": "deleted"
}
```

**Status Codes**
- `200 OK` - Note deleted successfully
- `404 Not Found` - Note does not exist

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "detail": "Error message description"
}
```

### Common Error Codes

- `400 Bad Request` - Invalid request parameters or body
- `404 Not Found` - Resource does not exist
- `500 Internal Server Error` - Server-side error

### Specific Error Scenarios

**Video Loading Errors**
- Video has no available transcripts
- Invalid YouTube URL
- Video is private or region-restricted
- yt-dlp extraction failure

**Chat Errors**
- LLM API key not configured
- LLM API rate limit exceeded
- No embeddings found for video
- ChromaDB connection error

**Database Errors**
- SQLite file permission issues
- Database corruption
- Concurrent write conflicts

---

## Data Models

### Video
```typescript
{
  id: string              // Video ID (same as youtube_id)
  youtube_id: string      // YouTube video ID
  title: string           // Video title
  duration: number        // Duration in seconds
  transcript?: string     // Full transcript text
  processed_at: string    // ISO 8601 timestamp
  watched_duration: number // User progress in seconds
  chunk_count?: number    // Number of transcript chunks
}
```

### Message
```typescript
{
  id: number
  video_id: string
  timestamp: number       // Video timestamp when sent
  role: "user" | "assistant"
  content: string
  context_chunks: string  // JSON array of chunk IDs
  created_at: string      // ISO 8601 timestamp
}
```

### Note
```typescript
{
  id: number
  video_id: string
  timestamp: number       // Video timestamp
  content: string
  tags: string[]
  created_at: string      // ISO 8601 timestamp
  updated_at: string      // ISO 8601 timestamp
}
```

### Chunk
```typescript
{
  text: string
  start_time: number      // Start timestamp in seconds
  end_time: number        // End timestamp in seconds
  chunk_index: number     // Sequential index
  distance?: number       // Similarity distance (in search results)
}
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. However, LLM APIs have their own rate limits:

- **OpenAI**: Varies by plan (typically 3-60 RPM)
- **Anthropic**: Varies by plan (typically 5-50 RPM)
- **Google Gemini**: Free tier has daily quotas

---

## Testing the API

### Using curl

```bash
# Health check
curl http://localhost:8000/health

# Load a video
curl -X POST http://localhost:8000/api/video/load \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=VIDEO_ID"}'

# Send a chat message
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "VIDEO_ID",
    "message": "What is this video about?",
    "current_timestamp": 0
  }'

# Create a note
curl -X POST http://localhost:8000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "VIDEO_ID",
    "timestamp": 42.5,
    "content": "Important point",
    "tags": ["important"]
  }'
```

### Using Python

```python
import requests

BASE_URL = "http://localhost:8000"

# Load video
response = requests.post(
    f"{BASE_URL}/api/video/load",
    json={"url": "https://www.youtube.com/watch?v=VIDEO_ID"}
)
video = response.json()
print(f"Loaded: {video['title']}")

# Send chat message
response = requests.post(
    f"{BASE_URL}/api/chat/message",
    json={
        "video_id": video["id"],
        "message": "Explain the main concept",
        "current_timestamp": 0
    }
)
answer = response.json()
print(f"AI: {answer['content']}")
```

---

## WebSocket Support

Not currently implemented. All communication is via HTTP REST.

---

## Changelog

### v1.0.0 (Current)
- Initial API implementation
- Video loading and processing
- RAG-based chat
- Notes CRUD operations
- Multi-LLM support (OpenAI, Anthropic, Gemini)

### Future Versions
- v1.1.0: Quiz generation endpoints
- v1.2.0: Flashcard endpoints with spaced repetition
- v1.3.0: Learning analytics endpoints
