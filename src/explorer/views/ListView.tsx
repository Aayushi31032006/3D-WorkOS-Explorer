import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  BusinessObject, 
  RelationshipGroup,
  DataProvider
} from '../../types';
import { ArrowRight, ExternalLink } from 'lucide-react';

export interface ListViewProps {
  currentObject: BusinessObject;
  relationshipGroups: RelationshipGroup[];
  dataProvider: DataProvider;
  onSelectCentral: () => void;
  onSelectGroup: (group: RelationshipGroup) => void;
  onNavigateToObject?: (id: string) => void;
  onOpenExecution?: (id: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  currentObject,
  relationshipGroups,
  dataProvider,
  onSelectCentral,
  onSelectGroup,
  onNavigateToObject,
  onOpenExecution
}) => {
  const reducedMotion = useReducedMotion();
  // Handle group click or Enter key adhering to Single-Record Group Rule (Requirement 1.5)
  const handleGroupInteraction = (group: RelationshipGroup) => {
    if (group.count === 1 && group.recordIds && group.recordIds[0]) {
      // Exactly 1 record in group: navigate straight to that record
      if (onNavigateToObject) {
        onNavigateToObject(group.recordIds[0]);
      }
    } else {
      // 0 or 2+ records: open collection panel
      onSelectGroup(group);
    }
  };

  return (
    <motion.div
      className="wos-list-view-container"
      role="region"
      aria-label="List view of business records"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.28, ease: 'easeOut' }}
    >
      {/* Central Object Header Banner */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--wos-border)',
        background: 'linear-gradient(135deg, #FAF7FD 0%, #FFFFFF 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--wos-selection)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '4px'
          }}>
            Central Business Object • {currentObject.type}
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--wos-label)' }}>
            {currentObject.name}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '6px', fontSize: '13px', color: 'var(--wos-label-muted)' }}>
            {currentObject.status && <span>Status: <strong>{currentObject.status}</strong></span>}
            {currentObject.amount && <span>Amount: <strong style={{ color: 'var(--wos-selection)' }}>{currentObject.amount}</strong></span>}
            {currentObject.dueDate && <span>Due Date: <strong>{currentObject.dueDate}</strong></span>}
            {currentObject.owner && <span>Owner: <strong>{currentObject.owner}</strong></span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="wos-retry-btn"
            onClick={onSelectCentral}
            aria-label="View details"
          >
            View Details
          </button>
          {(currentObject.type === 'project' || currentObject.type === 'task') && onOpenExecution && (
            <button
              className="wos-primary-action-btn"
              style={{ margin: 0, padding: '8px 16px', width: 'auto' }}
              onClick={() => {
                onOpenExecution(currentObject.id);
              }}
            >
              <span>{currentObject.type === 'task' ? 'Open in WorkOS' : 'Open project in WorkOS'}</span>
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Connected Relationship Groups Table */}
      <div className="wos-table-wrap">
        <table className="wos-table" aria-label="Connected relationship groups">
          <thead>
            <tr>
              <th scope="col">Relationship Group</th>
              <th scope="col">Type</th>
              <th scope="col">Connected Records</th>
              <th scope="col" style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {relationshipGroups.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--wos-label-muted)' }}>
                  No connected records linked yet
                </td>
              </tr>
            ) : (
              relationshipGroups.map((group, index) => {
                const isSingle = group.count === 1 && Boolean(group.recordIds?.[0]);
                return (
                  <motion.tr
                    key={group.type + '_' + group.label}
                    onClick={() => handleGroupInteraction(group)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleGroupInteraction(group);
                      }
                    }}
                    aria-label={`${group.label} group containing ${group.count} records. ${isSingle ? 'Press Enter to open record directly.' : 'Press Enter to open collection panel.'}`}
                    style={{ cursor: 'pointer' }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reducedMotion ? 0 : 0.2,
                      delay: reducedMotion ? 0 : Math.min(index * 0.035, 0.21)
                    }}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--wos-label)' }}>
                      {group.label}
                    </td>
                    <td>
                      <span className="wos-search-type-badge">
                        {group.type}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: 'var(--wos-selection)',
                        background: 'var(--wos-selection-light)',
                        padding: '2px 8px',
                        borderRadius: 'var(--wos-radius-full)',
                        fontSize: '12px'
                      }}>
                        {group.count} {group.count === 1 ? 'record' : 'records'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="wos-table-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGroupInteraction(group);
                        }}
                        aria-label={isSingle ? `Navigate to ${group.label}` : `Explore ${group.label}`}
                      >
                        <span>{isSingle ? 'Open Record' : 'Explore'}</span>
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
