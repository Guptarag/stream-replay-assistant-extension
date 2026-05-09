/** Detect OS for shortcut display */
export function isMac(): boolean {
  return navigator.platform.toUpperCase().includes("MAC") ||
    navigator.userAgent.toUpperCase().includes("MAC");
}

export function getShortcutLabel(): string {
  return isMac() ? "⌥X" : "Alt+X";
}
