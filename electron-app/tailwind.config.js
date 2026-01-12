/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        chat: {
          accent: '#3b82f6', // blue
        },
        notes: {
          accent: '#22c55e', // green
        },
        quiz: {
          accent: '#f97316', // orange
        },
        flashcards: {
          accent: '#a855f7', // purple
        },
      },
    },
  },
  plugins: [],
}
