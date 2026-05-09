/**
 * Get the YouTube video ID from the current URL
 */
export function getVideoId(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get("v");
}

/**
 * Get the HTML5 video element on the YouTube page
 */
export function getVideoElement(): HTMLVideoElement | null {
  return document.querySelector<HTMLVideoElement>(
    "video.html5-main-video, ytd-player video, #movie_player video"
  );
}

/**
 * Get current playback time in seconds
 */
export function getCurrentTime(): number {
  const video = getVideoElement();
  return video ? Math.floor(video.currentTime) : 0;
}

/**
 * Seek the video to a specific timestamp
 */
export function seekTo(seconds: number): void {
  const video = getVideoElement();
  if (video) {
    video.currentTime = seconds;
  }
}

/**
 * Format seconds into HH:MM:SS or MM:SS
 */
export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Capture a thumbnail from the current video frame using canvas.
 * Returns a base64 data URL (JPEG, quality 0.7 for performance).
 */
export function captureVideoFrame(): string {
  const video = getVideoElement();
  if (!video || video.readyState < 2) return "";

  try {
    const canvas = document.createElement("canvas");
    const W = 240;
    const H = Math.floor((video.videoHeight / video.videoWidth) * W) || 135;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    ctx.drawImage(video, 0, 0, W, H);
    return canvas.toDataURL("image/jpeg", 0.7);
  } catch {
    // CORS or other errors — return empty
    return "";
  }
}

/**
 * Generate a unique ID for a highlight
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
