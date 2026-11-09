import React from 'react';
import { Plus, Minus, RotateCcw, MousePointer } from 'lucide-react';

export interface CameraControlsOverlayProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const CameraControlsOverlay: React.FC<CameraControlsOverlayProps> = ({
  onZoomIn,
  onZoomOut,
  onReset
}) => {
  return (
    <>
      {/* Bottom Left Usage Hint (Matching Figure 1 and 2) */}
      <div className="wos-bottom-left-hint">
        <MousePointer size={14} color="var(--wos-selection)" />
        <span>Drag to rotate · Scroll to zoom</span>
      </div>

      {/* Bottom Right Floating Pills: +, -, Reset (Matching Figure 1 and 2) */}
      <div className="wos-bottom-right-controls" role="toolbar" aria-label="Camera controls">
        <button
          className="wos-camera-btn"
          onClick={onZoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <Plus size={16} />
        </button>
        <button
          className="wos-camera-btn"
          onClick={onZoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <Minus size={16} />
        </button>
        <button
          className="wos-camera-btn wos-camera-btn-text"
          onClick={onReset}
          title="Reset camera view"
          aria-label="Reset camera view"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>
    </>
  );
};
