import { useState, useCallback, useRef, useEffect } from "react";
import type { Highlight } from "../types";
import { formatTimestamp, seekTo } from "../utils/youtube";

interface Props {
  highlight: Highlight;
  isNew: boolean;
  onDelete: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
}

export function HighlightCard({ highlight, isNew, onDelete, onUpdateNote }: Props) {
  const [note, setNote] = useState(highlight.note);
  const [editing, setEditing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSeek = useCallback(() => seekTo(highlight.timestamp), [highlight.timestamp]);

  const handleNoteChange = useCallback((val: string) => {
    setNote(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onUpdateNote(highlight.id, val), 600);
  }, [highlight.id, onUpdateNote]);

  const handleNoteBlur = useCallback(() => {
    setEditing(false);
    if (saveTimer.current) { clearTimeout(saveTimer.current); }
    onUpdateNote(highlight.id, note);
  }, [highlight.id, note, onUpdateNote]);

  return (
    <div className={`sra-card${isNew ? " is-new" : ""}`}>
      {/* Thumbnail */}
      <div className="sra-thumb" onClick={handleSeek} title={`Jump to ${formatTimestamp(highlight.timestamp)}`}>
        {highlight.thumbnail
          ? <img src={highlight.thumbnail} alt="" loading="lazy"/>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <polygon points="5,3 19,12 5,21" fill="#3a3a4a"/>
            </svg>
        }
        <div className="sra-thumb-overlay">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <polygon points="5,3 19,12 5,21" fill="white"/>
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="sra-card-content">
        <button className="sra-timestamp" onClick={handleSeek}>
          {formatTimestamp(highlight.timestamp)}
        </button>
        {editing
          ? <input
              ref={inputRef}
              className="sra-note-input"
              type="text"
              value={note}
              maxLength={80}
              placeholder="Add a note…"
              onChange={e => handleNoteChange(e.target.value)}
              onBlur={handleNoteBlur}
              onKeyDown={e => e.key === "Enter" && handleNoteBlur()}
              onClick={e => e.stopPropagation()}
            />
          : <button
              className={`sra-note-display${!note ? " empty" : ""}`}
              onClick={e => { e.stopPropagation(); setEditing(true); }}
              title={note || "Click to add note"}
            >
              {note || "Add note…"}
            </button>
        }
      </div>

      {/* Delete */}
      <button
        className="sra-delete-btn"
        onClick={e => { e.stopPropagation(); onDelete(highlight.id); }}
        title="Delete"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
