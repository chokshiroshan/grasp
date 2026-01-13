import axios from 'axios'

const API_BASE = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Video {
  id: string
  youtube_id: string
  title: string
  duration: number
  chunk_count?: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  context_chunks?: Array<{
    text: string
    start_time: number
    end_time: number
  }>
}

export interface Note {
  id: number
  video_id: string
  timestamp: number
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

// Video endpoints
export const loadVideo = async (url: string): Promise<Video> => {
  const response = await api.post('/api/video/load', { url })
  return response.data
}

export const getVideo = async (videoId: string): Promise<Video> => {
  const response = await api.get(`/api/video/${videoId}`)
  return response.data
}

export const listVideos = async (): Promise<Video[]> => {
  const response = await api.get('/api/videos')
  return response.data
}

// Chat endpoints
export const sendMessage = async (
  videoId: string,
  message: string,
  currentTimestamp: number = 0
): Promise<ChatMessage> => {
  const response = await api.post('/api/chat/message', {
    video_id: videoId,
    message,
    current_timestamp: currentTimestamp,
  })
  return response.data
}

export const getChatHistory = async (videoId: string): Promise<ChatMessage[]> => {
  const response = await api.get(`/api/chat/history/${videoId}`)
  return response.data
}

// Notes endpoints
export const createNote = async (
  videoId: string,
  timestamp: number,
  content: string,
  tags: string[] = []
): Promise<Note> => {
  const response = await api.post('/api/notes', {
    video_id: videoId,
    timestamp,
    content,
    tags,
  })
  return response.data
}

export const getNotes = async (videoId: string): Promise<Note[]> => {
  const response = await api.get(`/api/notes/${videoId}`)
  return response.data
}

export const updateNote = async (
  noteId: number,
  content?: string,
  tags?: string[]
): Promise<Note> => {
  const response = await api.put(`/api/notes/${noteId}`, { content, tags })
  return response.data
}

export const deleteNote = async (noteId: number): Promise<void> => {
  await api.delete(`/api/notes/${noteId}`)
}

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    await api.get('/health')
    return true
  } catch {
    return false
  }
}

export default api
