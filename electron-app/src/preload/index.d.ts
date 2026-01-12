declare global {
  interface Window {
    electron: {
      platform: NodeJS.Platform
    }
  }
}

export {}
