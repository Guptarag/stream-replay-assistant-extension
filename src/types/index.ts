export interface Highlight {
  id: string;
  videoId: string;
  timestamp: number; // seconds
  note: string;
  thumbnail: string; // base64 data URL
  createdAt: number; // epoch ms
}

export interface VideoHighlights {
  videoId: string;
  highlights: Highlight[];
}

export interface StorageData {
  [videoId: string]: Highlight[];
}

export type SortOrder = "asc" | "desc";

export interface AppState {
  highlights: Highlight[];
  videoId: string | null;
  collapsed: boolean;
  isCapturing: boolean;
}

export interface ChromeMessage {
  type: "MARK_HIGHLIGHT" | "GET_VIDEO_INFO";
  payload?: unknown;
}

export interface VideoInfo {
  videoId: string;
  currentTime: number;
  thumbnail: string;
}
