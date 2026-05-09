import { Platform, ChatSpikeMetrics } from '../types';

export class ChatSpikeDetector {
  private platform: Platform;
  private messageHistory: number[] = [];
  private wordFrequency: Map<string, number> = new Map();
  private emoteFrequency: Map<string, number> = new Map();
  private baselineActivity: number = 0;
  private observer: MutationObserver | null = null;
  private onSpikeDetected: (metrics: ChatSpikeMetrics) => void;
  private spikeThreshold: number;

  constructor(
    platform: Platform,
    onSpikeDetected: (metrics: ChatSpikeMetrics) => void,
    spikeThreshold: number = 3.0
  ) {
    this.platform = platform;
    this.onSpikeDetected = onSpikeDetected;
    this.spikeThreshold = spikeThreshold;
  }

  start(): void {
    this.tryStartWithRetry(0);
  }

  private tryStartWithRetry(attempt: number): void {
    const chatContainer = this.getChatContainer();
    
    if (!chatContainer) {
      if (attempt < 5) {
        console.log(`[Live Assist] Chat container not found, retrying... (${attempt + 1}/5)`);
        setTimeout(() => this.tryStartWithRetry(attempt + 1), 2000);
        return;
      } else {
        console.warn('[Live Assist] Chat container not found after 5 attempts');
        return;
      }
    }

    console.log('[Live Assist] Chat container found, starting spike detection');

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.processNewMessage(node as Element);
          }
        });
      });
    });

    this.observer.observe(chatContainer, {
      childList: true,
      subtree: true,
    });

    this.startBaselineCalculation();
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private getChatContainer(): Element | null {
    if (this.platform === 'youtube') {
      // Try to find chat in main document
      let container = (
        document.querySelector('#chat-messages') ||
        document.querySelector('#items.yt-live-chat-item-list-renderer') ||
        document.querySelector('yt-live-chat-item-list-renderer') ||
        document.querySelector('#chat') ||
        document.querySelector('ytd-live-chat-frame')
      );

      // If not found, try to find chat iframe and search inside it
      if (!container) {
        const iframe = document.querySelector('iframe#chatframe') as HTMLIFrameElement;
        if (iframe && iframe.contentDocument) {
          container = (
            iframe.contentDocument.querySelector('#chat-messages') ||
            iframe.contentDocument.querySelector('#items.yt-live-chat-item-list-renderer') ||
            iframe.contentDocument.querySelector('yt-live-chat-item-list-renderer')
          );
        }
      }

      return container;
    } else if (this.platform === 'twitch') {
      return (
        document.querySelector('.chat-scrollable-area__message-container') ||
        document.querySelector('[data-a-target="chat-scroller"]')
      );
    }
    return null;
  }

  private processNewMessage(element: Element): void {
    const now = Date.now();
    this.messageHistory.push(now);

    this.messageHistory = this.messageHistory.filter(
      (timestamp) => now - timestamp < 5000
    );

    const messageText = this.extractMessageText(element);
    if (messageText) {
      this.analyzeMessage(messageText);
    }

    const messagesPerSecond = this.messageHistory.length / 5;

    if (this.baselineActivity > 0) {
      const activityRatio = messagesPerSecond / this.baselineActivity;
      
      if (activityRatio >= this.spikeThreshold) {
        this.detectSpike(messagesPerSecond);
      }
    }
  }

  private extractMessageText(element: Element): string | null {
    if (this.platform === 'youtube') {
      const messageElement = element.querySelector('#message, yt-formatted-string#message');
      return messageElement?.textContent?.trim() || null;
    } else if (this.platform === 'twitch') {
      const messageElement = element.querySelector('.text-fragment, [data-a-target="chat-message-text"]');
      return messageElement?.textContent?.trim() || null;
    }
    return null;
  }

  private analyzeMessage(text: string): void {
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach((word) => {
      if (word.length > 2) {
        this.wordFrequency.set(word, (this.wordFrequency.get(word) || 0) + 1);
      }

      if (this.isEmote(word)) {
        this.emoteFrequency.set(word, (this.emoteFrequency.get(word) || 0) + 1);
      }
    });

    this.cleanupFrequencyMaps();
  }

  private isEmote(text: string): boolean {
    const emotePatterns = [
      /^[A-Z][a-z]+[A-Z]/,
      /^Kappa|PogChamp|LUL|KEKW|Pog|Sadge|Copium|monkaS/i,
      /^:\w+:/,
    ];

    return emotePatterns.some((pattern) => pattern.test(text));
  }

  private cleanupFrequencyMaps(): void {
    const maxSize = 100;
    
    if (this.wordFrequency.size > maxSize) {
      const sorted = Array.from(this.wordFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxSize);
      this.wordFrequency = new Map(sorted);
    }

    if (this.emoteFrequency.size > maxSize) {
      const sorted = Array.from(this.emoteFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxSize);
      this.emoteFrequency = new Map(sorted);
    }
  }

  private detectSpike(messagesPerSecond: number): void {
    const topWords = this.getTopRepeated(this.wordFrequency, 5);
    const topEmotes = this.getTopRepeated(this.emoteFrequency, 5);

    const metrics: ChatSpikeMetrics = {
      messagesPerSecond,
      repeatedWords: new Map(topWords),
      repeatedEmotes: new Map(topEmotes),
      baselineActivity: this.baselineActivity,
      spikeThreshold: this.spikeThreshold,
    };

    this.onSpikeDetected(metrics);

    this.wordFrequency.clear();
    this.emoteFrequency.clear();
  }

  private getTopRepeated(map: Map<string, number>, count: number): [string, number][] {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count);
  }

  private startBaselineCalculation(): void {
    setTimeout(() => {
      const messagesPerSecond = this.messageHistory.length / 5;
      this.baselineActivity = Math.max(messagesPerSecond, 0.5);
      console.log('[Live Assist] Baseline activity:', this.baselineActivity, 'msg/s');
    }, 30000);
  }

  updateThreshold(threshold: number): void {
    this.spikeThreshold = threshold;
  }
}
