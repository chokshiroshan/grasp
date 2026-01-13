import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Clock, Download } from 'lucide-react'
import { useLearningStore } from '../store/learningStore'
import { createNote, getNotes, updateNote, deleteNote } from '../services/api'

export function NotesPanel() {
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const loadedVideoRef = useRef<string | null>(null)

  const {
    currentVideo,
    currentTimestamp,
    notes,
    setNotes,
    addNote,
    updateNote: updateNoteInStore,
    removeNote,
    setError,
  } = useLearningStore()

  useEffect(() => {
    // Only load notes once per video
    if (currentVideo && loadedVideoRef.current !== currentVideo.id) {
      loadedVideoRef.current = currentVideo.id
      loadNotes()
    }
  }, [currentVideo?.id])

  const loadNotes = async () => {
    if (!currentVideo) return
    try {
      const fetchedNotes = await getNotes(currentVideo.id)
      setNotes(fetchedNotes)
    } catch (err) {
      console.error('Failed to load notes:', err)
    }
  }

  const handleCreateNote = async () => {
    if (!newNoteContent.trim() || !currentVideo) return

    try {
      const note = await createNote(currentVideo.id, currentTimestamp, newNoteContent.trim())
      addNote(note)
      setNewNoteContent('')
    } catch (err) {
      setError('Failed to create note')
      console.error('Create note error:', err)
    }
  }

  const handleUpdateNote = async (noteId: number) => {
    if (!editContent.trim()) return

    try {
      const updated = await updateNote(noteId, editContent.trim())
      updateNoteInStore(noteId, updated)
      setEditingId(null)
      setEditContent('')
    } catch (err) {
      setError('Failed to update note')
      console.error('Update note error:', err)
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    try {
      await deleteNote(noteId)
      removeNote(noteId)
    } catch (err) {
      setError('Failed to delete note')
      console.error('Delete note error:', err)
    }
  }

  const startEditing = (noteId: number, content: string) => {
    setEditingId(noteId)
    setEditContent(content)
  }

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const exportNotes = () => {
    if (!currentVideo || notes.length === 0) return

    const markdown = [
      `# Notes: ${currentVideo.title}`,
      '',
      ...notes.map(
        (n) => `## ${formatTimestamp(n.timestamp)}\n\n${n.content}\n`
      ),
    ].join('\n')

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentVideo.title.replace(/[^a-z0-9]/gi, '_')}_notes.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!currentVideo) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Load a video to take notes
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="font-semibold text-white">Notes</h2>
        <button
          onClick={exportNotes}
          disabled={notes.length === 0}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {notes.length === 0 && (
          <p className="text-center text-gray-500">
            No notes yet. Add your first note below.
          </p>
        )}

        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-gray-700 rounded-lg p-3 group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Clock className="w-3 h-3" />
                {formatTimestamp(note.timestamp)}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>

            {editingId === note.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded px-2 py-1 text-sm resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateNote(note.id)}
                    className="text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p
                onClick={() => startEditing(note.id, note.content)}
                className="text-sm text-gray-200 whitespace-pre-wrap cursor-pointer hover:bg-gray-600 rounded p-1 -m-1"
              >
                {note.content}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* New note input */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-green-400" />
          <span className="text-xs text-gray-400">
            {formatTimestamp(currentTimestamp)}
          </span>
        </div>
        <div className="flex gap-2">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Add a note at current timestamp..."
            rows={2}
            className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleCreateNote}
            disabled={!newNoteContent.trim()}
            className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors self-end"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
