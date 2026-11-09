import React from 'react';
import { ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { BreadcrumbItem } from '../../types';

export interface BreadcrumbProps {
  trail: BreadcrumbItem[];
  canGoBack?: boolean;
  canGoForward?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  onNavigate: (index: number, item: BreadcrumbItem) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  trail, 
  canGoBack = false,
  canGoForward = false,
  onBack,
  onForward,
  onNavigate 
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Back and Forward Navigation Buttons (Requirement 1.6 & 2.9) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          className="wos-history-nav-btn"
          onClick={onBack}
          disabled={!canGoBack}
          aria-label="Go back to previous record"
          title="Back"
        >
          <ArrowLeft size={14} />
        </button>
        {onForward && (
          <button
            className="wos-history-nav-btn"
            onClick={onForward}
            disabled={!canGoForward}
            aria-label="Go forward"
            title="Forward"
          >
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      <nav className="wos-breadcrumb-bar" aria-label="Breadcrumb navigation">
        {trail.map((crumb, idx) => {
          const isLast = idx === trail.length - 1;

          return (
            <React.Fragment key={crumb.id + '_' + idx}>
              {idx > 0 && (
                <ChevronRight size={14} className="wos-breadcrumb-separator" />
              )}
              {isLast ? (
                <span className="wos-breadcrumb-current" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <button
                  className="wos-breadcrumb-crumb"
                  onClick={() => onNavigate(idx, crumb)}
                  aria-label={`Navigate to ${crumb.label}`}
                >
                  {crumb.label}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
};
