import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock axios before importing anything
vi.mock('axios', () => {
  const mockInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }

  return {
    default: {
      create: vi.fn(() => mockInstance),
    },
  }
})

// Import after mocking
import axios from 'axios'
import {
  loadVideo,
  getVideo,
  listVideos,
  sendMessage,
  getChatHistory,
  createNote,
  getNotes,
  updateNote,
  deleteNote,
  healthCheck,
} from '../services/api'

// Get reference to the mock instance
const mockAxiosInstance = (axios.create as any)()

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Video API', () => {
    it('should load video', async () => {
      const mockVideo = {
        id: 'test123',
        youtube_id: 'abc123',
        title: 'Test Video',
        duration: 600,
        chunk_count: 10,
      }

      mockAxiosInstance.post.mockResolvedValue({ data: mockVideo })

      const result = await loadVideo('https://youtube.com/watch?v=abc123')
      expect(result).toEqual(mockVideo)
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/video/load', {
        url: 'https://youtube.com/watch?v=abc123',
      })
    })

    it('should get video by ID', async () => {
      const mockVideo = {
        id: 'test123',
        youtube_id: 'abc123',
        title: 'Test Video',
        duration: 600,
      }

      mockAxiosInstance.get.mockResolvedValue({ data: mockVideo })

      const result = await getVideo('test123')
      expect(result).toEqual(mockVideo)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/video/test123')
    })

    it('should list videos', async () => {
      const mockVideos = [
        { id: 'test1', youtube_id: 'abc', title: 'Video 1', duration: 300 },
        { id: 'test2', youtube_id: 'def', title: 'Video 2', duration: 400 },
      ]

      mockAxiosInstance.get.mockResolvedValue({ data: mockVideos })

      const result = await listVideos()
      expect(result).toEqual(mockVideos)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/videos')
    })
  })

  describe('Chat API', () => {
    it('should send message', async () => {
      const mockResponse = {
        role: 'assistant',
        content: 'Test response',
        context_chunks: [],
      }

      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse })

      const result = await sendMessage('test123', 'Hello', 10.5)
      expect(result).toEqual(mockResponse)
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/chat/message', {
        video_id: 'test123',
        message: 'Hello',
        current_timestamp: 10.5,
      })
    })

    it('should get chat history', async () => {
      const mockHistory = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ]

      mockAxiosInstance.get.mockResolvedValue({ data: mockHistory })

      const result = await getChatHistory('test123')
      expect(result).toEqual(mockHistory)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/chat/history/test123')
    })
  })

  describe('Notes API', () => {
    it('should create note', async () => {
      const mockNote = {
        id: 1,
        video_id: 'test123',
        timestamp: 42.5,
        content: 'Test note',
        tags: ['test'],
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }

      mockAxiosInstance.post.mockResolvedValue({ data: mockNote })

      const result = await createNote('test123', 42.5, 'Test note', ['test'])
      expect(result).toEqual(mockNote)
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/notes', {
        video_id: 'test123',
        timestamp: 42.5,
        content: 'Test note',
        tags: ['test'],
      })
    })

    it('should get notes', async () => {
      const mockNotes = [
        {
          id: 1,
          video_id: 'test123',
          timestamp: 10,
          content: 'Note 1',
          tags: [],
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ]

      mockAxiosInstance.get.mockResolvedValue({ data: mockNotes })

      const result = await getNotes('test123')
      expect(result).toEqual(mockNotes)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/notes/test123')
    })

    it('should update note', async () => {
      const mockNote = {
        id: 1,
        video_id: 'test123',
        timestamp: 10,
        content: 'Updated note',
        tags: ['updated'],
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      }

      mockAxiosInstance.put.mockResolvedValue({ data: mockNote })

      const result = await updateNote(1, 'Updated note', ['updated'])
      expect(result).toEqual(mockNote)
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/api/notes/1', {
        content: 'Updated note',
        tags: ['updated'],
      })
    })

    it('should delete note', async () => {
      mockAxiosInstance.delete.mockResolvedValue({})

      await expect(deleteNote(1)).resolves.toBeUndefined()
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/api/notes/1')
    })
  })

  describe('Health Check', () => {
    it('should return true when healthy', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { status: 'healthy' } })

      const result = await healthCheck()
      expect(result).toBe(true)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health')
    })

    it('should return false on error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'))

      const result = await healthCheck()
      expect(result).toBe(false)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health')
    })
  })
})
