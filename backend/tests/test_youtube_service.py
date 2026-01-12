"""Tests for YouTube service."""
import pytest
from services.youtube_service import (
    extract_youtube_id,
    chunk_transcript,
)


class TestExtractYoutubeId:
    """Test YouTube ID extraction from various URL formats."""

    def test_standard_url(self):
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        assert extract_youtube_id(url) == "dQw4w9WgXcQ"

    def test_short_url(self):
        url = "https://youtu.be/dQw4w9WgXcQ"
        assert extract_youtube_id(url) == "dQw4w9WgXcQ"

    def test_embed_url(self):
        url = "https://www.youtube.com/embed/dQw4w9WgXcQ"
        assert extract_youtube_id(url) == "dQw4w9WgXcQ"

    def test_shorts_url(self):
        url = "https://www.youtube.com/shorts/dQw4w9WgXcQ"
        assert extract_youtube_id(url) == "dQw4w9WgXcQ"

    def test_url_with_parameters(self):
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s"
        assert extract_youtube_id(url) == "dQw4w9WgXcQ"

    def test_invalid_url(self):
        url = "https://www.example.com"
        assert extract_youtube_id(url) is None


class TestChunkTranscript:
    """Test transcript chunking functionality."""

    def test_chunk_basic(self):
        transcript = [
            {"text": "First segment", "start": 0, "duration": 2},
            {"text": "Second segment", "start": 2, "duration": 2},
            {"text": "Third segment", "start": 4, "duration": 2},
        ]
        chunks = chunk_transcript(transcript, target_tokens=10)

        assert len(chunks) > 0
        assert all("text" in chunk for chunk in chunks)
        assert all("start_time" in chunk for chunk in chunks)
        assert all("end_time" in chunk for chunk in chunks)

    def test_chunk_respects_target_size(self):
        # Create a long transcript
        transcript = [
            {"text": " ".join(["word"] * 100), "start": i, "duration": 1}
            for i in range(10)
        ]

        chunks = chunk_transcript(transcript, target_tokens=50)

        # Should create multiple chunks
        assert len(chunks) > 1

        # Each chunk should be roughly the target size (with some tolerance)
        for chunk in chunks:
            word_count = len(chunk["text"].split())
            # Allow 50% tolerance
            assert word_count <= 100  # Not too large

    def test_empty_transcript(self):
        chunks = chunk_transcript([])
        assert chunks == []

    def test_chunk_timestamps_sequential(self):
        transcript = [
            {"text": "First", "start": 0, "duration": 5},
            {"text": "Second", "start": 5, "duration": 5},
            {"text": "Third", "start": 10, "duration": 5},
        ]

        chunks = chunk_transcript(transcript, target_tokens=5)

        # Verify timestamps are sequential
        for i in range(len(chunks) - 1):
            assert chunks[i]["end_time"] <= chunks[i + 1]["start_time"]
