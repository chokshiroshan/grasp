import { useState, useEffect } from 'react'
import { MessageSquare, FileText, Loader2, X, Youtube } from 'lucide-react'
import { VideoPlayer } from './components/VideoPlayer'
import { ChatInterface } from './components/ChatInterface'
import { NotesPanel } from './components/NotesPanel'
import { useLearningStore } from './store/learningStore'
import { loadVideo, listVideos, healthCheck, type Video } from './services/api'

function App() {
  const [urlInput, setUrlInput] = useState('')
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [recentVideos, setRecentVideos] = useState<Video[]>([])

  const {
    currentVideo,
    activeTab,
    isLoadingVideo,
    error,
    setCurrentVideo,
    setActiveTab,
    setIsLoadingVideo,
    setError,
    reset,
  } = useLearningStore()

  useEffect(() => {
    checkBackend()
    fetchRecentVideos()
  }, [])

  const checkBackend = async () => {
    const isOnline = await healthCheck()
    setBackendStatus(isOnline ? 'online' : 'offline')
  }

  const fetchRecentVideos = async () => {
    try {
      const videos = await listVideos()
      setRecentVideos(videos)
    } catch (err) {
      console.error('Failed to fetch videos:', err)
    }
  }

  const handleLoadVideo = async () => {
    if (!urlInput.trim()) return

    setIsLoadingVideo(true)
    setError(null)

    try {
      const video = await loadVideo(urlInput.trim())
      setCurrentVideo(video)
      setUrlInput('')
      fetchRecentVideos()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load video'
      setError(errorMessage)
      console.error('Load video error:', err)
    } finally {
      setIsLoadingVideo(false)
    }
  }

  const handleSelectVideo = async (video: Video) => {
    setCurrentVideo(video)
  }

  const handleCloseVideo = () => {
    reset()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLoadVideo()
    }
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-blue-400">Grasp</h1>
          {currentVideo && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">|</span>
              <span className="text-sm text-gray-300 truncate max-w-md">
                {currentVideo.title}
              </span>
              <button
                onClick={handleCloseVideo}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              backendStatus === 'online'
                ? 'bg-green-500'
                : backendStatus === 'offline'
                ? 'bg-red-500'
                : 'bg-yellow-500'
            }`}
          />
          <span className="text-xs text-gray-400">
            {backendStatus === 'online'
              ? 'Backend connected'
              : backendStatus === 'offline'
              ? 'Backend offline'
              : 'Checking...'}
          </span>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-700 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-red-200">{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Main content */}
      {!currentVideo ? (
        /* Landing / Video selection */
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-xl w-full space-y-8">
            <div className="text-center">
              <Youtube className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Load a YouTube Video</h2>
              <p className="text-gray-400">
                Paste a YouTube URL to start learning with AI assistance
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoadingVideo || backendStatus !== 'online'}
              />
              <button
                onClick={handleLoadVideo}
                disabled={!urlInput.trim() || isLoadingVideo || backendStatus !== 'online'}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                {isLoadingVideo ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Load'
                )}
              </button>
            </div>

            {backendStatus === 'offline' && (
              <p className="text-center text-sm text-yellow-400">
                Backend is offline. Run `python main.py` in the backend folder.
              </p>
            )}

            {recentVideos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-400">Recent Videos</h3>
                <div className="space-y-2">
                  {recentVideos.slice(0, 5).map((video) => (
                    <button
                      key={video.id}
                      onClick={() => handleSelectVideo(video)}
                      className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 rounded-lg transition-colors"
                    >
                      <p className="text-sm font-medium truncate">{video.title}</p>
                      <p className="text-xs text-gray-500">
                        {Math.floor(video.duration / 60)} min
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Video player + sidebar */
        <div className="flex-1 flex overflow-hidden">
          {/* Video section - 60% */}
          <div className="w-3/5 border-r border-gray-700">
            <VideoPlayer videoId={currentVideo.youtube_id} />
          </div>

          {/* Sidebar - 40% */}
          <div className="w-2/5 flex flex-col">
            {/* Tab buttons */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'chat'
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'text-green-400 border-b-2 border-green-400 bg-gray-800/50'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                Notes
              </button>
            </div>

            {/* Tab content - keep both mounted to prevent re-renders */}
            <div className="flex-1 overflow-hidden relative">
              <div className={`absolute inset-0 ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
                <ChatInterface />
              </div>
              <div className={`absolute inset-0 ${activeTab === 'notes' ? 'block' : 'hidden'}`}>
                <NotesPanel />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
