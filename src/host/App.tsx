import React, { useState, useMemo } from 'react';
import { WorkOSHeader } from './WorkOSHeader';
import { PMSPlaceholder } from './PMSPlaceholder';
import { WorkOSModuleView } from './WorkOSModuleViews';
import { ObjectSpaceExplorer } from '../explorer';
import { MockDataProvider } from '../data/mockDataProvider';
import { ReturnContext, BusinessObject } from '../types';
import './host.css';

export const App: React.FC = () => {
  // Demo Host Navigation State
  const [activeNavTab, setActiveNavTab] = useState<string>('object_space');
  const [activeScreen, setActiveScreen] = useState<'object_space' | 'pms_placeholder'>('object_space');
  
  // Execution Handoff State (Figure 3 item 3)
  const [executionRecordId, setExecutionRecordId] = useState<string | null>(null);
  const [executionRecord, setExecutionRecord] = useState<BusinessObject | undefined>(undefined);
  const [savedReturnContext, setSavedReturnContext] = useState<ReturnContext | null>(null);

  // Company Partitioning State
  const [currentCompany, setCurrentCompany] = useState<string>('company_globex');

  // Edge Case Simulation Flags (Requirement 1.1: 1K Records default OFF)
  const [simulateError, setSimulateError] = useState<boolean>(false);
  const [simulateEmpty, setSimulateEmpty] = useState<boolean>(false);
  const [largeCollectionStress, setLargeCollectionStress] = useState<boolean>(false);
  const [restrictedDemo, setRestrictedDemo] = useState<boolean>(false);

  // Instantiate data provider with active mock configuration
  const dataProvider = useMemo(() => {
    return new MockDataProvider({
      networkDelayMs: 100,
      simulateError,
      simulateEmptyGroup: simulateEmpty,
      useLargeCollectionStress: largeCollectionStress
    });
  }, [simulateError, simulateEmpty, largeCollectionStress]);

  // Determine starting root object by company partition
  const startingObjectId = restrictedDemo
    ? 'record_restricted'
    : currentCompany === 'company_globex' ? 'cust_globex' : 'cust_initech';

  const handleCompanyChange = (newCompanyId: string) => {
    setCurrentCompany(newCompanyId);
    setSavedReturnContext(null);
    setActiveScreen('object_space');
    setRestrictedDemo(false);
  };

  const handleOpenExecution = async (recordId: string, returnContext: ReturnContext) => {
    setSavedReturnContext(returnContext);
    setExecutionRecordId(recordId);

    try {
      const obj = await dataProvider.getObject(recordId, currentCompany);
      setExecutionRecord(obj);
    } catch {
      setExecutionRecord(undefined);
    }

    setActiveScreen('pms_placeholder');
  };

  const handleReturnFromPMS = (ctx: ReturnContext) => {
    setSavedReturnContext(ctx);
    setActiveScreen('object_space');
  };

  return (
    <div className="workos-host-container">
      {/* Top WorkOS Navigation Bar */}
      <WorkOSHeader
        currentCompany={currentCompany}
        onCompanyChange={handleCompanyChange}
        simulateError={simulateError}
        onToggleSimulateError={() => setSimulateError(prev => !prev)}
        simulateEmpty={simulateEmpty}
        onToggleSimulateEmpty={() => setSimulateEmpty(prev => !prev)}
        largeCollectionStress={largeCollectionStress}
        onToggleLargeCollectionStress={() => setLargeCollectionStress(prev => !prev)}
        restrictedDemo={restrictedDemo}
        onToggleRestrictedDemo={() => {
          setRestrictedDemo(prev => !prev);
          setSavedReturnContext(null);
          setActiveScreen('object_space');
        }}
        activeNavTab={activeNavTab}
        onNavTabChange={(tab) => {
          setActiveNavTab(tab);
          if (tab === 'object_space') {
            setActiveScreen('object_space');
          }
        }}
      />

      {/* Main Content Area. Keep the 3D tree mounted while host screens change. */}
      <div
        className="workos-explorer-shell"
        aria-hidden={activeNavTab !== 'object_space' || activeScreen !== 'object_space'}
      >
        <ObjectSpaceExplorer
          startingId={startingObjectId}
          companyContext={currentCompany}
          dataProvider={dataProvider}
          initialReturnContext={savedReturnContext}
          onOpenExecution={handleOpenExecution}
        />
      </div>

      {activeNavTab !== 'object_space' ? (
        <div className="workos-host-overlay">
          <WorkOSModuleView
            module={activeNavTab}
            onReturnToObjectSpace={() => {
              setActiveNavTab('object_space');
              setActiveScreen('object_space');
            }}
          />
        </div>
      ) : activeScreen === 'pms_placeholder' && executionRecordId && savedReturnContext ? (
        <div className="workos-host-overlay">
          <PMSPlaceholder
            recordId={executionRecordId}
            record={executionRecord}
            returnContext={savedReturnContext}
            onReturn={handleReturnFromPMS}
          />
        </div>
      ) : null}
    </div>
  );
};
