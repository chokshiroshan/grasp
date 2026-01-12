"""Tests for FastAPI endpoints."""
import pytest
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.fixture
def client():
    """Create test client."""
    from fastapi.testclient import TestClient
    from main import app

    return TestClient(app)


class TestHealthEndpoint:
    """Test health check endpoint."""

    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}


class TestVideoEndpoints:
    """Test video-related endpoints."""

    def test_list_videos_empty(self, client):
        """Test listing videos when database is empty."""
        response = client.get("/api/videos")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_video_not_found(self, client):
        """Test getting a non-existent video."""
        response = client.get("/api/video/nonexistent_id")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestNotesEndpoints:
    """Test notes CRUD endpoints."""

    @pytest.fixture
    def mock_video_id(self):
        """Mock video ID for testing."""
        return "test_video_123"

    def test_create_note(self, client, mock_video_id):
        """Test creating a note."""
        note_data = {
            "video_id": mock_video_id,
            "timestamp": 42.5,
            "content": "This is a test note",
            "tags": ["test", "important"]
        }

        response = client.post("/api/notes", json=note_data)
        assert response.status_code == 200

        data = response.json()
        assert data["video_id"] == mock_video_id
        assert data["timestamp"] == 42.5
        assert data["content"] == "This is a test note"
        assert data["tags"] == ["test", "important"]
        assert "id" in data
        assert "created_at" in data

    def test_get_notes_for_video(self, client, mock_video_id):
        """Test retrieving notes for a video."""
        # Create a note first
        note_data = {
            "video_id": mock_video_id,
            "timestamp": 10.0,
            "content": "Test note",
            "tags": []
        }
        client.post("/api/notes", json=note_data)

        # Get notes
        response = client.get(f"/api/notes/{mock_video_id}")
        assert response.status_code == 200

        notes = response.json()
        assert isinstance(notes, list)
        assert len(notes) > 0

    def test_update_note(self, client, mock_video_id):
        """Test updating a note."""
        # Create a note
        note_data = {
            "video_id": mock_video_id,
            "timestamp": 5.0,
            "content": "Original content",
            "tags": []
        }
        create_response = client.post("/api/notes", json=note_data)
        note_id = create_response.json()["id"]

        # Update the note
        update_data = {
            "content": "Updated content",
            "tags": ["updated"]
        }
        response = client.put(f"/api/notes/{note_id}", json=update_data)
        assert response.status_code == 200

        updated_note = response.json()
        assert updated_note["content"] == "Updated content"
        assert updated_note["tags"] == ["updated"]

    def test_delete_note(self, client, mock_video_id):
        """Test deleting a note."""
        # Create a note
        note_data = {
            "video_id": mock_video_id,
            "timestamp": 15.0,
            "content": "To be deleted",
            "tags": []
        }
        create_response = client.post("/api/notes", json=note_data)
        note_id = create_response.json()["id"]

        # Delete the note
        response = client.delete(f"/api/notes/{note_id}")
        assert response.status_code == 200
        assert response.json()["status"] == "deleted"

        # Verify it's deleted
        get_response = client.get(f"/api/notes/{mock_video_id}")
        notes = get_response.json()
        assert all(note["id"] != note_id for note in notes)

    def test_update_nonexistent_note(self, client):
        """Test updating a note that doesn't exist."""
        response = client.put("/api/notes/99999", json={"content": "test"})
        assert response.status_code == 404

    def test_delete_nonexistent_note(self, client):
        """Test deleting a note that doesn't exist."""
        response = client.delete("/api/notes/99999")
        assert response.status_code == 404
