import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X, Search, ChevronRight, Loader2, RotateCcw } from 'lucide-react';
import { BusinessObject, RelationshipGroup, DataProvider, CollectionFilterState } from '../../types';

export interface CollectionPanelProps {
  parentObject: BusinessObject;
  group: RelationshipGroup;
  dataProvider: DataProvider;
  companyId: string;
  initialFilter?: CollectionFilterState | null;
  onFilterChange?: (filter: CollectionFilterState) => void;
  onClose: () => void;
  onSelectRecord: (record: BusinessObject) => void;
}

export const CollectionPanel: React.FC<CollectionPanelProps> = ({
  parentObject,
  group,
  dataProvider,
  companyId,
  initialFilter,
  onFilterChange,
  onClose,
  onSelectRecord
}) => {
  const reducedMotion = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [records, setRecords] = useState<BusinessObject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>(initialFilter?.query || '');
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialFilter?.query || '');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter?.status || 'All');
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(group.count);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);
  const lastFilterKeyRef = useRef<string>('');

  // Focus trap and Escape key listener (Requirement 2.11)
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

  // Debounce search query ~250ms (Requirement 2.3)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Notify parent of filter change for ReturnContext preservation
  useEffect(() => {
    if (onFilterChange) {
      const nextFilter = {
        groupType: group.type,
        query: debouncedQuery,
        status: statusFilter
      };
      const filterKey = `${nextFilter.groupType}|${nextFilter.query}|${nextFilter.status}`;
      if (filterKey !== lastFilterKeyRef.current) {
        lastFilterKeyRef.current = filterKey;
        onFilterChange(nextFilter);
      }
    }
  }, [group.type, debouncedQuery, statusFilter, onFilterChange]);

  // Dynamic filter choices mapped to object domain (Requirement 2.3)
  const availableStatuses = useMemo(() => {
    switch (group.type) {
      case 'invoice':
        return ['All', 'Due', 'Paid', 'Draft', 'Pending Approval'];
      case 'project':
        return ['All', 'In Progress', 'Planning', 'Active', 'Completed', 'Draft'];
      case 'task':
        return ['All', 'In Progress', 'In Review', 'Completed', 'Pending'];
      case 'person':
        return ['All', 'Primary Contact', 'Director', 'Lead', 'Architect'];
      case 'product':
        return ['All', 'Active Subscription', 'Deployed', 'Trial'];
      case 'contract':
        return ['All', 'Executed', 'Active', 'Draft'];
      case 'payment':
        return ['All', 'Settled', 'Pending Authorization', 'In Escrow', 'Processing'];
      default:
        return ['All'];
    }
  }, [group.type]);

  const fetchRecords = useCallback(async (
    targetPage: number, 
    query: string, 
    status: string, 
    isAppend: boolean = false
  ) => {
    const requestId = ++requestIdRef.current;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    try {
      if (isAppend) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);

      const res = await dataProvider.getCollectionRecords(
        parentObject.id,
        group.type,
        companyId,
        targetPage,
        20,
        { query, status },
        controller.signal
      );

      if (requestId !== requestIdRef.current) return;
      if (isAppend) {
        setRecords(prev => [...prev, ...res.items]);
      } else {
        setRecords(res.items);
      }

      setHasMore(res.hasMore);
      setTotalCount(res.total);
      setPage(targetPage);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Could not load this information');
      if (requestId === requestIdRef.current && error.name !== 'AbortError') {
        setErrorMessage(error.message || 'Could not load this information');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [dataProvider, parentObject.id, group.type, companyId]);

  useEffect(() => () => {
    requestControllerRef.current?.abort();
    requestIdRef.current += 1;
  }, []);

  // Trigger query whenever debounced search query or status filter changes
  useEffect(() => {
    fetchRecords(1, debouncedQuery, statusFilter, false);
  }, [fetchRecords, debouncedQuery, statusFilter]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchRecords(page + 1, debouncedQuery, statusFilter, true);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setStatusFilter('All');
  };

  const isFiltering = searchQuery.trim() !== '' || statusFilter !== 'All';
  const panelTitle = `${group.label} for ${parentObject.name}`;
  const emptyWording = `No ${group.label.toLowerCase()} linked yet`;

  return (
    <motion.aside
      ref={panelRef}
      className="wos-drawer-panel"
      role="region"
      aria-label={panelTitle}
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 28 }}
      transition={{ duration: reducedMotion ? 0 : 0.28, ease: 'easeOut' }}
    >
      {/* Panel Header */}
      <div className="wos-panel-header">
        <div>
          <h2 className="wos-panel-title">{panelTitle}</h2>
          <span style={{ fontSize: '12px', color: 'var(--wos-label-muted)', fontWeight: 500 }}>
            {totalCount} {totalCount === 1 ? 'record' : 'records'} available
          </span>
        </div>
        <button 
          ref={closeButtonRef}
          className="wos-panel-close-btn" 
          onClick={onClose}
          aria-label="Close collection"
        >
          <X size={16} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="wos-panel-filters">
        <div className="wos-search-input-wrapper">
          <Search size={14} className="wos-search-icon" />
          <input
            type="text"
            className="wos-panel-search-input"
            placeholder={`Search ${group.label.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={`Search ${group.label}`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="wos-filter-clear-icon"
              aria-label="Clear search input"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {availableStatuses.length > 1 && (
          <div className="wos-filter-pills-row" role="tablist" aria-label="Status filters">
            {availableStatuses.map(status => {
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  role="tab"
                  aria-selected={active}
                  className={`wos-filter-pill ${active ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Body: Records list or states */}
      <div className="wos-panel-body">
        {loading && !loadingMore ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '8px' }}>
            <Loader2 size={20} className="wos-spin" />
            <span style={{ fontSize: '13px', color: 'var(--wos-label-muted)' }}>Loading records...</span>
          </div>
        ) : errorMessage ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', gap: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#c62828' }}>
              {errorMessage}
            </span>
            <button
              className="wos-retry-btn"
              onClick={() => fetchRecords(1, debouncedQuery, statusFilter, false)}
            >
              Retry
            </button>
          </div>
        ) : records.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px', gap: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--wos-label)' }}>
              {isFiltering ? 'No matching records found' : emptyWording}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--wos-label-muted)', maxWidth: '240px', lineHeight: 1.4 }}>
              {isFiltering 
                ? 'Try adjusting your search query or status filter.' 
                : `No ${group.label.toLowerCase()} are currently connected to ${parentObject.name}.`}
            </span>
            {isFiltering && (
              <button
                className="wos-retry-btn"
                onClick={handleClearFilters}
                style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="wos-records-list" role="list">
            {records.map(record => (
              <button
                key={record.id}
                className="wos-record-card-btn"
                onClick={() => onSelectRecord(record)}
                role="listitem"
                aria-label={`Select ${record.name}, ${record.status || ''}, ${record.amount || ''}`}
              >
                <div className="wos-card-main">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="wos-card-title">{record.name}</span>
                    {record.status && (
                      <span className={`wos-status-tag ${record.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {record.status}
                      </span>
                    )}
                  </div>
                  <div className="wos-card-meta">
                    {record.amount && <span style={{ fontWeight: 700, color: 'var(--wos-selection)' }}>{record.amount}</span>}
                    {record.dueDate && <span>Due {record.dueDate}</span>}
                    {record.owner && <span>· {record.owner}</span>}
                  </div>
                </div>
                <ChevronRight size={16} className="wos-card-arrow" />
              </button>
            ))}

            {/* Plain Paging: Load More Button (Requirement 2.3) */}
            {hasMore && (
              <div style={{ padding: '12px 0', textAlign: 'center' }}>
                <button
                  className="wos-load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={14} className="wos-spin" />
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <span>Load more ({totalCount - records.length} remaining)</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
};
