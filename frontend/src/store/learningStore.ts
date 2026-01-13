import { create } from 'zustand'
import type { Video, ChatMessage, Note } from '../services/api'

interface LearningState {
  // Current video
  currentVideo: Video | null
  currentTimestamp: number
  isPlaying: boolean

  // Chat
  messages: ChatMessage[]
  isLoadingChat: boolean

  // Notes
  notes: Note[]

  // UI state
  activeTab: 'chat' | 'notes'
  isLoadingVideo: boolean
  error: string | null

  // Actions
  setCurrentVideo: (video: Video | null) => void
  setCurrentTimestamp: (timestamp: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  setIsLoadingChat: (loading: boolean) => void
  setNotes: (notes: Note[]) => void
  addNote: (note: Note) => void
  updateNote: (noteId: number, updates: Partial<Note>) => void
  removeNote: (noteId: number) => void
  setActiveTab: (tab: 'chat' | 'notes') => void
  setIsLoadingVideo: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  currentVideo: null,
  currentTimestamp: 0,
  isPlaying: false,
  messages: [],
  isLoadingChat: false,
  notes: [],
  activeTab: 'chat' as const,
  isLoadingVideo: false,
  error: null,
}

export const useLearningStore = create<LearningState>((set) => ({
  ...initialState,

  setCurrentVideo: (video) => set({ currentVideo: video, error: null }),
  setCurrentTimestamp: (timestamp) => set({ currentTimestamp: timestamp }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  setIsLoadingChat: (loading) => set({ isLoadingChat: loading }),

  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((state) => ({
    notes: [...state.notes, note].sort((a, b) => a.timestamp - b.timestamp)
  })),
  updateNote: (noteId, updates) => set((state) => ({
    notes: state.notes.map((n) => n.id === noteId ? { ...n, ...updates } : n)
  })),
  removeNote: (noteId) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== noteId)
  })),

  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsLoadingVideo: (loading) => set({ isLoadingVideo: loading }),
  setError: (error) => set({ error }),

  reset: () => set(initialState),
}))
