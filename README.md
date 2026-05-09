# Stream Replay Assistant

A Chrome extension that helps you bookmark and review important moments while watching YouTube stream replays.

## Features

### Core Functionality
- **Quick Highlight Marking** - Instantly bookmark moments with a single click or keyboard shortcut (Alt+X)
- **Timestamp Capture** - Automatically captures the exact timestamp when you mark a highlight
- **Video Thumbnails** - Each highlight includes a thumbnail preview for easy visual reference
- **Jump to Timestamp** - Click any highlight to instantly seek to that moment in the video
- **Add Notes** - Attach custom notes (up to 80 characters) to each highlight for context
- **Export Data** - Export all your highlights as JSON for backup or sharing

### User Experience
- **Collapsible Sidebar** - Minimize the extension panel to maximize viewing space
- **Real-time Saving** - Highlights are automatically saved to Chrome storage
- **Cross-Platform Shortcuts** - Keyboard shortcuts work on both Mac and Windows
- **Visual Feedback** - Confirmation animations when highlights are saved
- **Empty State Guidance** - Helpful hints for first-time users

### YouTube Integration
- Works seamlessly on YouTube watch pages
- Non-intrusive sidebar interface
- Persists highlights per video ID

## Development

Install dependencies:
```bash
npm install
```

Run in development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

## Tech Stack

- React 18
- TypeScript
- Vite
- TailwindCSS
- Chrome Extension APIs
