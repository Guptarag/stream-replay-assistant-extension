import { Platform, VideoInfo } from '../types';

export class PlatformDetector {
  static detectPlatform(): Platform | null {
    const hostname = window.location.hostname;
    
    if (hostname.includes('youtube.com')) {
      return 'youtube';
    } else if (hostname.includes('twitch.tv')) {
      return 'twitch';
    }
    
    return null;
  }

  static async getVideoInfo(): Promise<VideoInfo | null> {
    const platform = this.detectPlatform();
    
    if (!platform) return null;

    if (platform === 'youtube') {
      return this.getYouTubeInfo();
    } else if (platform === 'twitch') {
      return this.getTwitchInfo();
    }

    return null;
  }

  private static getYouTubeInfo(): VideoInfo | null {
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (!videoElement) return null;

    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v') || window.location.pathname.split('/').pop() || '';
    
    const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h1.ytd-video-primary-info-renderer');
    const title = titleElement?.textContent?.trim() || 'Untitled Stream';

    const isLive = !!document.querySelector('.ytp-live-badge') || 
                    window.location.pathname.includes('/live/');

    const thumbnail = this.captureYouTubeThumbnail(videoId);

    return {
      videoId,
      title,
      currentTime: Math.floor(videoElement.currentTime),
      thumbnail,
      platform: 'youtube',
      url: window.location.href,
      isLive,
    };
  }

  private static getTwitchInfo(): VideoInfo | null {
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (!videoElement) return null;

    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const channelName = pathParts[0] || 'unknown';
    const videoId = pathParts[2] || channelName;

    const titleElement = document.querySelector('h2[data-a-target="stream-title"]');
    const title = titleElement?.textContent?.trim() || `${channelName}'s Stream`;

    const isLive = !window.location.pathname.includes('/videos/');

    const thumbnail = this.captureTwitchThumbnail();

    return {
      videoId,
      title,
      currentTime: Math.floor(videoElement.currentTime),
      thumbnail,
      platform: 'twitch',
      url: window.location.href,
      isLive,
    };
  }

  private static captureYouTubeThumbnail(videoId: string): string {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  private static captureTwitchThumbnail(): string {
    const previewImage = document.querySelector('img[alt*="preview"]') as HTMLImageElement;
    return previewImage?.src || '';
  }

  static formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  static seekToTimestamp(timestamp: number): void {
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.currentTime = timestamp;
      videoElement.play();
    }
  }
}
