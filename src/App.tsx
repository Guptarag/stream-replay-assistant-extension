import { useState, useCallback } from "react";
import { useHighlights } from "./hooks/useHighlights";
import { useKeyboardShortcut } from "./hooks/useKeyboardShortcut";
import { HighlightCard } from "./components/HighlightCard";
import { EmptyState } from "./components/EmptyState";
import { MarkButton } from "./components/MarkButton";
import { getShortcutLabel } from "./utils/platform";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [bufferSeconds, setBufferSeconds] = useState(10);
  
  const {
    highlights, videoId, isCapturing, lastSaved,
    markHighlight, updateNote, removeHighlight, exportJSON, downloadClips,
  } = useHighlights();

  useKeyboardShortcut(markHighlight);

  const toggle = useCallback(() => setCollapsed(v => !v), []);

  if (!videoId) return null;

  return (
    <div className={`sra-sidebar${collapsed ? " collapsed" : ""}`}>
      {/* Header */}
      <div className="sra-header">
        <div className="sra-logo">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <polygon points="3,2 13,8 3,14" fill="#0a0a0c"/>
          </svg>
        </div>
        {!collapsed && (
          <>
            <span className="sra-title">Stream Replay</span>
            {highlights.length > 0 && (
              <span className="sra-count">{highlights.length}</span>
            )}
          </>
        )}
        <button className="sra-collapse-btn" onClick={toggle} title={collapsed ? "Expand" : "Collapse"}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.25s" }}>
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Collapsed body */}
      {collapsed && (
        <div className="sra-collapsed-body">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <polygon points="5,3 19,12 5,21" fill="#e8ff47"/>
          </svg>
          <span className="sra-collapsed-label">{highlights.length} clips</span>
        </div>
      )}

      {/* Expanded body */}
      {!collapsed && (
        <div className="sra-body">
          <MarkButton onClick={markHighlight} isCapturing={isCapturing}/>

          {/* Saved flash */}
          {lastSaved && (
            <div className="sra-saved-flash">
              <span className="sra-saved-dot"/>
              Highlight saved!
            </div>
          )}

          {/* Shortcut hint */}
          {highlights.length === 0 && (
            <div className="sra-hint">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#6b6b80" strokeWidth="1.5"/>
                <path d="M12 8v4M12 16h.01" stroke="#6b6b80" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Quick mark: <kbd>{getShortcutLabel()}</kbd>
              &nbsp;— works on Mac &amp; Windows
            </div>
          )}

          {/* Timeline */}
          <div className="sra-timeline">
            {highlights.length === 0
              ? <EmptyState/>
              : highlights.map(h => (
                <HighlightCard
                  key={h.id}
                  highlight={h}
                  isNew={h.id === lastSaved}
                  onDelete={removeHighlight}
                  onUpdateNote={updateNote}
                />
              ))
            }
          </div>

          {/* Footer export */}
          {highlights.length > 0 && (
            <div className="sra-footer">
              <div className="sra-buffer-selector">
                <label className="sra-buffer-label">Clip Buffer</label>
                <select 
                  className="sra-buffer-select"
                  value={bufferSeconds}
                  onChange={(e) => setBufferSeconds(Number(e.target.value))}
                >
                  <option value={5}>5 seconds (10s clips)</option>
                  <option value={10}>10 seconds (20s clips)</option>
                  <option value={15}>15 seconds (30s clips)</option>
                  <option value={20}>20 seconds (40s clips)</option>
                </select>
              </div>
              
              <div className="sra-export-label">Export Clips</div>
              <div className="sra-export-options">
                <button 
                  className="sra-format-option"
                  onClick={() => downloadClips('open', bufferSeconds)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <div className="sra-format-title">Open in Browser</div>
                    <div className="sra-format-desc">Open each clip in new tab</div>
                  </div>
                </button>
                <button 
                  className="sra-format-option"
                  onClick={() => downloadClips('ytdlp', bufferSeconds)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <div className="sra-format-title">yt-dlp Script</div>
                    <div className="sra-format-desc">Shell script to download</div>
                  </div>
                </button>
                <button 
                  className="sra-format-option"
                  onClick={() => downloadClips('txt', bufferSeconds)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <div className="sra-format-title">Text Instructions</div>
                    <div className="sra-format-desc">Download guide with URLs</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
