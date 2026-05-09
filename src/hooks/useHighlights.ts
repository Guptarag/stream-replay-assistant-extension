import { useState, useEffect, useCallback, useRef } from "react";
import type { Highlight } from "../types";
import {
  getHighlights,
  saveHighlight,
  deleteHighlight,
  updateHighlightNote,
  exportHighlights,
} from "../utils/storage";
import {
  getVideoId,
  getCurrentTime,
  captureVideoFrame,
  generateId,
} from "../utils/youtube";

export function useHighlights() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const videoIdRef = useRef<string | null>(null);

  // Load highlights when videoId changes
  const loadHighlights = useCallback(async (vid: string) => {
    const data = await getHighlights(vid);
    setHighlights(data);
  }, []);

  // Initialize and watch for video changes
  useEffect(() => {
    const vid = getVideoId();
    if (vid) {
      setVideoId(vid);
      videoIdRef.current = vid;
      loadHighlights(vid);
    }

    // Listen for storage changes (e.g. from keyboard shortcut)
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area === "local" && changes["sra_highlights"] && videoIdRef.current) {
        loadHighlights(videoIdRef.current);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadHighlights]);

  // Mark a new highlight at the current timestamp
  const markHighlight = useCallback(async () => {
    const vid = getVideoId();
    if (!vid) return;

    setIsCapturing(true);
    try {
      const timestamp = getCurrentTime();
      const thumbnail = captureVideoFrame();
      const highlight: Highlight = {
        id: generateId(),
        videoId: vid,
        timestamp,
        note: "",
        thumbnail,
        createdAt: Date.now(),
      };

      await saveHighlight(highlight);
      setHighlights((prev) =>
        [...prev, highlight].sort((a, b) => a.timestamp - b.timestamp)
      );
      setLastSaved(highlight.id);
      // Clear flash indicator after 1.5s
      setTimeout(() => setLastSaved(null), 1500);
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Update note for a highlight
  const updateNote = useCallback(
    async (highlightId: string, note: string) => {
      if (!videoId) return;
      await updateHighlightNote(videoId, highlightId, note);
      setHighlights((prev) =>
        prev.map((h) => (h.id === highlightId ? { ...h, note } : h))
      );
    },
    [videoId]
  );

  // Delete a highlight
  const removeHighlight = useCallback(
    async (highlightId: string) => {
      if (!videoId) return;
      await deleteHighlight(videoId, highlightId);
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    },
    [videoId]
  );

  // Export highlights as downloadable JSON
  const exportJSON = useCallback(async () => {
    if (!videoId) return;
    const json = await exportHighlights(videoId);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `highlights-${videoId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [videoId]);

  // Download all clips with configurable buffer in selected format
  const downloadClips = useCallback((format: 'open' | 'ytdlp' | 'txt' = 'open', bufferSeconds: number = 10) => {
    console.log('downloadClips called with format:', format, 'buffer:', bufferSeconds);
    console.log('videoId:', videoId);
    console.log('highlights:', highlights);
    
    if (!videoId || highlights.length === 0) {
      console.log('No videoId or highlights, returning early');
      return;
    }

    const clipsData = highlights.map((highlight, index) => ({
      clipNumber: index + 1,
      originalTimestamp: highlight.timestamp,
      startTime: Math.max(0, highlight.timestamp - bufferSeconds),
      endTime: highlight.timestamp + bufferSeconds,
      duration: bufferSeconds * 2,
      note: highlight.note || '',
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}&t=${Math.max(0, highlight.timestamp - bufferSeconds)}s`,
    }));

    console.log('clipsData:', clipsData);

    if (format === 'open') {
      console.log('Opening clips in browser...');
      // Open each clip in a new tab with timestamp
      // Users can use browser extensions like "Video DownloadHelper" to download
      clipsData.forEach((clip, index) => {
        setTimeout(() => {
          console.log('Opening clip:', clip.youtubeUrl);
          const opened = window.open(clip.youtubeUrl, '_blank');
          if (!opened) {
            console.error('Failed to open window - popup blocker?');
          }
        }, index * 300); // Stagger opening to avoid browser blocking
      });
    } 
    else if (format === 'ytdlp') {
      console.log('Generating yt-dlp script...');
      // Generate shell script with yt-dlp commands
      let scriptContent = '#!/bin/bash\n\n';
      scriptContent += `# Download clips from YouTube video: ${videoId}\n`;
      scriptContent += `# Total clips: ${highlights.length}\n`;
      scriptContent += `# Each clip includes ${bufferSeconds} seconds before and after the marked timestamp\n\n`;
      
      clipsData.forEach((clip) => {
        scriptContent += `# Clip ${clip.clipNumber}${clip.note ? ` - ${clip.note}` : ''}\n`;
        scriptContent += `# Original timestamp: ${clip.originalTimestamp}s, Range: ${clip.startTime}s - ${clip.endTime}s\n`;
        scriptContent += `yt-dlp "https://www.youtube.com/watch?v=${videoId}" --download-sections "*${clip.startTime}-${clip.endTime}" -o "clip-${clip.clipNumber}.mp4"\n\n`;
      });
      
      const blob = new Blob([scriptContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `download-clips-${videoId}.sh`;
      console.log('Downloading script file:', link.download);
      link.click();
      URL.revokeObjectURL(url);
    } 
    else if (format === 'txt') {
      console.log('Generating text instructions...');
      // Generate detailed text file with instructions
      let textContent = '═══════════════════════════════════════════════════════════\n';
      textContent += '         YOUTUBE CLIPS DOWNLOAD INSTRUCTIONS\n';
      textContent += '═══════════════════════════════════════════════════════════\n\n';
      
      textContent += `Video ID: ${videoId}\n`;
      textContent += `Video URL: https://www.youtube.com/watch?v=${videoId}\n`;
      textContent += `Total Clips: ${highlights.length}\n\n`;
      
      textContent += '───────────────────────────────────────────────────────────\n';
      textContent += `ABOUT THE ${bufferSeconds}-SECOND BUFFER:\n`;
      textContent += '───────────────────────────────────────────────────────────\n';
      textContent += 'Each clip includes:\n';
      textContent += `  • ${bufferSeconds} seconds BEFORE your marked timestamp\n`;
      textContent += `  • ${bufferSeconds} seconds AFTER your marked timestamp\n`;
      textContent += `  • Total clip duration: ${bufferSeconds * 2} seconds\n\n`;
      textContent += 'This buffer ensures you capture the full context of the\n';
      textContent += 'moment without missing any important action.\n\n';
      
      textContent += '───────────────────────────────────────────────────────────\n';
      textContent += 'HOW TO DOWNLOAD CLIPS:\n';
      textContent += '───────────────────────────────────────────────────────────\n\n';
      
      textContent += 'METHOD 1: Using yt-dlp (Recommended)\n';
      textContent += '-------------------------------------\n';
      textContent += '1. Install yt-dlp: https://github.com/yt-dlp/yt-dlp\n';
      textContent += '2. Copy the commands below and run them in your terminal\n';
      textContent += '3. Videos will be downloaded as MP4 files\n\n';
      
      textContent += 'METHOD 2: Browser Extensions\n';
      textContent += '-----------------------------\n';
      textContent += '1. Install a YouTube downloader extension\n';
      textContent += '   (e.g., Video DownloadHelper, SaveFrom.net)\n';
      textContent += '2. Click the YouTube URLs below to open each clip\n';
      textContent += '3. Use the extension to download the video\n';
      textContent += '4. Manually trim to the specified time range\n\n';
      
      textContent += 'METHOD 3: Online Downloaders\n';
      textContent += '----------------------------\n';
      textContent += '1. Visit sites like y2mate.com or savefrom.net\n';
      textContent += '2. Paste the YouTube URLs below\n';
      textContent += '3. Download and trim to the time range shown\n\n\n';
      
      textContent += '═══════════════════════════════════════════════════════════\n';
      textContent += '                    YOUR CLIPS\n';
      textContent += '═══════════════════════════════════════════════════════════\n\n';
      
      clipsData.forEach((clip) => {
        textContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        textContent += `CLIP ${clip.clipNumber}${clip.note ? `: ${clip.note}` : ''}\n`;
        textContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        textContent += `Marked Timestamp: ${clip.originalTimestamp} seconds\n`;
        textContent += `Clip Start Time:  ${clip.startTime} seconds (${bufferSeconds} sec before)\n`;
        textContent += `Clip End Time:    ${clip.endTime} seconds (${bufferSeconds} sec after)\n`;
        textContent += `Duration:         ${clip.duration} seconds\n\n`;
        
        textContent += `YouTube URL:\n${clip.youtubeUrl}\n\n`;
        
        textContent += `yt-dlp Command:\n`;
        textContent += `yt-dlp "https://www.youtube.com/watch?v=${videoId}" \\\n`;
        textContent += `  --download-sections "*${clip.startTime}-${clip.endTime}" \\\n`;
        textContent += `  -o "clip-${clip.clipNumber}.mp4"\n\n`;
      });
      
      textContent += '═══════════════════════════════════════════════════════════\n';
      textContent += 'Generated by Stream Replay Assistant\n';
      textContent += '═══════════════════════════════════════════════════════════\n';
      
      const blob = new Blob([textContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clips-instructions-${videoId}.txt`;
      console.log('Downloading text file:', link.download);
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [videoId, highlights]);

  return {
    highlights,
    videoId,
    isCapturing,
    lastSaved,
    markHighlight,
    updateNote,
    removeHighlight,
    exportJSON,
    downloadClips,
  };
}
