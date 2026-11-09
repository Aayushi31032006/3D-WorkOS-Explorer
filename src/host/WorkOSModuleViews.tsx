import React from 'react';
import { ArrowLeft, Box } from 'lucide-react';

export interface WorkOSModuleViewProps {
  module: string;
  onReturnToObjectSpace: () => void;
}

/**
 * Lightweight mock-screen placeholder for non-Object Space top navigation tabs
 * (Requirement 1.16: one tiny mock-screen component).
 */
export const WorkOSModuleView: React.FC<WorkOSModuleViewProps> = ({
  module,
  onReturnToObjectSpace
}) => {
  const moduleLabel = module.charAt(0).toUpperCase() + module.slice(1);

  return (
    <div className="workos-mock-module-screen" role="region" aria-label={`${moduleLabel} Screen`}>
      <div className="workos-pms-box">
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'rgba(112, 70, 178, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#7046B2'
        }}>
          <Box size={24} />
        </div>

        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#30264C' }}>
          WorkOS {moduleLabel}
        </h2>

        <p style={{ margin: 0, fontSize: '13px', color: '#6B5E87', maxWidth: '360px', lineHeight: 1.5 }}>
          This is a simulated WorkOS host navigation placeholder. Use the button below to return to the Object Space Explorer.
        </p>

        <button
          className="wos-primary-action-btn"
          style={{ width: 'auto', padding: '10px 20px', margin: 0 }}
          onClick={onReturnToObjectSpace}
        >
          <ArrowLeft size={16} />
          <span>Return to Object Space</span>
        </button>
      </div>
    </div>
  );
};
