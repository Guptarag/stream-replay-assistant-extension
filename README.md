# Live Assist Mode 🎮

> **AI-powered highlight detection for streamers**

A production-ready Chrome Extension that helps streamers detect and bookmark highlight-worthy moments while watching their own live streams or replays on YouTube and Twitch.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react)


---

## ✨ Features

- **📌 Manual Bookmarking** - Instantly mark highlights with keyboard shortcuts
- **💬 AI Chat Spike Detection** - Automatically detect exciting moments from chat activity
- **🎯 Live Overlay** - Real-time highlight counter on your video player
- **📊 Smart Analytics** - Confidence scoring for each detected highlight
- **🔄 Event Merging** - Combine nearby highlights to avoid duplicates
- **📤 Export Highlights** - Download your highlights as JSON for further processing
- **🎬 Quick Navigation** - Jump directly to any bookmarked timestamp
- **💾 Persistent Storage** - All highlights saved per video ID

## 🚀 Installation Guide

### For Users

1. **Download the Extension**
   - Clone or download this repository
   - Or download the latest release from the releases page

2. **Build the Extension**
   ```bash
   npm install
   npm run build
   ```

3. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the `dist` folder from the built extension

4. **Verify Installation**
   - You should see the "Live Assist Mode" extension icon in your toolbar
   - The extension is now ready to use on YouTube and Twitch!

### First-Time Setup

1. **Navigate to a Stream**
   - Go to YouTube (youtube.com/watch or youtube.com/live)
   - Or Twitch (twitch.tv)

2. **Start Using**
   - The extension automatically activates on supported platforms
   - A live overlay will appear when you create your first highlight

## 🎮 How to Use

### Keyboard Shortcuts

The extension uses **device-specific keyboard shortcuts**:

- **Windows/Linux**: `Alt+X`
- **Mac**: `Ctrl+Shift+X`

Press the shortcut while watching a stream to instantly bookmark the current moment!

### Manual Bookmarking

1. Watch your stream or replay
2. When something exciting happens, press the keyboard shortcut
3. A notification will confirm the highlight was saved
4. The live overlay will update with your highlight count

### Viewing Your Highlights

1. Click the **Live Assist Mode** extension icon in your toolbar
2. Browse all your bookmarked highlights
3. Filter by:
   - **All** - View everything
   - **Manual** - Only your manual bookmarks
   - **Chat Spikes** - AI-detected highlights

### Managing Highlights

- **Jump to Timestamp** - Click the play button to seek to that moment
- **Open in New Tab** - Open the video at the exact timestamp
- **Delete** - Remove unwanted highlights
- **Export** - Download all highlights as JSON
- **Merge Nearby Events** - Combine highlights within a time window

### AI Chat Spike Detection

The extension automatically monitors chat activity and detects:
- Sudden increases in message frequency
- Repeated words and phrases
- Emote spam patterns

Each detected spike is assigned a confidence level (low/medium/high) based on the intensity of chat activity.

## ⚙️ Settings

Customize your experience:
- **Enable/Disable Chat Spike Detection**
- **Adjust Chat Spike Sensitivity** (threshold multiplier)
- **Set Merge Window** (seconds to group nearby events)
- **Toggle Live Overlay** (show/hide on-screen counter)

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

## 🌐 Supported Platforms

- ✅ YouTube (youtube.com/watch, youtube.com/live)
- ✅ Twitch (twitch.tv)

## 🔧 Troubleshooting

### Extension Not Working?

1. **Check if you're on a supported platform**
   - The extension only works on YouTube and Twitch video pages
   - Make sure you're on a `/watch` or `/live` page

2. **Keyboard shortcut not responding?**
   - Verify you're using the correct shortcut for your OS:
     - Windows/Linux: `Alt+X`
     - Mac: `Ctrl+Shift+X`
   - Make sure the video page has focus (click on the page first)
   - Check Chrome's extension shortcuts at `chrome://extensions/shortcuts`

3. **Overlay not appearing?**
   - Check if overlay is enabled in settings
   - Create at least one highlight to activate the overlay
   - Try refreshing the page

4. **Highlights not saving?**
   - Check browser console for errors (F12)
   - Ensure the extension has proper permissions
   - Try reinstalling the extension

### Need Help?

- Check the [Issues](../../issues) page for known problems
- Submit a new issue with detailed information about your problem

## 📊 Tech Stack

- React 18
- TypeScript
- Vite
- TailwindCSS
- Chrome Extension APIs (Manifest V3)
- IndexedDB for local storage

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

---

**Made with ❤️ for streamers**
