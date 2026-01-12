import re
import yt_dlp
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def extract_youtube_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'youtube\.com\/shorts\/([^&\n?#]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def chunk_transcript(transcript: list[dict], target_tokens: int = 600) -> list[dict]:
    """
    Chunk transcript into segments of approximately target_tokens.
    Each chunk includes start_time, end_time, and text.
    """
    chunks = []
    current_chunk = {
        "text": "",
        "start_time": 0,
        "end_time": 0
    }
    current_tokens = 0

    for segment in transcript:
        text = segment.get("text", "").strip()
        if not text:
            continue

        # Rough token estimate (words * 1.3)
        segment_tokens = len(text.split()) * 1.3

        if current_tokens == 0:
            current_chunk["start_time"] = segment.get("start", 0)

        if current_tokens + segment_tokens > target_tokens and current_tokens > 0:
            # Save current chunk and start new one
            current_chunk["text"] = current_chunk["text"].strip()
            chunks.append(current_chunk)
            current_chunk = {
                "text": text + " ",
                "start_time": segment.get("start", 0),
                "end_time": segment.get("start", 0) + segment.get("duration", 0)
            }
            current_tokens = segment_tokens
        else:
            current_chunk["text"] += text + " "
            current_chunk["end_time"] = segment.get("start", 0) + segment.get("duration", 0)
            current_tokens += segment_tokens

    # Don't forget the last chunk
    if current_chunk["text"].strip():
        current_chunk["text"] = current_chunk["text"].strip()
        chunks.append(current_chunk)

    return chunks


async def extract_video_data(url: str) -> Optional[dict]:
    """
    Extract video metadata and transcript from YouTube URL.
    Returns dict with youtube_id, title, duration, transcript (full text), and chunks.
    """
    youtube_id = extract_youtube_id(url)
    if not youtube_id:
        logger.error(f"Could not extract YouTube ID from URL: {url}")
        return None

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en'],
        'skip_download': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            title = info.get('title', 'Unknown Title')
            duration = info.get('duration', 0)

            # Try to get subtitles/captions
            subtitles = info.get('subtitles', {})
            auto_captions = info.get('automatic_captions', {})

            transcript_data = None

            # Prefer manual subtitles over auto-generated
            if 'en' in subtitles:
                for sub in subtitles['en']:
                    if sub.get('ext') == 'json3':
                        transcript_data = sub
                        break
            elif 'en' in auto_captions:
                for sub in auto_captions['en']:
                    if sub.get('ext') == 'json3':
                        transcript_data = sub
                        break

            # If no json3, try to get any available format
            if not transcript_data:
                # Fall back to extracting from the video directly
                ydl_opts_transcript = {
                    'quiet': True,
                    'no_warnings': True,
                    'skip_download': True,
                    'writesubtitles': True,
                    'writeautomaticsub': True,
                    'subtitlesformat': 'json3',
                    'subtitleslangs': ['en'],
                    'outtmpl': '/tmp/%(id)s',
                }

                # Try using youtube-transcript-api as fallback
                try:
                    from youtube_transcript_api import YouTubeTranscriptApi
                    transcript_list = YouTubeTranscriptApi.get_transcript(youtube_id)
                    transcript_segments = [
                        {
                            "text": seg["text"],
                            "start": seg["start"],
                            "duration": seg["duration"]
                        }
                        for seg in transcript_list
                    ]
                except ImportError:
                    logger.warning("youtube-transcript-api not installed, using yt-dlp only")
                    transcript_segments = []
                except Exception as e:
                    logger.warning(f"Failed to get transcript via youtube-transcript-api: {e}")
                    transcript_segments = []

                if not transcript_segments:
                    # Create a simple transcript from video chapters or description
                    logger.warning(f"No transcript available for video {youtube_id}")
                    return None
            else:
                # Parse json3 format from yt-dlp
                import urllib.request
                import json

                sub_url = transcript_data.get('url')
                if sub_url:
                    with urllib.request.urlopen(sub_url) as response:
                        sub_data = json.loads(response.read().decode())
                        events = sub_data.get('events', [])
                        transcript_segments = []
                        for event in events:
                            if 'segs' in event:
                                text = ''.join(seg.get('utf8', '') for seg in event['segs'])
                                if text.strip():
                                    transcript_segments.append({
                                        "text": text,
                                        "start": event.get('tStartMs', 0) / 1000,
                                        "duration": event.get('dDurationMs', 0) / 1000
                                    })

            # Build full transcript text
            full_transcript = ' '.join(seg['text'] for seg in transcript_segments)

            # Chunk the transcript
            chunks = chunk_transcript(transcript_segments)

            return {
                "youtube_id": youtube_id,
                "title": title,
                "duration": duration,
                "transcript": full_transcript,
                "chunks": chunks
            }

    except Exception as e:
        logger.error(f"Error extracting video data: {e}")
        return None
