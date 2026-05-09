import { HighlightEvent, Settings } from '../types';

const EVENTS_KEY = 'live_assist_events';
const SETTINGS_KEY = 'live_assist_settings';

class DatabaseManager {
  async init(): Promise<void> {
    // No initialization needed for Chrome Storage API
    return Promise.resolve();
  }

  async addEvent(event: HighlightEvent): Promise<void> {
    const events = await this.getAllEvents();
    events.push(event);
    return new Promise((resolve) => {
      chrome.storage.local.set({ [EVENTS_KEY]: events }, () => resolve());
    });
  }

  async updateEvent(event: HighlightEvent): Promise<void> {
    const events = await this.getAllEvents();
    const index = events.findIndex(e => e.id === event.id);
    if (index !== -1) {
      events[index] = event;
      return new Promise((resolve) => {
        chrome.storage.local.set({ [EVENTS_KEY]: events }, () => resolve());
      });
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    const events = await this.getAllEvents();
    const filtered = events.filter(e => e.id !== eventId);
    return new Promise((resolve) => {
      chrome.storage.local.set({ [EVENTS_KEY]: filtered }, () => resolve());
    });
  }

  async getEvent(eventId: string): Promise<HighlightEvent | null> {
    const events = await this.getAllEvents();
    return events.find(e => e.id === eventId) || null;
  }

  async getAllEvents(): Promise<HighlightEvent[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get([EVENTS_KEY], (result) => {
        resolve((result[EVENTS_KEY] as HighlightEvent[]) || []);
      });
    });
  }

  async getEventsByVideoId(videoId: string): Promise<HighlightEvent[]> {
    const events = await this.getAllEvents();
    return events.filter(e => e.videoId === videoId);
  }

  async clearAllEvents(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [EVENTS_KEY]: [] }, () => resolve());
    });
  }

  async getSettings(): Promise<Settings> {
    return new Promise((resolve) => {
      chrome.storage.local.get([SETTINGS_KEY], (result) => {
        const defaultSettings: Settings = {
          chatSpikeEnabled: true,
          chatSpikeThreshold: 3.0,
          mergeWindowSeconds: 15,
          overlayEnabled: true,
        };
        resolve((result[SETTINGS_KEY] as Settings) || defaultSettings);
      });
    });
  }

  async saveSettings(settings: Settings): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [SETTINGS_KEY]: settings }, () => resolve());
    });
  }
}

export const db = new DatabaseManager();
