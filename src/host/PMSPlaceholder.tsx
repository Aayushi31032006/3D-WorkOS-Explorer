import React from 'react';
import { ArrowLeft, FolderKanban, CheckCircle2, ShieldCheck, Calendar, User } from 'lucide-react';
import { ReturnContext, BusinessObject } from '../types';

export interface PMSPlaceholderProps {
  recordId: string;
  record?: BusinessObject;
  returnContext: ReturnContext;
  onReturn: (ctx: ReturnContext) => void;
}

export const PMSPlaceholder: React.FC<PMSPlaceholderProps> = ({
  recordId,
  record,
  returnContext,
  onReturn
}) => {
  return (
    <div className="wos-pms-screen" role="region" aria-label="WorkOS Project Management Screen Placeholder">
      <div className="wos-pms-box">
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'var(--wos-selection-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--wos-selection)',
          marginBottom: '4px'
        }}>
          <FolderKanban size={28} />
        </div>

        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--wos-selection)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>
          WorkOS Project Management System
        </div>

        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--wos-label)' }}>
          {record ? record.name : `Project Record [${recordId}]`}
        </h1>

        <p style={{ margin: 0, fontSize: '14px', color: 'var(--wos-label-muted)', lineHeight: 1.6 }}>
          You have successfully executed a WorkOS handoff from the 3D Object Space Explorer.
          The demo host received record identifier <code>{recordId}</code> alongside a serializable return context.
        </p>

        {/* Record Overview Summary */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          padding: '16px',
          background: 'var(--wos-bg)',
          borderRadius: 'var(--wos-radius-md)',
          textAlign: 'left',
          fontSize: '12px',
          color: 'var(--wos-label)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={15} color="var(--wos-label-muted)" />
            <span>Owner: <strong>{record?.owner || 'Marcus Aurelius'}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={15} color="#2e7d32" />
            <span>Status: <strong>{record?.status || 'In Progress'}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} color="var(--wos-label-muted)" />
            <span>Target: <strong>{record?.dueDate || 'Q4 2026'}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={15} color="var(--wos-selection)" />
            <span>Context: <strong>Restorable</strong></span>
          </div>
        </div>

        {/* Return Button Matching Brief: "Return to Object Space button" */}
        <button
          className="wos-primary-action-btn"
          onClick={() => onReturn(returnContext)}
          style={{ width: '100%', marginTop: '12px' }}
        >
          <ArrowLeft size={16} />
          <span>Return to Object Space</span>
        </button>

        <span style={{ fontSize: '12px', color: 'var(--wos-label-muted)' }}>
          Restores previous object, camera view and navigation trail without jumping to default customer.
        </span>
      </div>
    </div>
  );
};
