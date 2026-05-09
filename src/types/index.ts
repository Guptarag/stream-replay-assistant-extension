export type Platform = 'youtube' | 'twitch';

export type EventSource = 'manual' | 'chat_spike' | 'merged';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface HighlightEvent {
  id: string;
  videoId: string;
  timestamp: number;
  source: EventSource;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  note: string;
  title: string;
  thumbnail: string;
  platform: Platform;
  url: string;
  createdAt: number;
  mergedEventIds?: string[];
}

export interface ChatSpikeMetrics {
  messagesPerSecond: number;
  repeatedWords: Map<string, number>;
  repeatedEmotes: Map<string, number>;
  baselineActivity: number;
  spikeThreshold: number;
}

export interface VideoInfo {
  videoId: string;
  title: string;
  currentTime: number;
  thumbnail: string;
  platform: Platform;
  url: string;
  isLive: boolean;
}

export interface OverlayState {
  isActive: boolean;
  highlightCount: number;
  latestTimestamp: number | null;
  position: { x: number; y: number };
}

export interface ChromeMessage {
  type: 
    | 'MARK_HIGHLIGHT'
    | 'GET_VIDEO_INFO'
    | 'CHAT_SPIKE_DETECTED'
    | 'UPDATE_OVERLAY'
    | 'TOGGLE_OVERLAY'
    | 'EXPORT_HIGHLIGHTS'
    | 'DELETE_EVENT'
    | 'MERGE_EVENTS';
  payload?: any;
}

export interface StorageData {
  events: HighlightEvent[];
  overlayState: OverlayState;
  settings: Settings;
}

export interface HighlightStorage {
  [videoId: string]: HighlightEvent[];
}

export interface Settings {
  chatSpikeEnabled: boolean;
  chatSpikeThreshold: number;
  mergeWindowSeconds: number;
  overlayEnabled: boolean;
}
