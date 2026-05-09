/**
 * Background Service Worker
 *
 * Handles the chrome.commands keyboard shortcut (Alt+X)
 * and relays the message to the active YouTube tab's content script.
 */

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "mark-highlight") return;

  // Find the active YouTube tab
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
    url: "https://www.youtube.com/watch*",
  });

  if (!tab?.id) return;

  // Send message to content script
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "SRA_MARK_HIGHLIGHT" });
  } catch {
    // Tab might not have content script loaded yet; ignore
  }
});

// Keep service worker alive hint (MV3 workers can go dormant)
chrome.runtime.onInstalled.addListener(() => {
  console.log("[SRA] Stream Replay Assistant installed.");
});
