import React, { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { 
  ObjectSpaceExplorerProps, 
  BusinessObject, 
  RelationshipGroup, 
  BreadcrumbItem, 
  CameraState, 
  ReturnContext,
  CollectionFilterState,
  NotFoundError,
  ForbiddenError
} from '../types';
import { ListView } from './views/ListView';
import { DetailsPanel } from './panels/DetailsPanel';
import { CollectionPanel } from './panels/CollectionPanel';
import { Breadcrumb } from './components/Breadcrumb';
import { SearchBar } from './components/SearchBar';
import { ViewSwitch } from './components/ViewSwitch';
import { CameraControlsOverlay } from './components/CameraControlsOverlay';
import { ShieldAlert, Loader2 } from 'lucide-react';
import './styles/explorer.css';

const Scene = lazy(() => import('./scene/Scene').then(({ Scene: scene }) => ({ default: scene })));

const detectWebGL = (): boolean => {
  if (typeof document === 'undefined') return false;
  if (typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent)) {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const attributes = { failIfMajorPerformanceCaveat: true };
    return Boolean(
      canvas.getContext('webgl', attributes) ||
      canvas.getContext('experimental-webgl', attributes)
    );
  } catch {
    return false;
  }
};

export const ObjectSpaceExplorer: React.FC<ObjectSpaceExplorerProps> = ({
  startingId,
  companyContext,
  dataProvider,
  onOpenExecution,
  initialReturnContext,
  theme,
  onNavigate,
  onError
}) => {
  // Navigation & Active Object State
  const [currentObjectId, setCurrentObjectId] = useState<string>(
    initialReturnContext?.objectId || startingId
  );
  const [currentObject, setCurrentObject] = useState<BusinessObject | null>(null);
  const [relationshipGroups, setRelationshipGroups] = useState<RelationshipGroup[]>([]);
  
  // Breadcrumb Trail State
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Bounded History stacks for Back and Forward navigation (Requirements 1.6 & 2.9)
  const [historyIds, setHistoryIds] = useState<string[]>(
    initialReturnContext?.historyIds || []
  );
  const [forwardIds, setForwardIds] = useState<string[]>([]);

  // Active temporary panel: 'none' | 'details' | 'collection' (Single panel rule)
  const [activePanel, setActivePanel] = useState<'none' | 'details' | 'collection'>(
    initialReturnContext?.openPanel || 'none'
  );
  const [activeGroup, setActiveGroup] = useState<RelationshipGroup | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilterState | null>(
    initialReturnContext?.collectionFilter || null
  );

  // View Mode: '3D' | 'List'
  const [viewMode, setViewMode] = useState<'3D' | 'List'>(
    initialReturnContext?.viewMode || '3D'
  );

  // Camera State and Triggers
  const currentCameraRef = useRef<CameraState | undefined>(initialReturnContext?.camera);
  const [cameraTrigger, setCameraTrigger] = useState<{
    action: 'zoomIn' | 'zoomOut' | 'reset' | 'restore';
    targetState?: CameraState;
    timestamp: number;
  } | null>(null);

  // Loading & Typed Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<'none' | 'unavailable' | 'network'>('none');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // WebGL support and crash fallback (Requirement 2.7)
  const [hasWebGL, setHasWebGL] = useState<boolean>(() => detectWebGL());
  const [webGlFallbackMessage, setWebGlFallbackMessage] = useState<string | null>(
    () => detectWebGL() ? null : '3D graphics unavailable. Showing accessible List view.'
  );

  // In-flight request cancellation reference (Requirement 2.1)
  const abortControllerRef = useRef<AbortController | null>(null);
  const sceneErrorHandledRef = useRef(false);
  const prevCompanyRef = useRef(companyContext);
  const prevStartingIdRef = useRef(startingId);
  const prevProviderRef = useRef(dataProvider);

  useEffect(() => {
    if (!hasWebGL) setViewMode('List');
  }, [hasWebGL]);

  // Fetch record & relationships with AbortSignal cancellation (Requirement 2.1)
  const loadObjectData = useCallback(async (id: string, companyId: string, isInitial: boolean = false) => {
    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setIsNavigating(true);
      }
      setErrorType('none');
      setErrorMessage(null);

      const [obj, rels] = await Promise.all([
        dataProvider.getObject(id, companyId, controller.signal),
        dataProvider.getRelationships(id, companyId, controller.signal)
      ]);

      if (controller.signal.aborted) return;

      setCurrentObject(obj);
      setRelationshipGroups(rels);

      if (obj.restricted) {
        setCurrentObject(null);
        setRelationshipGroups([]);
        setErrorType('unavailable');
        setErrorMessage('This record is unavailable');
        return;
      }

      // Rebuild breadcrumbs dynamically from ID / loaded record (Requirement 1.7: never trust stored labels)
      setBreadcrumbs(prev => {
        if (prev.length === 0) {
          return [
            { id: 'objects_root', label: 'Objects', type: 'category' },
            { id: obj.id, label: obj.name, type: obj.type }
          ];
        }
        const existingIdx = prev.findIndex(item => item.id === obj.id);
        if (existingIdx !== -1) {
          return prev.slice(0, existingIdx + 1);
        }
        return [...prev, { id: obj.id, label: obj.name, type: obj.type }];
      });

      // Restore active collection group if panel was open
      if (initialReturnContext?.openPanel === 'collection' && initialReturnContext.collectionFilter) {
        const matchingGroup = rels.find(g => g.type === initialReturnContext.collectionFilter?.groupType);
        if (matchingGroup) {
          setActiveGroup(matchingGroup);
        }
      }

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Could not load this information');
      if (error.name === 'AbortError') return;

      console.error('Failed to load object:', error);
      const isUnavailable = err instanceof NotFoundError || 
        err instanceof ForbiddenError || 
        error.name === 'NotFoundError' ||
        error.name === 'ForbiddenError' ||
        error.message.toLowerCase().includes('unavailable') ||
        error.message.toLowerCase().includes('not found');

      if (isUnavailable) {
        setErrorType('unavailable');
        setErrorMessage('This record is unavailable');
      } else {
        setErrorType('network');
        setErrorMessage(error.message || 'Could not load this information');
      }

      if (onError) onError(error);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setIsNavigating(false);
      }
    }
  }, [dataProvider, onError, initialReturnContext]);

  // Company change clears records, selection, history, panels, filters (Requirement 1.13)
  useEffect(() => {
    const contextChanged =
      prevCompanyRef.current !== companyContext ||
      prevStartingIdRef.current !== startingId ||
      prevProviderRef.current !== dataProvider;

    if (contextChanged) {
      prevCompanyRef.current = companyContext;
      prevStartingIdRef.current = startingId;
      prevProviderRef.current = dataProvider;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setCurrentObjectId(startingId);
      setCurrentObject(null);
      setRelationshipGroups([]);
      setBreadcrumbs([]);
      setHistoryIds([]);
      setForwardIds([]);
      setActivePanel('none');
      setActiveGroup(null);
      setCollectionFilter(null);
      loadObjectData(startingId, companyContext, true);
    }
  }, [companyContext, startingId, loadObjectData]);

  // Initial load on mount or return
  const isInitialMounted = useRef(false);
  useEffect(() => {
    if (!isInitialMounted.current) {
      isInitialMounted.current = true;
      const targetId = initialReturnContext?.objectId || startingId;
      loadObjectData(targetId, companyContext, true);
    }
  }, [companyContext, startingId, initialReturnContext, loadObjectData]);

  // Navigation to a new business record
  const navigateToObject = useCallback((targetId: string, intermediateGroup?: RelationshipGroup) => {
    if (targetId === currentObjectId) return;

    // Push current record ID to bounded history stack (max 50)
    setHistoryIds(prev => {
      const next = [...prev, currentObjectId];
      return next.length > 50 ? next.slice(next.length - 50) : next;
    });
    setForwardIds([]); // Clear forward stack on new forward action

    if (intermediateGroup) {
      setBreadcrumbs(prev => [
        ...prev,
        { id: `group_${intermediateGroup.type}`, label: intermediateGroup.label, type: 'category', categoryKey: intermediateGroup.type }
      ]);
    }

    setActivePanel('none');
    setActiveGroup(null);
    setCurrentObjectId(targetId);

    if (onNavigate) {
      onNavigate(targetId);
    }

    loadObjectData(targetId, companyContext, false);
  }, [currentObjectId, companyContext, loadObjectData, onNavigate]);

  // Back Navigation: Restore previous object from history stack (Requirement 1.6)
  const navigateBack = useCallback(() => {
    if (historyIds.length === 0) return;

    const previousId = historyIds[historyIds.length - 1];
    setHistoryIds(prev => prev.slice(0, -1));
    setForwardIds(prev => [...prev, currentObjectId]);

    setActivePanel('none');
    setActiveGroup(null);
    setCurrentObjectId(previousId);

    if (onNavigate) {
      onNavigate(previousId);
    }

    loadObjectData(previousId, companyContext, false);
  }, [historyIds, currentObjectId, companyContext, loadObjectData, onNavigate]);

  // Forward Navigation
  const navigateForward = useCallback(() => {
    if (forwardIds.length === 0) return;

    const nextId = forwardIds[forwardIds.length - 1];
    setForwardIds(prev => prev.slice(0, -1));
    setHistoryIds(prev => [...prev, currentObjectId]);

    setActivePanel('none');
    setActiveGroup(null);
    setCurrentObjectId(nextId);

    if (onNavigate) {
      onNavigate(nextId);
    }

    loadObjectData(nextId, companyContext, false);
  }, [forwardIds, currentObjectId, companyContext, loadObjectData, onNavigate]);

  // Breadcrumb Click Navigation: Clicking an earlier breadcrumb trims history (Requirement 1.6)
  const handleBreadcrumbClick = (index: number, item: BreadcrumbItem) => {
    if (index === 0 && item.id === 'objects_root') {
      navigateToObject(startingId);
      return;
    }

    if (item.type === 'category' && item.categoryKey) {
      // Category crumbs (e.g. "Invoices") reopen that collection panel
      const targetGroup = relationshipGroups.find(g => g.type === item.categoryKey);
      if (targetGroup) {
        setActiveGroup(targetGroup);
        setActivePanel('collection');
      }
      return;
    }

    if (item.id !== currentObjectId) {
      navigateToObject(item.id);
    }
  };

  // Open Execution Handoff (Figure 3 item 3)
  const handleOpenExecution = (recordId: string) => {
    if (onOpenExecution) {
      // Requirement 1.7: ReturnContext stores only IDs, filters, camera — no private records or names
      const returnCtx: ReturnContext = {
        objectId: currentObjectId,
        historyIds: [...historyIds],
        viewMode: viewMode,
        camera: currentCameraRef.current,
        collectionFilter: collectionFilter,
        openPanel: activePanel
      };
      onOpenExecution(recordId, returnCtx);
    }
  };

  // Spheres interactions
  const handleSelectCentral = () => {
    setActiveGroup(null);
    setActivePanel('details');
  };

  const handleSelectGroup = (group: RelationshipGroup) => {
    setActiveGroup(group);
    setActivePanel('collection');
  };

  const handleSelectRecordFromCollection = (record: BusinessObject) => {
    setActivePanel('none');
    navigateToObject(record.id, activeGroup || undefined);
  };

  // Camera overlays
  const handleZoomIn = () => setCameraTrigger({ action: 'zoomIn', timestamp: performance.now() });
  const handleZoomOut = () => setCameraTrigger({ action: 'zoomOut', timestamp: performance.now() });
  const handleResetCamera = () => setCameraTrigger({ action: 'reset', timestamp: performance.now() });

  return (
    <div className="workos-object-space" role="main">
      {/* Live announcement region for accessibility (Requirement 2.5) */}
      <div className="wos-sr-only" aria-live="polite" aria-atomic="true">
        {currentObject ? `Current business record: ${currentObject.name}, ${currentObject.type}.` : ''}
        {activePanel === 'details' && currentObject ? `Opened details panel for ${currentObject.name}.` : ''}
        {activePanel === 'collection' && activeGroup ? `Opened ${activeGroup.label} collection panel.` : ''}
      </div>

      {/* Action Row: Breadcrumbs, Global Search, View Switch */}
      <div className="wos-action-row">
        <Breadcrumb
          trail={breadcrumbs}
          canGoBack={historyIds.length > 0}
          canGoForward={forwardIds.length > 0}
          onBack={navigateBack}
          onForward={navigateForward}
          onNavigate={handleBreadcrumbClick}
        />

        <SearchBar
          dataProvider={dataProvider}
          companyId={companyContext}
          connectedToId={currentObjectId}
          onSelectObject={(obj) => navigateToObject(obj.id)}
        />

        <ViewSwitch
          viewMode={viewMode}
          has3D={hasWebGL}
          onChange={(mode) => setViewMode(mode)}
        />
      </div>

      {/* WebGL fallback notice if applicable */}
      {webGlFallbackMessage && (
        <div style={{
          padding: '6px 16px',
          background: 'var(--wos-selection-light)',
          color: 'var(--wos-selection)',
          fontSize: '12px',
          fontWeight: 500,
          textAlign: 'center',
          borderBottom: '1px solid var(--wos-border)'
        }}>
          {webGlFallbackMessage}
        </div>
      )}

      {/* Non-blocking Navigation Loading Indicator (Requirement 1.12) */}
      {isNavigating && (
        <div className="wos-loading-overlay-badge" aria-label="Loading record data">
          <Loader2 size={14} className="wos-spin" />
          <span>Updating object space...</span>
        </div>
      )}

      {/* Main View Area: Initial Loading, Error States, 3D Scene or List View */}
      {loading && !currentObject ? (
        <div className="wos-center-container">
          <div className="wos-spinner" />
          <span style={{ fontSize: '14px', color: 'var(--wos-label-muted)', fontWeight: 500 }}>
            Loading object space...
          </span>
        </div>
      ) : errorType === 'unavailable' ? (
        /* Requirement 1.10: Forbidden / Not Found -> "This record is unavailable", no retry, no private fields */
        <div className="wos-center-container">
          <ShieldAlert size={36} color="var(--wos-selection)" />
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '8px 0 4px', color: 'var(--wos-label)' }}>
            This record is unavailable
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--wos-label-muted)', maxWidth: '320px', textAlign: 'center', lineHeight: 1.4 }}>
            The requested business record does not exist or access has been restricted.
          </p>
          {historyIds.length > 0 && (
            <button className="wos-retry-btn" onClick={navigateBack} style={{ marginTop: '8px' }}>
              Return to previous object
            </button>
          )}
        </div>
      ) : errorType === 'network' ? (
        /* Requirement 1.10: Network failure -> "Could not load this information" + Retry */
        <div className="wos-center-container">
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#c62828' }}>
            {errorMessage || 'Could not load this information'}
          </span>
          <button
            className="wos-retry-btn"
            onClick={() => loadObjectData(currentObjectId, companyContext, false)}
          >
            Retry
          </button>
        </div>
      ) : currentObject && hasWebGL ? (
        <>
          <div className={viewMode === '3D' ? undefined : 'wos-scene-kept-alive'}>
            <Suspense fallback={<div className="wos-center-container"><div className="wos-spinner" /><span>Preparing 3D view...</span></div>}>
              <Scene
                currentObject={currentObject}
                relationshipGroups={relationshipGroups}
                selectedGroupId={activeGroup?.type || null}
                isDetailsOpen={activePanel === 'details'}
                onSelectCentral={handleSelectCentral}
                onSelectGroup={handleSelectGroup}
                onNavigateToObject={navigateToObject}
                initialCamera={initialReturnContext?.camera}
                cameraTrigger={cameraTrigger}
                onCameraChange={(cam) => {
                  currentCameraRef.current = cam;
                }}
                theme={theme}
                onSceneError={() => {
                  if (sceneErrorHandledRef.current) return;
                  sceneErrorHandledRef.current = true;
                  window.setTimeout(() => {
                    setViewMode('List');
                    setWebGlFallbackMessage('3D scene context lost. Restored in accessible List view.');
                  }, 0);
                }}
              />
            </Suspense>
          </div>

          {viewMode === '3D' ? (
            <CameraControlsOverlay
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onReset={handleResetCamera}
            />
          ) : (
            <ListView
              currentObject={currentObject}
              relationshipGroups={relationshipGroups}
              dataProvider={dataProvider}
              onSelectCentral={handleSelectCentral}
              onSelectGroup={handleSelectGroup}
              onNavigateToObject={navigateToObject}
              onOpenExecution={handleOpenExecution}
            />
          )}
        </>
      ) : currentObject ? (
        <ListView
          currentObject={currentObject}
          relationshipGroups={relationshipGroups}
          dataProvider={dataProvider}
          onSelectCentral={handleSelectCentral}
          onSelectGroup={handleSelectGroup}
          onNavigateToObject={navigateToObject}
          onOpenExecution={handleOpenExecution}
        />
      ) : null}

      {/* Temporary Side Panels (Single Drawer Rule: Details OR Collection) */}
      {activePanel === 'details' && currentObject && (
        <DetailsPanel
          object={currentObject}
          relationshipGroups={relationshipGroups}
          dataProvider={dataProvider}
          companyId={companyContext}
          onClose={() => setActivePanel('none')}
          onNavigateToObject={navigateToObject}
          onOpenExecution={handleOpenExecution}
        />
      )}

      {activePanel === 'collection' && currentObject && activeGroup && (
        <CollectionPanel
          parentObject={currentObject}
          group={activeGroup}
          dataProvider={dataProvider}
          companyId={companyContext}
          initialFilter={collectionFilter}
          onFilterChange={(filter) => setCollectionFilter(filter)}
          onClose={() => setActivePanel('none')}
          onSelectRecord={handleSelectRecordFromCollection}
        />
      )}
    </div>
  );
};
