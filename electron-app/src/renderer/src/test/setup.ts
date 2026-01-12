import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.electron
global.window.electron = {
  platform: 'darwin',
}

// Mock YouTube IFrame API
global.window.YT = {
  Player: class MockPlayer {
    playVideo = () => {}
    pauseVideo = () => {}
    seekTo = () => {}
    getCurrentTime = () => 0
    getDuration = () => 100
    getVolume = () => 50
    setVolume = () => {}
    mute = () => {}
    unMute = () => {}
    isMuted = () => false
    destroy = () => {}
  } as any,
}
