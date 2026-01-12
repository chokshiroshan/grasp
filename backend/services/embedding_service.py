import os
from openai import OpenAI
from typing import Optional
import logging

logger = logging.getLogger(__name__)

client: Optional[OpenAI] = None


def get_client() -> OpenAI:
    """Get or create OpenAI client."""
    global client
    if client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        client = OpenAI(api_key=api_key)
    return client


async def embed_text(text: str) -> list[float]:
    """Generate embedding for a single text."""
    try:
        response = get_client().embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        raise


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for multiple texts."""
    try:
        response = get_client().embeddings.create(
            model="text-embedding-3-small",
            input=texts
        )
        return [item.embedding for item in response.data]
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        raise


async def embed_chunks(video_id: str, chunks: list[dict]) -> list[list[float]]:
    """Generate embeddings for video chunks."""
    texts = [chunk["text"] for chunk in chunks]
    embeddings = await embed_texts(texts)

    # Store embeddings with chunk metadata
    for i, chunk in enumerate(chunks):
        chunk["embedding"] = embeddings[i]
        chunk["chunk_index"] = i

    return embeddings
