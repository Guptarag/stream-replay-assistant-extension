/**
 * Content Script — Stream Replay Assistant
 * Mounts React sidebar into a Shadow DOM on YouTube watch pages.
 * Handles SPA navigation, keyboard relay, and cleanup.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// Import CSS as a raw string so Vite inlines it — no external fetch needed
import styles from "./index.css?inline";

let root: ReactDOM.Root | null = null;
let host: HTMLElement | null = null;
let currentVideoId: string | null = null;

function getVideoId(): string | null {
  return new URLSearchParams(window.location.search).get("v");
}

function isWatchPage(): boolean {
  return window.location.pathname === "/watch" && !!getVideoId();
}

async function mount() {
  const videoId = getVideoId();
  if (!videoId || videoId === currentVideoId) return;
  unmount();
  currentVideoId = videoId;

  host = document.createElement("div");
  host.id = "sra-host";
  host.style.cssText = "all:initial;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  // Inject our CSS string directly — no fetch, no hash filename guessing
  const styleEl = document.createElement("style");
  styleEl.textContent = styles;
  shadow.appendChild(styleEl);

  // Google Fonts
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap";
  shadow.appendChild(fontLink);

  const mountPoint = document.createElement("div");
  mountPoint.id = "sra-root";
  shadow.appendChild(mountPoint);

  root = ReactDOM.createRoot(mountPoint);
  root.render(React.createElement(App));
}

function unmount() {
  root?.unmount();
  root = null;
  host?.parentNode?.removeChild(host);
  host = null;
  currentVideoId = null;
}

// Relay Alt+X command from background service worker → React app
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SRA_MARK_HIGHLIGHT") {
    window.postMessage({ type: "SRA_MARK_HIGHLIGHT" }, "*");
  }
});

// YouTube SPA navigation
document.addEventListener("yt-navigate-finish", () => {
  if (isWatchPage()) setTimeout(mount, 700);
  else unmount();
});

// Direct page load
if (isWatchPage()) setTimeout(mount, 1000);

window.addEventListener("unload", unmount);
