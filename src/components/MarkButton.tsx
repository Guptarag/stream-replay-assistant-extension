import { getShortcutLabel } from "../utils/platform";

interface MarkButtonProps {
  onClick: () => void;
  isCapturing: boolean;
}

export function MarkButton({ onClick, isCapturing }: MarkButtonProps) {
  return (
    <button
      className="sra-mark-btn"
      onClick={onClick}
      disabled={isCapturing}
    >
      {isCapturing ? (
        <>
          <svg className="sra-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25"/>
            <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Capturing…
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" fill="currentColor"/>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.4"/>
          </svg>
          Mark Highlight
          <span className="shortcut-badge">{getShortcutLabel()}</span>
        </>
      )}
    </button>
  );
}
