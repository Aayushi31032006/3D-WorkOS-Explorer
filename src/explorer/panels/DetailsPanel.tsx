import React, { useEffect, useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X, ArrowRight, ShieldAlert, Loader2, ExternalLink } from 'lucide-react';
import { BusinessObject, DataProvider, TimelineEvent, RelationshipGroup } from '../../types';

export interface DetailsPanelProps {
  object: BusinessObject;
  relationshipGroups?: RelationshipGroup[];
  dataProvider: DataProvider;
  companyId: string;
  onClose: () => void;
  onNavigateToObject?: (id: string) => void;
  onOpenExecution?: (recordId: string) => void;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  object,
  relationshipGroups = [],
  dataProvider,
  companyId,
  onClose,
  onNavigateToObject,
  onOpenExecution
}) => {
  const reducedMotion = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Dynamic activity timeline state
  const [timeline, setTimeline] = useState<TimelineEvent[]>(object.activity || []);
  const [loadingTimeline, setLoadingTimeline] = useState<boolean>(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  // Resolved dynamic linked project (Requirement 1.4: Never hard-code proj_alpha)
  const [linkedProject, setLinkedProject] = useState<{ id: string; name: string } | null>(null);
  const [linkedAssignee, setLinkedAssignee] = useState<{ id: string; name: string } | null>(null);

  // Resolve connected records from the relationship groups supplied by the provider.
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const resolveConnected = async () => {
      try {
        setLinkedProject(null);
        setLinkedAssignee(null);

        const projectId = relationshipGroups.find(group => group.type === 'project')?.recordIds?.[0];
        const personId = relationshipGroups.find(group => group.type === 'person')?.recordIds?.[0];
        const [project, person] = await Promise.all([
          projectId ? dataProvider.getObject(projectId, companyId, controller.signal) : Promise.resolve(null),
          personId ? dataProvider.getObject(personId, companyId, controller.signal) : Promise.resolve(null)
        ]);

        if (active && project) {
          setLinkedProject({ id: project.id, name: project.name });
        }
        if (active && person) {
          setLinkedAssignee({ id: person.id, name: person.name });
        }
      } catch (error) {
        if (active && (error as Error).name !== 'AbortError') {
          console.error('Failed to resolve linked records:', error);
        }
      }
    };
    resolveConnected();
    return () => {
      active = false;
      controller.abort();
    };
  }, [companyId, dataProvider, object.id, relationshipGroups]);

  // Load activity feed dynamically via getTimeline (Requirement 2.10)
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const fetchActivity = async () => {
      if (object.restricted) return;
      try {
        setLoadingTimeline(true);
        setTimelineError(null);
        const events = await dataProvider.getTimeline(object.id, companyId, controller.signal);
        if (active) {
          setTimeline(events);
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Failed to load activity');
        if (active && error.name !== 'AbortError') {
          setTimelineError('Failed to load activity');
        }
      } finally {
        if (active) setLoadingTimeline(false);
      }
    };

    fetchActivity();
    return () => {
      active = false;
      controller.abort();
    };
  }, [object.id, companyId, dataProvider, object.restricted]);

  // Focus management and Escape key trapping (Requirement 2.11)
  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isInvoice = object.type === 'invoice';
  const isProject = object.type === 'project';
  const isTask = object.type === 'task';
  const isCustomer = object.type === 'customer';
  const isPayment = object.type === 'payment';
  const isContract = object.type === 'contract';

  const title = `${object.type.charAt(0).toUpperCase() + object.type.slice(1)} details`;

  // Calculate connected record counts for Customer per brief table
  const invoiceCount = relationshipGroups.find(g => g.type === 'invoice')?.count ?? 0;
  const projectCount = relationshipGroups.find(g => g.type === 'project')?.count ?? 0;
  const contactCount = relationshipGroups.find(g => g.type === 'person')?.count ?? 0;

  return (
    <motion.aside
      ref={panelRef}
      className="wos-drawer-panel"
      role="region"
      aria-label={`${object.name} details`}
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 28 }}
      transition={{ duration: reducedMotion ? 0 : 0.28, ease: 'easeOut' }}
    >
      <div className="wos-panel-header">
        <h2 className="wos-panel-title">{title}</h2>
        <button 
          ref={closeButtonRef}
          className="wos-panel-close-btn" 
          onClick={onClose}
          aria-label="Close details"
        >
          <X size={16} />
        </button>
      </div>

      <div className="wos-panel-body">
        {/* Restricted / Unavailable Record State */}
        {object.restricted ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '16px',
            background: 'rgba(112, 70, 178, 0.05)',
            border: '1px solid var(--wos-border)',
            borderRadius: 'var(--wos-radius-md)',
            color: 'var(--wos-label)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--wos-selection)' }}>
              <ShieldAlert size={18} />
              <strong style={{ fontSize: '14px' }}>This record is unavailable</strong>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--wos-label-muted)', lineHeight: 1.4 }}>
              You do not have permission to view private details or activity for this object.
            </p>
          </div>
        ) : (
          <>
            {/* Record Name Header */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--wos-selection)'
              }}>
                {object.type}
              </span>
              <div style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 700, color: 'var(--wos-label)' }}>
                {object.name}
              </div>
            </div>

            {/* Customer Specific Fields (Brief Table: name, owner, status, counts) */}
            {isCustomer && (
              <>
                {object.owner && (
                  <div className="wos-detail-field">
                    <span className="wos-field-label">Owner</span>
                    <span className="wos-field-value">{object.owner}</span>
                  </div>
                )}
                {object.status && (
                  <div className="wos-detail-field">
                    <span className="wos-field-label">Status</span>
                    <span className="wos-field-value">{object.status}</span>
                  </div>
                )}
                <div className="wos-detail-field">
                  <span className="wos-field-label">Connected Records</span>
                  <span className="wos-field-value" style={{ fontSize: '13px' }}>
                    {invoiceCount} invoices · {projectCount} projects · {contactCount} contacts
                  </span>
                </div>
              </>
            )}

            {/* Invoice Specific Fields (Brief Table: number, customer, amount, status, due date, linked project) */}
            {isInvoice && (
              <>
                {object.summaryFields?.['Customer'] && (
                  <div className="wos-detail-field">
                    <span className="wos-field-label">Customer</span>
                    <span className="wos-field-value">{object.summaryFields['Customer']}</span>
                  </div>
                )}
                {object.amount && (
                  <div className="wos-detail-field">
                    <span className="wos-field-label">Amount</span>
                    <span className="wos-field-value-amount">{object.amount}</span>
                  </div>
                )}
                {object.status && (
                  <div className="wos-detail-field">
                    <span className="wos-field-label">Status</span>
                    <span className="wos-field-value">{object.status}</span>
                  </div>
                )}
                {object.dueDate && (
                  <div className="wos-detail-field">
                    <span className="wos-field-label">Due date</span>
                    <span className="wos-field-value">{object.dueDate}</span>
                  </div>
                )}
                {linkedProject && (
                  <div className="wos-detail-field">
                    <span className="wos-field-label">Linked project</span>
                    <button
                      className="wos-field-link-btn"
                      onClick={() => onNavigateToObject && onNavigateToObject(linkedProject.id)}
                      aria-label={`Navigate to linked project ${linkedProject.name}`}
                    >
                      <span>{linkedProject.name}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Project Specific Fields (Brief Table: name, owner, status, linked tasks, Open project button) */}
            {isProject && (
              <>
                {object.owner && (
                  <div className="wos-detail-field">
                    <span className="wos-field-label">Owner</span>
                    <span className="wos-field-value">{object.owner}</span>
                  </div>
                )}
                {object.status && (
                  <div className="wos-detail-field">
                    <span className="wos-field-label">Status</span>
                    <span className="wos-field-value">{object.status}</span>
                  </div>
                )}
                {object.summaryFields?.['Linked Tasks'] !== undefined && (
                  <div className="wos-detail-field">
                    <span className="wos-field-label">Linked tasks</span>
                    <span className="wos-field-value">{object.summaryFields['Linked Tasks']} tasks</span>
                  </div>
                )}
              </>
            )}

            {/* Task Specific Fields (Brief Table: title, assignee, status, due date, parent project, Open task button) */}
            {isTask && (
              <>
                {object.status && (
                  <div className="wos-detail-field">
                    <span className="wos-field-label">Status</span>
                    <span className="wos-field-value">{object.status}</span>
                  </div>
                )}

                {(isPayment || isContract) && (
                  <>
                    {object.status && (
                      <div className="wos-detail-field">
                        <span className="wos-field-label">Status</span>
                        <span className="wos-field-value">{object.status}</span>
                      </div>
                    )}
                    {object.amount && (
                      <div className="wos-detail-field">
                        <span className="wos-field-label">Amount</span>
                        <span className="wos-field-value-amount">{object.amount}</span>
                      </div>
                    )}
                    <div className="wos-detail-field">
                      <span className="wos-field-label">Connected records</span>
                      <span className="wos-field-value">
                        {relationshipGroups.reduce((total, group) => total + group.count, 0)}
                      </span>
                    </div>
                  </>
                )}
                {object.dueDate && (
                  <div className="wos-detail-field">
                    <span className="wos-field-label">Due date</span>
                    <span className="wos-field-value">{object.dueDate}</span>
                  </div>
                )}
                {(linkedAssignee || object.owner) && (
                  <div className="wos-detail-field">
                    <span className="wos-field-label">Assignee</span>
                    <span className="wos-field-value">{linkedAssignee?.name || object.owner}</span>
                  </div>
                )}
                {linkedProject && (
                  <div className="wos-detail-field">
                    <span className="wos-field-label">Parent project</span>
                    <button
                      className="wos-field-link-btn"
                      onClick={() => onNavigateToObject && onNavigateToObject(linkedProject.id)}
                      aria-label={`Navigate to parent project ${linkedProject.name}`}
                    >
                      <span>{linkedProject.name}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Generic Summary Fields */}
            {object.summaryFields && Object.entries(object.summaryFields).map(([k, v]) => {
              if (
                k === 'Customer' || 
                k === 'Linked project' || 
                k === 'Parent project' || 
                k === 'Linked Tasks' ||
                k === 'Active Invoices' ||
                k === 'Active Projects' ||
                k === 'Primary Contacts'
              ) return null;
              return (
                <div key={k} className="wos-detail-field">
                  <span className="wos-field-label">{k}</span>
                  <span className="wos-field-value">{String(v)}</span>
                </div>
              );
            })}

            {/* Description */}
            {object.description && (
              <div className="wos-detail-field">
                <span className="wos-field-label">Description</span>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: 'var(--wos-label-muted)' }}>
                  {object.description}
                </p>
              </div>
            )}

            {/* WorkOS Execution Action Button */}
            {onOpenExecution && (
              <>
                {/* Invoice: Asks WorkOS to open the linked project (Requirement 1.4: dynamic project id) */}
                {isInvoice && linkedProject && (
                  <button
                    className="wos-primary-action-btn"
                    onClick={() => onOpenExecution(linkedProject.id)}
                    aria-label="Open project in WorkOS"
                  >
                    <span>Open project in WorkOS</span>
                    <ExternalLink size={14} />
                  </button>
                )}

                {/* Project: Opens this project in WorkOS */}
                {isProject && (
                  <button
                    className="wos-primary-action-btn"
                    onClick={() => onOpenExecution(object.id)}
                    aria-label={`Open project ${object.name} in WorkOS`}
                  >
                    <span>Open project in WorkOS</span>
                    <ExternalLink size={14} />
                  </button>
                )}

                {/* Task: Opens task in WorkOS */}
                {isTask && (
                  <button
                    className="wos-primary-action-btn"
                    onClick={() => onOpenExecution(object.id)}
                    aria-label={`Open task ${object.name} in WorkOS`}
                  >
                    <span>Open task in WorkOS</span>
                    <ExternalLink size={14} />
                  </button>
                )}
              </>
            )}

            {/* Dynamic Activity Feed Section */}
            <div className="wos-activity-section">
              <h3 className="wos-activity-title">Activity</h3>
              {loadingTimeline ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0', color: 'var(--wos-label-muted)', fontSize: '12px' }}>
                  <Loader2 size={14} className="wos-spin" />
                  <span>Loading timeline...</span>
                </div>
              ) : timelineError ? (
                <div style={{ fontSize: '12px', color: '#c62828', padding: '8px 0' }}>
                  {timelineError}
                </div>
              ) : timeline.length > 0 ? (
                <div className="wos-activity-list">
                  {timeline.map(act => (
                    <div key={act.id} className="wos-activity-item">
                      <span className="wos-activity-date">{act.date} ·</span>
                      <span className="wos-activity-desc">{act.description}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--wos-label-muted)', padding: '6px 0' }}>
                  No recent activity recorded.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.aside>
  );
};
