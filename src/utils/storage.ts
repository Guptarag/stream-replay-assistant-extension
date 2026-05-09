import type { HighlightEvent, HighlightStorage } from "../types";

const STORAGE_KEY = "sra_highlights";

/**
 * Load all highlight data from chrome.storage.local
 */
export async function loadAllHighlights(): Promise<HighlightStorage> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      resolve((result[STORAGE_KEY] as HighlightStorage) ?? {});
    });
  });
}

/**
 * Get highlights for a specific video
 */
export async function getHighlights(videoId: string): Promise<HighlightEvent[]> {
  const all = await loadAllHighlights();
  return all[videoId] ?? [];
}

/**
 * Save a new highlight for a video
 */
export async function saveHighlight(highlight: HighlightEvent): Promise<void> {
  const all = await loadAllHighlights();
  const existing = all[highlight.videoId] ?? [];
  // Insert sorted by timestamp
  const updated = [...existing, highlight].sort(
    (a, b) => a.timestamp - b.timestamp
  );
  all[highlight.videoId] = updated;
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: all }, resolve);
  });
}

/**
 * Update the note on an existing highlight
 */
export async function updateHighlightNote(
  videoId: string,
  highlightId: string,
  note: string
): Promise<void> {
  const all = await loadAllHighlights();
  const highlights = all[videoId] ?? [];
  const idx = highlights.findIndex((h: HighlightEvent) => h.id === highlightId);
  if (idx !== -1) {
    highlights[idx] = { ...highlights[idx], note };
    all[videoId] = highlights;
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: all }, resolve);
    });
  }
}

/**
 * Delete a highlight by id
 */
export async function deleteHighlight(
  videoId: string,
  highlightId: string
): Promise<void> {
  const all = await loadAllHighlights();
  const highlights = all[videoId] ?? [];
  all[videoId] = highlights.filter((h: HighlightEvent) => h.id !== highlightId);
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: all }, resolve);
  });
}

/**
 * Export highlights for a video as JSON string
 */
export async function exportHighlights(videoId: string): Promise<string> {
  const highlights = await getHighlights(videoId);
  return JSON.stringify({ videoId, highlights }, null, 2);
}
