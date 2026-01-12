import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useLearningStore } from '../store/learningStore'
import { sendMessage, getChatHistory } from '../services/api'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    currentVideo,
    currentTimestamp,
    messages,
    isLoadingChat,
    setMessages,
    addMessage,
    setIsLoadingChat,
    setError,
  } = useLearningStore()

  const loadedVideoRef = useRef<string | null>(null)

  useEffect(() => {
    // Only load history once per video
    if (currentVideo && loadedVideoRef.current !== currentVideo.id) {
      loadedVideoRef.current = currentVideo.id
      loadHistory()
    }
  }, [currentVideo?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadHistory = async () => {
    if (!currentVideo) return
    try {
      const history = await getChatHistory(currentVideo.id)
      setMessages(history)
    } catch (err) {
      console.error('Failed to load chat history:', err)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || !currentVideo || isLoadingChat) return

    const userMessage = input.trim()
    setInput('')

    // Add user message immediately
    addMessage({ role: 'user', content: userMessage })
    setIsLoadingChat(true)

    try {
      const response = await sendMessage(currentVideo.id, userMessage, currentTimestamp)
      addMessage(response)
    } catch (err) {
      setError('Failed to send message. Is the backend running?')
      console.error('Chat error:', err)
    } finally {
      setIsLoadingChat(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!currentVideo) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Load a video to start chatting
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>Ask questions about the video content.</p>
            <p className="text-sm mt-2">The AI will use relevant transcript context to answer.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}

              {msg.context_chunks && Array.isArray(msg.context_chunks) && msg.context_chunks.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-600">
                  <p className="text-xs text-gray-400">
                    Context from: {msg.context_chunks.map(c =>
                      `${formatTimestamp(c.start_time)}-${formatTimestamp(c.end_time)}`
                    ).join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoadingChat && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg px-4 py-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the video..."
            rows={1}
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoadingChat}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Current timestamp: {formatTimestamp(currentTimestamp)}
        </p>
      </div>
    </div>
  )
}
