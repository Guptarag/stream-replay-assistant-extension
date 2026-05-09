import React from 'react';
import ReactDOM from 'react-dom/client';
import { Overlay } from './components/Overlay';
import { PlatformDetector } from './utils/platformDetector';
import { ChatSpikeDetector } from './utils/chatSpikeDetector';
import { EventMerger } from './utils/eventMerger';
import { db } from './utils/db';
import { HighlightEvent, Platform, OverlayState, ChatSpikeMetrics } from './types';

console.log('[Live Assist] Content script loaded');

const overlayStyles = `
.live-assist-overlay {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  user-select: none;
}

.overlay-content {
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  min-width: 200px;
}

.overlay-header {
  margin-bottom: 8px;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

.live-text {
  font-size: 11px;
  font-weight: 700;
  color: #f3f4f6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.overlay-stats {
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid rgba(99, 102, 241, 0.2);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 10px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #6366f1;
}

.overlay-hint {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(99, 102, 241, 0.2);
}

.hint-text {
  font-size: 10px;
  color: #9ca3af;
  font-weight: 500;
  letter-spacing: 0.3px;
}
`;

let overlayRoot: ReactDOM.Root | null = null;
let overlayHost: HTMLElement | null = null;
let chatDetector: ChatSpikeDetector | null = null;
let currentPlatform: Platform | null = null;
let overlayState: OverlayState = {
  isActive: false,
  highlightCount: 0,
  latestTimestamp: null,
  position: { x: 20, y: 20 },
};

async function init() {
  await db.init();
  
  currentPlatform = PlatformDetector.detectPlatform();
  if (!currentPlatform) {
    console.warn('[Live Assist] Not on a supported platform');
    return;
  }

  console.log('[Live Assist] Initializing on', currentPlatform);

  const storedState = await chrome.storage.local.get(['overlayState', 'settings']);
  if (storedState.overlayState) {
    overlayState = storedState.overlayState;
  }

  const settings = storedState.settings || {
    chatSpikeEnabled: true,
    chatSpikeThreshold: 3.0,
    mergeWindowSeconds: 15,
    overlayEnabled: true,
  };

  if (settings.chatSpikeEnabled) {
    startChatDetection(settings.chatSpikeThreshold);
  }

  if (settings.overlayEnabled) {
    mountOverlay();
  }

  const videoInfo = await PlatformDetector.getVideoInfo();
  if (videoInfo) {
    const events = await db.getEventsByVideoId(videoInfo.videoId);
    updateOverlayCount(events.length);
  }
}

function mountOverlay() {
  if (overlayHost) return;

  overlayHost = document.createElement('div');
  overlayHost.id = 'live-assist-overlay-host';
  overlayHost.style.cssText = 'all:initial;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;';
  document.body.appendChild(overlayHost);

  const shadow = overlayHost.attachShadow({ mode: 'open' });

  const styleEl = document.createElement('style');
  styleEl.textContent = overlayStyles;
  shadow.appendChild(styleEl);

  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);

  overlayRoot = ReactDOM.createRoot(mountPoint);
  renderOverlay();
}

function renderOverlay() {
  if (!overlayRoot) return;

  overlayRoot.render(
    React.createElement(Overlay, {
      initialState: overlayState,
      onPositionChange: (position) => {
        overlayState.position = position;
        saveOverlayState();
      },
    })
  );
}

function updateOverlayCount(count: number, latestTimestamp?: number) {
  overlayState.highlightCount = count;
  if (latestTimestamp !== undefined) {
    overlayState.latestTimestamp = latestTimestamp;
  }
  overlayState.isActive = count > 0;
  renderOverlay();
  saveOverlayState();
}

async function saveOverlayState() {
  await chrome.storage.local.set({ overlayState });
}

function startChatDetection(threshold: number) {
  if (!currentPlatform) return;

  chatDetector = new ChatSpikeDetector(
    currentPlatform,
    async (metrics: ChatSpikeMetrics) => {
      await handleChatSpike(metrics);
    },
    threshold
  );

  setTimeout(() => {
    chatDetector?.start();
  }, 2000);
}

async function handleChatSpike(metrics: ChatSpikeMetrics) {
  const videoInfo = await PlatformDetector.getVideoInfo();
  if (!videoInfo) return;

  const confidenceScore = EventMerger.calculateConfidenceScore('chat_spike', {
    activityRatio: metrics.messagesPerSecond / metrics.baselineActivity,
    repeatedWordsCount: Array.from(metrics.repeatedWords.values()).reduce((a, b) => a + b, 0),
    repeatedEmotesCount: Array.from(metrics.repeatedEmotes.values()).reduce((a, b) => a + b, 0),
  });

  const confidence = EventMerger.getConfidenceLevel(confidenceScore);

  const topWords = Array.from(metrics.repeatedWords.entries())
    .slice(0, 3)
    .map(([word]) => word)
    .join(', ');

  const event: HighlightEvent = {
    id: `spike_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    videoId: videoInfo.videoId,
    timestamp: videoInfo.currentTime,
    source: 'chat_spike',
    confidence,
    confidenceScore,
    note: `Chat spike: ${topWords || 'high activity'}`,
    title: videoInfo.title,
    thumbnail: videoInfo.thumbnail,
    platform: videoInfo.platform,
    url: videoInfo.url,
    createdAt: Date.now(),
  };

  await db.addEvent(event);
  console.log('[Live Assist] Chat spike event created:', event);

  const allEvents = await db.getEventsByVideoId(videoInfo.videoId);
  updateOverlayCount(allEvents.length, event.timestamp);
}

async function handleManualBookmark() {
  const videoInfo = await PlatformDetector.getVideoInfo();
  if (!videoInfo) {
    console.warn('[Live Assist] Could not get video info');
    return;
  }

  const event: HighlightEvent = {
    id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    videoId: videoInfo.videoId,
    timestamp: videoInfo.currentTime,
    source: 'manual',
    confidence: 'high',
    confidenceScore: 1.0,
    note: '',
    title: videoInfo.title,
    thumbnail: videoInfo.thumbnail,
    platform: videoInfo.platform,
    url: videoInfo.url,
    createdAt: Date.now(),
  };

  await db.addEvent(event);
  console.log('[Live Assist] Manual bookmark created:', event);

  const allEvents = await db.getEventsByVideoId(videoInfo.videoId);
  updateOverlayCount(allEvents.length, event.timestamp);

  showNotification('Highlight bookmarked!');
}

function showNotification(message: string) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: rgba(99, 102, 241, 0.95);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

function handleJumpToTimestamp(timestamp: number) {
  console.log('[Live Assist] Jumping to timestamp:', timestamp);
  PlatformDetector.seekToTimestamp(timestamp);
  showNotification(`Jumped to ${formatTime(timestamp)}`);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

chrome.runtime.onMessage.addListener((msg) => {
  console.log('[Live Assist] Message received:', msg);
  if (msg.type === 'MARK_HIGHLIGHT') {
    handleManualBookmark();
  } else if (msg.type === 'TOGGLE_OVERLAY') {
    overlayState.isActive = !overlayState.isActive;
    renderOverlay();
    saveOverlayState();
  } else if (msg.type === 'JUMP_TO_TIMESTAMP') {
    handleJumpToTimestamp(msg.payload.timestamp);
  }
});

function cleanup() {
  chatDetector?.stop();
  overlayRoot?.unmount();
  overlayHost?.remove();
  overlayRoot = null;
  overlayHost = null;
  chatDetector = null;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.addEventListener('unload', cleanup);
