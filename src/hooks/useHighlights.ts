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

  return {
    highlights,
    videoId,
    isCapturing,
    lastSaved,
    markHighlight,
    updateNote,
    removeHighlight,
    exportJSON,
  };
}
