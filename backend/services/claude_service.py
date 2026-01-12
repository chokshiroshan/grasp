import os
from anthropic import Anthropic
from typing import Optional
import logging

logger = logging.getLogger(__name__)

client: Optional[Anthropic] = None


def get_client() -> Anthropic:
    """Get or create Anthropic client."""
    global client
    if client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        client = Anthropic(api_key=api_key)
    return client


def format_timestamp(seconds: float) -> str:
    """Convert seconds to MM:SS or HH:MM:SS format."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)

    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"


def build_context_text(chunks: list[dict]) -> str:
    """Build formatted context text from chunks."""
    if not chunks:
        return "No relevant transcript context available."

    context_parts = []
    for chunk in chunks:
        start = format_timestamp(chunk.get("start_time", 0))
        end = format_timestamp(chunk.get("end_time", 0))
        text = chunk.get("text", "")
        context_parts.append(f"[{start} - {end}]\n{text}")

    return "\n\n".join(context_parts)


SYSTEM_PROMPT = """You are an AI learning assistant helping a student understand video lectures, particularly on machine learning and technical topics.

Context from video transcript:
{context}

Current timestamp: {current_time}
Video: {video_title}

Guidelines:
- Answer the student's question using the video context provided
- Be technical but clear - explain complex concepts step by step
- If explaining code, provide examples and walk through the logic
- If explaining math, break it down into understandable parts
- Reference specific timestamps when relevant (e.g., "As mentioned at 5:23...")
- If the context doesn't contain enough information to answer, say so honestly
- Keep responses focused and concise while being thorough"""


async def get_chat_response(
    question: str,
    context_chunks: list[dict],
    video_title: str,
    current_timestamp: float = 0.0
) -> str:
    """Get a response from Claude with video context."""
    context_text = build_context_text(context_chunks)
    current_time = format_timestamp(current_timestamp)

    system_prompt = SYSTEM_PROMPT.format(
        context=context_text,
        current_time=current_time,
        video_title=video_title
    )

    try:
        response = get_client().messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system=system_prompt,
            messages=[
                {"role": "user", "content": question}
            ]
        )

        return response.content[0].text

    except Exception as e:
        logger.error(f"Error getting Claude response: {e}")
        raise


async def get_chat_response_with_history(
    question: str,
    context_chunks: list[dict],
    video_title: str,
    current_timestamp: float,
    history: list[dict]
) -> str:
    """Get a response from Claude with video context and conversation history."""
    context_text = build_context_text(context_chunks)
    current_time = format_timestamp(current_timestamp)

    system_prompt = SYSTEM_PROMPT.format(
        context=context_text,
        current_time=current_time,
        video_title=video_title
    )

    # Build messages list from history
    messages = []
    for msg in history[-10:]:  # Keep last 10 messages for context
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })

    # Add current question
    messages.append({"role": "user", "content": question})

    try:
        response = get_client().messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system=system_prompt,
            messages=messages
        )

        return response.content[0].text

    except Exception as e:
        logger.error(f"Error getting Claude response: {e}")
        raise
