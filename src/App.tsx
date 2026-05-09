import { useState, useEffect } from 'react';
import { db } from './utils/db';
import { PlatformDetector } from './utils/platformDetector';
import { EventMerger } from './utils/eventMerger';
import { HighlightEvent, Settings } from './types';
import { getShortcutLabel } from './utils/platform';

export default function App() {
  const [events, setEvents] = useState<HighlightEvent[]>([]);
  const [settings, setSettings] = useState<Settings>({
    chatSpikeEnabled: true,
    chatSpikeThreshold: 3.0,
    mergeWindowSeconds: 15,
    overlayEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'manual' | 'chat_spike'>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      console.log('[Live Assist Popup] Initializing database...');
      await db.init();
      console.log('[Live Assist Popup] Database initialized');
      
      const allEvents = await db.getAllEvents();
      console.log('[Live Assist Popup] Loaded events from DB:', allEvents.length);
      console.log('[Live Assist Popup] Events:', allEvents);
      
      const savedSettings = await db.getSettings();
      
      const sortedEvents = allEvents.sort((a, b) => b.createdAt - a.createdAt);
      setEvents(sortedEvents);
      setSettings(savedSettings);
      
      console.log('[Live Assist Popup] State updated with', sortedEvents.length, 'events');
    } catch (error) {
      console.error('[Live Assist Popup] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(eventId: string) {
    await db.deleteEvent(eventId);
    setEvents(events.filter(e => e.id !== eventId));
  }

  async function handleExport() {
    const dataStr = JSON.stringify(events, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-assist-highlights-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleMerge() {
    const mergedEvents = EventMerger.mergeNearbyEvents(events, settings.mergeWindowSeconds);
    
    await db.clearAllEvents();
    for (const event of mergedEvents) {
      await db.addEvent(event);
    }
    
    setEvents(mergedEvents);
  }

  function jumpToTimestamp(event: HighlightEvent) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'JUMP_TO_TIMESTAMP',
          payload: { timestamp: event.timestamp, url: event.url },
        });
      }
    });
  }

  function getUrlWithTimestamp(event: HighlightEvent): string {
    const url = new URL(event.url);
    
    if (event.platform === 'youtube') {
      url.searchParams.set('t', `${Math.floor(event.timestamp)}s`);
    } else if (event.platform === 'twitch') {
      url.searchParams.set('t', `${Math.floor(event.timestamp / 3600)}h${Math.floor((event.timestamp % 3600) / 60)}m${Math.floor(event.timestamp % 60)}s`);
    }
    
    return url.toString();
  }

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.source === filter);

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">Loading highlights...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top">
          <h1 className="app-title">Live Assist Mode</h1>
          <span className="event-count">{events.length}</span>
        </div>
        <p className="app-subtitle">Review your highlight moments</p>
      </header>

      <div className="filter-bar">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({events.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'manual' ? 'active' : ''}`}
          onClick={() => setFilter('manual')}
        >
          Manual ({events.filter(e => e.source === 'manual').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'chat_spike' ? 'active' : ''}`}
          onClick={() => setFilter('chat_spike')}
        >
          Chat Spikes ({events.filter(e => e.source === 'chat_spike').length})
        </button>
      </div>

      <div className="events-list">
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h3>No highlights yet</h3>
            <p>Press <kbd>{getShortcutLabel()}</kbd> on YouTube or Twitch to bookmark moments</p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <div key={event.id} className="event-card">
              <div className="event-header">
                <div className="event-source">
                  {event.source === 'manual' ? '📌' : '💬'} 
                  <span className="source-label">
                    {event.source === 'manual' ? 'Manual' : 'Chat Spike'}
                  </span>
                </div>
                <div className={`confidence-badge confidence-${event.confidence}`}>
                  {event.confidence}
                </div>
              </div>

              <div className="event-content">
                <h3 className="event-title">{event.title}</h3>
                <div className="event-meta">
                  <span className="platform-badge">{event.platform}</span>
                  <span className="timestamp">{formatTimestamp(event.timestamp)}</span>
                  <span className="date">{formatDate(event.createdAt)}</span>
                </div>
                {event.note && <p className="event-note">{event.note}</p>}
              </div>

              <div className="event-actions">
                <button 
                  className="action-btn primary"
                  onClick={() => jumpToTimestamp(event)}
                  title="Jump to this moment"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 3l14 9-14 9V3z" fill="currentColor"/>
                  </svg>
                  Jump to
                </button>
                <button 
                  className="action-btn"
                  onClick={() => window.open(getUrlWithTimestamp(event), '_blank')}
                  title="Open in new tab"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <button 
                  className="action-btn danger"
                  onClick={() => handleDelete(event.id)}
                  title="Delete highlight"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {events.length > 0 && (
        <footer className="app-footer">
          <button className="footer-btn" onClick={handleMerge}>
            Merge Nearby Events
          </button>
          <button className="footer-btn primary" onClick={handleExport}>
            Export JSON
          </button>
        </footer>
      )}
    </div>
  );
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  
  return date.toLocaleDateString();
}
