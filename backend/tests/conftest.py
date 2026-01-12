"""Pytest configuration and fixtures."""
import pytest
import os
import sys
import asyncio
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Set up test database path
test_db_path = Path(__file__).parent / "test_database.db"

# Set test environment variables
os.environ["DATABASE_PATH"] = str(test_db_path)
os.environ["CHROMA_PATH"] = "./test_data/chroma_db"
os.environ["LLM_PROVIDER"] = "openai"
os.environ["OPENAI_API_KEY"] = "test-key"


@pytest.fixture(scope="session", autouse=True)
def initialize_test_database():
    """Initialize test database before running tests."""
    from models.database import init_db

    # Remove existing test database if it exists
    if test_db_path.exists():
        test_db_path.unlink()

    # Run the async init_db function
    asyncio.run(init_db())

    yield

    # Cleanup after all tests
    if test_db_path.exists():
        test_db_path.unlink()

@pytest.fixture
def test_video_data():
    """Sample video data for testing."""
    return {
        "youtube_id": "test123",
        "title": "Test Video",
        "duration": 600,
        "transcript": "This is a test transcript for testing purposes.",
        "chunks": [
            {
                "text": "This is a test transcript",
                "start_time": 0.0,
                "end_time": 3.0,
                "embedding": [0.1] * 1536  # Mock embedding
            },
            {
                "text": "for testing purposes",
                "start_time": 3.0,
                "end_time": 5.0,
                "embedding": [0.2] * 1536
            }
        ]
    }


@pytest.fixture
def test_chunks():
    """Sample transcript chunks for testing."""
    return [
        {
            "text": "First chunk of transcript",
            "start_time": 0.0,
            "end_time": 5.0,
            "chunk_index": 0
        },
        {
            "text": "Second chunk of transcript",
            "start_time": 5.0,
            "end_time": 10.0,
            "chunk_index": 1
        }
    ]
