import React from 'react';
import { Box, List as ListIcon } from 'lucide-react';

export interface ViewSwitchProps {
  viewMode: '3D' | 'List';
  has3D?: boolean;
  onChange: (mode: '3D' | 'List') => void;
}

export const ViewSwitch: React.FC<ViewSwitchProps> = ({ 
  viewMode, 
  has3D = true, 
  onChange 
}) => {
  return (
    <div className="wos-view-switch" role="group" aria-label="View switch">
      <button
        className={`wos-view-switch-btn ${viewMode === '3D' ? 'active' : ''}`}
        onClick={() => has3D && onChange('3D')}
        disabled={!has3D}
        aria-pressed={viewMode === '3D'}
        title={!has3D ? '3D graphics unavailable on this display' : 'Switch to 3D Spheres view'}
      >
        <Box size={14} />
        <span>3D</span>
      </button>
      <button
        className={`wos-view-switch-btn ${viewMode === 'List' ? 'active' : ''}`}
        onClick={() => onChange('List')}
        aria-pressed={viewMode === 'List'}
        title="Switch to accessible List view"
      >
        <ListIcon size={14} />
        <span>List</span>
      </button>
    </div>
  );
};
