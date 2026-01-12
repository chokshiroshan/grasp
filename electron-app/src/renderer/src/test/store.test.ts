import { describe, it, expect, beforeEach } from 'vitest'
import { useLearningStore } from '../store/learningStore'

describe('LearningStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useLearningStore.getState().reset()
  })

  describe('Video State', () => {
    it('should set current video', () => {
      const store = useLearningStore.getState()
      const mockVideo = {
        id: 'test123',
        youtube_id: 'abc123',
        title: 'Test Video',
        duration: 600,
      }

      store.setCurrentVideo(mockVideo)

      expect(useLearningStore.getState().currentVideo).toEqual(mockVideo)
    })

    it('should update timestamp', () => {
      const store = useLearningStore.getState()

      store.setCurrentTimestamp(42.5)

      expect(useLearningStore.getState().currentTimestamp).toBe(42.5)
    })

    it('should update playing status', () => {
      const store = useLearningStore.getState()

      store.setIsPlaying(true)
      expect(useLearningStore.getState().isPlaying).toBe(true)

      store.setIsPlaying(false)
      expect(useLearningStore.getState().isPlaying).toBe(false)
    })
  })

  describe('Messages State', () => {
    it('should add message', () => {
      const store = useLearningStore.getState()
      const message = {
        role: 'user' as const,
        content: 'Test message',
      }

      store.addMessage(message)

      expect(useLearningStore.getState().messages).toHaveLength(1)
      expect(useLearningStore.getState().messages[0]).toEqual(message)
    })

    it('should set messages', () => {
      const store = useLearningStore.getState()
      const messages = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there' },
      ]

      store.setMessages(messages)

      expect(useLearningStore.getState().messages).toEqual(messages)
    })

    it('should update loading state', () => {
      const store = useLearningStore.getState()

      store.setIsLoadingChat(true)
      expect(useLearningStore.getState().isLoadingChat).toBe(true)

      store.setIsLoadingChat(false)
      expect(useLearningStore.getState().isLoadingChat).toBe(false)
    })
  })

  describe('Notes State', () => {
    it('should add note', () => {
      const store = useLearningStore.getState()
      const note = {
        id: 1,
        video_id: 'test123',
        timestamp: 10.5,
        content: 'Test note',
        tags: ['test'],
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }

      store.addNote(note)

      expect(useLearningStore.getState().notes).toHaveLength(1)
      expect(useLearningStore.getState().notes[0]).toEqual(note)
    })

    it('should sort notes by timestamp', () => {
      const store = useLearningStore.getState()
      const note1 = {
        id: 1,
        video_id: 'test',
        timestamp: 20,
        content: 'Second',
        tags: [],
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }
      const note2 = {
        id: 2,
        video_id: 'test',
        timestamp: 10,
        content: 'First',
        tags: [],
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }

      store.addNote(note1)
      store.addNote(note2)

      const notes = useLearningStore.getState().notes
      expect(notes[0].timestamp).toBe(10)
      expect(notes[1].timestamp).toBe(20)
    })

    it('should update note', () => {
      const store = useLearningStore.getState()
      const note = {
        id: 1,
        video_id: 'test',
        timestamp: 5,
        content: 'Original',
        tags: [],
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }

      store.addNote(note)
      store.updateNote(1, { content: 'Updated' })

      const updatedNote = useLearningStore.getState().notes[0]
      expect(updatedNote.content).toBe('Updated')
    })

    it('should remove note', () => {
      const store = useLearningStore.getState()
      const note = {
        id: 1,
        video_id: 'test',
        timestamp: 5,
        content: 'To delete',
        tags: [],
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }

      store.addNote(note)
      expect(useLearningStore.getState().notes).toHaveLength(1)

      store.removeNote(1)
      expect(useLearningStore.getState().notes).toHaveLength(0)
    })
  })

  describe('UI State', () => {
    it('should set active tab', () => {
      const store = useLearningStore.getState()

      store.setActiveTab('notes')
      expect(useLearningStore.getState().activeTab).toBe('notes')

      store.setActiveTab('chat')
      expect(useLearningStore.getState().activeTab).toBe('chat')
    })

    it('should set error', () => {
      const store = useLearningStore.getState()

      store.setError('Test error')
      expect(useLearningStore.getState().error).toBe('Test error')

      store.setError(null)
      expect(useLearningStore.getState().error).toBeNull()
    })
  })

  describe('Reset', () => {
    it('should reset all state', () => {
      const store = useLearningStore.getState()

      // Set some state
      store.setCurrentVideo({ id: 'test', youtube_id: 'abc', title: 'Test', duration: 100 })
      store.addMessage({ role: 'user', content: 'Hello' })
      store.setActiveTab('notes')
      store.setError('Error')

      // Reset
      store.reset()

      const state = useLearningStore.getState()
      expect(state.currentVideo).toBeNull()
      expect(state.messages).toHaveLength(0)
      expect(state.activeTab).toBe('chat')
      expect(state.error).toBeNull()
    })
  })
})
