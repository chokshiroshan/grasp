import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Get provider from environment
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()


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


# Anthropic/Claude
def get_anthropic_response(system_prompt: str, question: str) -> str:
    from anthropic import Anthropic

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not set")

    client = Anthropic(api_key=api_key)
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        system=system_prompt,
        messages=[{"role": "user", "content": question}]
    )
    return response.content[0].text


# OpenAI
def get_openai_response(system_prompt: str, question: str) -> str:
    from openai import OpenAI

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")

    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=2048,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ]
    )
    return response.choices[0].message.content


# Google Gemini
def get_gemini_response(system_prompt: str, question: str) -> str:
    import google.generativeai as genai

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not set")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=system_prompt
    )
    response = model.generate_content(question)
    return response.text


async def get_chat_response(
    question: str,
    context_chunks: list[dict],
    video_title: str,
    current_timestamp: float = 0.0
) -> str:
    """Get a response from the configured LLM provider with video context."""
    context_text = build_context_text(context_chunks)
    current_time = format_timestamp(current_timestamp)

    system_prompt = SYSTEM_PROMPT.format(
        context=context_text,
        current_time=current_time,
        video_title=video_title
    )

    try:
        if LLM_PROVIDER == "anthropic" or LLM_PROVIDER == "claude":
            return get_anthropic_response(system_prompt, question)
        elif LLM_PROVIDER == "gemini" or LLM_PROVIDER == "google":
            return get_gemini_response(system_prompt, question)
        else:  # default to openai
            return get_openai_response(system_prompt, question)

    except Exception as e:
        logger.error(f"Error getting LLM response ({LLM_PROVIDER}): {e}")
        raise


async def get_chat_response_with_history(
    question: str,
    context_chunks: list[dict],
    video_title: str,
    current_timestamp: float,
    history: list[dict]
) -> str:
    """Get a response with conversation history."""
    # For simplicity, we'll include recent history in the question
    context_text = build_context_text(context_chunks)
    current_time = format_timestamp(current_timestamp)

    system_prompt = SYSTEM_PROMPT.format(
        context=context_text,
        current_time=current_time,
        video_title=video_title
    )

    # Build conversation context from history
    history_text = ""
    for msg in history[-6:]:  # Last 6 messages
        role = "Student" if msg["role"] == "user" else "Assistant"
        history_text += f"{role}: {msg['content']}\n\n"

    full_question = f"Previous conversation:\n{history_text}\nStudent: {question}" if history_text else question

    try:
        if LLM_PROVIDER == "anthropic" or LLM_PROVIDER == "claude":
            return get_anthropic_response(system_prompt, full_question)
        elif LLM_PROVIDER == "gemini" or LLM_PROVIDER == "google":
            return get_gemini_response(system_prompt, full_question)
        else:
            return get_openai_response(system_prompt, full_question)

    except Exception as e:
        logger.error(f"Error getting LLM response ({LLM_PROVIDER}): {e}")
        raise
