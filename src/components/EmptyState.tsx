import { getShortcutLabel } from "../utils/platform";

export function EmptyState() {
  const shortcut = getShortcutLabel();
  return (
    <div className="sra-empty">
      <div className="sra-empty-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <polygon points="5,3 19,12 5,21" stroke="#e8ff47" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
        </svg>
      </div>
      <div>
        <h3>No highlights yet</h3>
        <p>Start marking moments while watching</p>
      </div>
      <div className="sra-empty-steps">
        <div className="sra-empty-step">
          <span className="sra-step-num">1</span>
          Press <kbd>{shortcut}</kbd> to instantly mark any moment
        </div>
        <div className="sra-empty-step">
          <span className="sra-step-num">2</span>
          Or click the yellow button above
        </div>
        <div className="sra-empty-step">
          <span className="sra-step-num">3</span>
          Click a card to jump back to that moment
        </div>
      </div>
    </div>
  );
}
