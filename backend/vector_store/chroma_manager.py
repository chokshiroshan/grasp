import os
import chromadb
from typing import Optional
import logging

logger = logging.getLogger(__name__)

_client: Optional[chromadb.ClientAPI] = None
_collection = None

CHROMA_PATH = os.getenv("CHROMA_PATH", "./data/chroma_db")


def get_client() -> chromadb.ClientAPI:
    """Get or create ChromaDB client."""
    global _client
    if _client is None:
        os.makedirs(CHROMA_PATH, exist_ok=True)
        _client = chromadb.PersistentClient(path=CHROMA_PATH)
    return _client


def get_collection():
    """Get or create the transcript chunks collection."""
    global _collection
    if _collection is None:
        client = get_client()
        _collection = client.get_or_create_collection(
            name="transcript_chunks",
            metadata={"description": "Video transcript chunks with embeddings"}
        )
    return _collection


async def store_chunks(video_id: str, chunks: list[dict]) -> None:
    """Store chunks with their embeddings in ChromaDB."""
    collection = get_collection()

    ids = []
    documents = []
    embeddings = []
    metadatas = []

    for i, chunk in enumerate(chunks):
        chunk_id = f"{video_id}_{i}"
        ids.append(chunk_id)
        documents.append(chunk["text"])
        embeddings.append(chunk.get("embedding", []))
        metadatas.append({
            "video_id": video_id,
            "chunk_index": i,
            "start_time": chunk["start_time"],
            "end_time": chunk["end_time"]
        })

    if embeddings and embeddings[0]:
        collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )
        logger.info(f"Stored {len(chunks)} chunks for video {video_id}")
    else:
        logger.warning(f"No embeddings provided for video {video_id}")


async def query_similar_chunks(
    video_id: str,
    query_embedding: list[float],
    n_results: int = 5
) -> list[dict]:
    """Query for similar chunks within a specific video."""
    collection = get_collection()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where={"video_id": video_id},
        include=["documents", "metadatas", "distances"]
    )

    chunks = []
    if results["documents"] and results["documents"][0]:
        for i, doc in enumerate(results["documents"][0]):
            chunks.append({
                "text": doc,
                "chunk_index": results["metadatas"][0][i]["chunk_index"],
                "start_time": results["metadatas"][0][i]["start_time"],
                "end_time": results["metadatas"][0][i]["end_time"],
                "distance": results["distances"][0][i] if results["distances"] else None
            })

    return chunks


async def delete_video_chunks(video_id: str) -> None:
    """Delete all chunks for a video."""
    collection = get_collection()

    # Get all chunk IDs for this video
    results = collection.get(
        where={"video_id": video_id},
        include=[]
    )

    if results["ids"]:
        collection.delete(ids=results["ids"])
        logger.info(f"Deleted {len(results['ids'])} chunks for video {video_id}")
