# Grasp Frontend

This is the frontend web application for Grasp, built with Vite + React + TypeScript.

## Tech Stack

- **Build Tool**: Vite 7.x
- **Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Markdown**: react-markdown
- **Icons**: lucide-react

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

**Note**: The backend must be running on `http://localhost:8000` for the app to work.

### Building

```bash
# Create production build
npm run build
```

Build output will be in the `dist/` directory.

### Preview Production Build

```bash
# Preview the production build locally
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── VideoPlayer.tsx  # YouTube video player
│   │   ├── ChatInterface.tsx # AI chat interface
│   │   ├── NotesPanel.tsx   # Timestamped notes
│   │   └── ...
│   ├── services/
│   │   └── api.ts           # Backend API client (Axios)
│   ├── store/
│   │   └── learningStore.ts # Zustand state management
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Root component
│   ├── main.tsx             # App entry point
│   └── index.css            # Tailwind CSS
├── dist/                    # Build output (gitignored)
├── public/                  # Static assets
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

The frontend expects the backend to be running on `http://localhost:8000` by default.

To change the backend URL, update the `API_BASE_URL` in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8000';
```

For production, you'll need to update this to your backend server URL.

## Key Features

### Video Player
- YouTube IFrame API integration
- Custom seek bar with drag support
- Real-time timestamp tracking

### Chat Interface
- AI-powered Q&A about video content
- Context-aware responses using RAG
- Support for multiple LLM providers (OpenAI, Anthropic, Gemini)

### Notes Panel
- Create timestamped notes while watching
- Edit and delete notes
- Export notes as Markdown

### State Management
- Zustand for global state
- Video state (timestamp, playing status)
- Messages and notes cached per video
- Both tabs stay mounted (hidden when inactive)

## Deployment

### Static Hosting

The build output can be deployed to any static hosting service:

#### Vercel
```bash
npm run build
# Deploy dist/ folder to Vercel
```

#### Netlify
```bash
npm run build
# Deploy dist/ folder to Netlify
```

#### GitHub Pages
```bash
npm run build
# Upload dist/ contents to gh-pages branch
```

#### Nginx/Apache
```bash
npm run build
# Copy dist/ contents to web server directory
```

### Backend Configuration

Remember to update the backend URL in `src/services/api.ts` for production deployments.

## Troubleshooting

### Cannot connect to backend
- Ensure backend is running on `http://localhost:8000`
- Check browser console for CORS errors
- Verify backend has CORS enabled

### Video player not loading
- Check YouTube API is loaded
- Verify video ID is valid
- Check browser console for errors

### Build errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run lint`
- Ensure all dependencies are up to date

## Development Notes

### Adding Components
- Place React components in `src/components/`
- Use TypeScript for type safety
- Follow existing naming conventions

### Styling
- Use Tailwind utility classes
- Avoid inline styles when possible
- Dark mode is the default theme

### State Management
- Use Zustand store for global state
- Avoid prop drilling
- Keep component state local when possible

## Learn More

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## License

MIT License - see LICENSE file in project root for details.
