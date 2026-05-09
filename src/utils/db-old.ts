import { HighlightEvent, Settings, OverlayState } from '../types';

const EVENTS_KEY = 'live_assist_events';
const SETTINGS_KEY = 'live_assist_settings';

class DatabaseManager {
  async init(): Promise<void> {
    // No initialization needed for Chrome Storage API
    return Promise.resolve();
  }

  async addEvent(event: HighlightEvent): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.add(event);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateEvent(event: HighlightEvent): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.put(event);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.delete(eventId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getEvent(eventId: string): Promise<HighlightEvent | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readonly');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.get(eventId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllEvents(): Promise<HighlightEvent[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readonly');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getEventsByVideoId(videoId: string): Promise<HighlightEvent[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readonly');
      const store = transaction.objectStore(EVENTS_STORE);
      const index = store.index('videoId');
      const request = index.getAll(videoId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getEventsInTimeRange(
    videoId: string,
    startTime: number,
    endTime: number
  ): Promise<HighlightEvent[]> {
    const events = await this.getEventsByVideoId(videoId);
    return events.filter(
      (event) => event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  async saveSettings(settings: Settings): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ key: 'settings', ...settings });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSettings(): Promise<Settings> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get('settings');

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { key, ...settings } = result;
          resolve(settings as Settings);
        } else {
          resolve({
            chatSpikeEnabled: true,
            chatSpikeThreshold: 3.0,
            mergeWindowSeconds: 15,
            overlayEnabled: true,
          });
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllEvents(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new DatabaseManager();
