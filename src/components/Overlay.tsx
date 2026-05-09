import React, { useState, useEffect, useRef } from 'react';
import { OverlayState } from '../types';
import { getShortcutLabel } from '../utils/platform';

interface OverlayProps {
  initialState: OverlayState;
  onPositionChange: (position: { x: number; y: number }) => void;
}

export const Overlay: React.FC<OverlayProps> = ({ initialState, onPositionChange }) => {
  const [position, setPosition] = useState(initialState.position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const maxX = window.innerWidth - (overlayRef.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (overlayRef.current?.offsetHeight || 0);

      const boundedX = Math.max(0, Math.min(newX, maxX));
      const boundedY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onPositionChange(position);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, position, onPositionChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  if (!initialState.isActive) return null;

  return (
    <div
      ref={overlayRef}
      className="live-assist-overlay"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 999999,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="overlay-content">
        <div className="overlay-header">
          <div className="live-indicator">
            <span className="pulse-dot"></span>
            <span className="live-text">LIVE ASSIST ACTIVE</span>
          </div>
        </div>
        
        <div className="overlay-stats">
          <div className="stat-item">
            <span className="stat-label">Highlights</span>
            <span className="stat-value">{initialState.highlightCount}</span>
          </div>
          
          {initialState.latestTimestamp !== null && (
            <div className="stat-item">
              <span className="stat-label">Latest</span>
              <span className="stat-value">{formatTimestamp(initialState.latestTimestamp)}</span>
            </div>
          )}
        </div>
        
        <div className="overlay-hint">
          <span className="hint-text">Press {getShortcutLabel()} to bookmark</span>
        </div>
      </div>
    </div>
  );
};

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
