import { useEffect } from "react";

/**
 * Listens for the chrome.commands "mark-highlight" message dispatched
 * by the background service worker, and calls the callback.
 *
 * Also falls back to listening for Alt+X directly on the page in case
 * the command dispatch path isn't available.
 */
export function useKeyboardShortcut(onTrigger: () => void) {
  useEffect(() => {
    // Primary: message from background service worker
    const handleMessage = (event: MessageEvent) => {
      if (
        event.source === window &&
        event.data?.type === "SRA_MARK_HIGHLIGHT"
      ) {
        onTrigger();
      }
    };
    window.addEventListener("message", handleMessage);

    // Fallback: direct Alt+X key listener on the page
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "KeyX" && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        onTrigger();
      }
    };
    document.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("message", handleMessage);
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [onTrigger]);
}
