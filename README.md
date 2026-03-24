# Globe App

Interactive 3D globe visualization built with React, Three.js, and TypeScript.

## Features

- Interactive 3D globe with country selection
- Country information panel with stats and flags
- Responsive design (desktop & mobile)
- Modern UI with Tailwind CSS
- Fast data fetching with TanStack Query

## Tech Stack

- **React 19** + **TypeScript**
- **Three.js** - 3D rendering
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching
- **Popover API** - Native modal interactions

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## Project Structure

```
src/
├── components/     # React components
├── globe/          # Three.js globe logic
├── hooks/          # Custom React hooks
├── api/            # API clients
└── utils/          # Helper functions
```

## Development

- Dev server runs on `http://localhost:5173`
- Hot module replacement enabled
- ESLint + Prettier configured

## License

MIT
