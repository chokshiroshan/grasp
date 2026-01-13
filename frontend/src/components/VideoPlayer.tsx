import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'
import { useLearningStore } from '../store/learningStore'

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string
          events: {
            onReady?: (event: { target: YTPlayer }) => void
            onStateChange?: (event: { data: number }) => void
          }
          playerVars?: {
            autoplay?: number
            controls?: number
            modestbranding?: number
            rel?: number
          }
        }
      ) => YTPlayer
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

interface YTPlayer {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  getVolume: () => number
  setVolume: (volume: number) => void
  mute: () => void
  unMute: () => void
  isMuted: () => boolean
  destroy: () => void
}

interface VideoPlayerProps {
  videoId: string
}

export function VideoPlayer({ videoId }: VideoPlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null)
  const intervalRef = useRef<number | null>(null)
  const isSeekingRef = useRef(false)
  const [isReady, setIsReady] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(0)

  const { currentTimestamp, isPlaying, setCurrentTimestamp, setIsPlaying } = useLearningStore()

  useEffect(() => {
    // Reset state when video changes
    setIsReady(false)
    setDuration(0)

    // Clean up previous player and interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (playerRef.current) {
      try {
        playerRef.current.destroy()
      } catch (e) {
        // Player might already be destroyed
      }
      playerRef.current = null
    }

    const initPlayer = () => {
      // Make sure container exists
      const container = document.getElementById('youtube-player')
      if (!container) return

      // Clear the container
      container.innerHTML = ''

      // Create a new div for the player
      const playerDiv = document.createElement('div')
      playerDiv.id = 'youtube-player-instance'
      playerDiv.style.width = '100%'
      playerDiv.style.height = '100%'
      container.appendChild(playerDiv)

      try {
        playerRef.current = new window.YT.Player('youtube-player-instance', {
          videoId,
          events: {
            onReady: (event) => {
              setIsReady(true)
              setDuration(event.target.getDuration())
            },
            onStateChange: (event) => {
              // YT.PlayerState: PLAYING = 1, PAUSED = 2
              setIsPlaying(event.data === 1)
            },
          },
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
          },
        })

        // Update timestamp every second (only when not seeking)
        intervalRef.current = window.setInterval(() => {
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function' && !isSeekingRef.current) {
            try {
              setCurrentTimestamp(playerRef.current.getCurrentTime())
            } catch (e) {
              // Player might not be ready
            }
          }
        }, 1000)
      } catch (e) {
        console.error('Failed to initialize YouTube player:', e)
      }
    }

    // Load YouTube IFrame API if not loaded
    if (!window.YT || !window.YT.Player) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = initPlayer
    } else {
      // API already loaded, init player directly
      // Small delay to ensure DOM is ready
      setTimeout(initPlayer, 100)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (e) {
          // Player might already be destroyed
        }
      }
    }
  }, [videoId])

  const togglePlay = () => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }

  const toggleMute = () => {
    if (!playerRef.current) return
    if (isMuted) {
      playerRef.current.unMute()
    } else {
      playerRef.current.mute()
    }
    setIsMuted(!isMuted)
  }

  const handleSeekStart = () => {
    isSeekingRef.current = true
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTimestamp(time)
  }

  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement
    const time = parseFloat(target.value)

    if (playerRef.current && isReady) {
      try {
        playerRef.current.seekTo(time, true)
      } catch (err) {
        console.error('Seek error:', err)
      }
    }

    isSeekingRef.current = false
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex-1 relative">
        <div id="youtube-player" className="absolute inset-0 w-full h-full" />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        )}
      </div>

      {/* Custom controls */}
      <div className="bg-gray-800 px-4 py-3 space-y-2">
        {/* Progress bar */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTimestamp}
          onMouseDown={handleSeekStart}
          onTouchStart={handleSeekStart}
          onChange={handleSeek}
          onMouseUp={handleSeekEnd}
          onTouchEnd={handleSeekEnd}
          disabled={!isReady}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              disabled={!isReady}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>

            <span className="text-sm text-gray-300">
              {formatTime(currentTimestamp)} / {formatTime(duration)}
            </span>
          </div>

          <button className="p-2 hover:bg-gray-700 rounded-full transition-colors">
            <Maximize className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
