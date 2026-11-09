import React from 'react';
import { 
  Box, 
  Globe, 
  CheckSquare, 
  Eye, 
  LayoutGrid, 
  Layers, 
  Building
} from 'lucide-react';

export interface WorkOSHeaderProps {
  currentCompany: string;
  onCompanyChange: (companyId: string) => void;
  simulateError: boolean;
  onToggleSimulateError: () => void;
  simulateEmpty: boolean;
  onToggleSimulateEmpty: () => void;
  largeCollectionStress: boolean;
  onToggleLargeCollectionStress: () => void;
  restrictedDemo: boolean;
  onToggleRestrictedDemo: () => void;
  activeNavTab: string;
  onNavTabChange: (tab: string) => void;
}

export const WorkOSHeader: React.FC<WorkOSHeaderProps> = ({
  currentCompany,
  onCompanyChange,
  simulateError,
  onToggleSimulateError,
  simulateEmpty,
  onToggleSimulateEmpty,
  largeCollectionStress,
  onToggleLargeCollectionStress,
  restrictedDemo,
  onToggleRestrictedDemo,
  activeNavTab,
  onNavTabChange
}) => {
  const navItems = [
    { id: 'world', label: 'World', icon: Globe },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'review', label: 'Review', icon: Eye },
    { id: 'gallery', label: 'Gallery', icon: LayoutGrid },
    { id: 'object_space', label: 'Object Space', icon: Box },
    { id: 'qm', label: 'QM', icon: Layers }
  ];

  return (
    <header className="workos-top-header" role="banner">
      {/* Brand & WorkOS Top Navigation (Matching Figure 1 & 2 item 1) */}
      <div className="workos-nav-brand">
        <div className="workos-logo-badge">
          <Box size={20} color="#7046B2" />
          <span>WorkOS</span>
        </div>

        <nav className="workos-nav-items" aria-label="Main menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavTab === item.id;
            return (
              <button
                key={item.id}
                className={`workos-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onNavTabChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Demo Host Controls (Company Switcher & Edge State Simulation) */}
      <div className="workos-demo-controls">
        {/* Company Scoping Switcher (Requirement 1.13) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building size={14} color="#6B5E87" />
          <select
            className="workos-select"
            value={currentCompany}
            onChange={(e) => onCompanyChange(e.target.value)}
            aria-label="Switch active company context"
          >
            <option value="company_globex">Globex Ltd</option>
            <option value="company_initech">Initech Corporation</option>
          </select>
        </div>

        {/* 1,000 Records Test Toggle (Requirement 1.1: Default OFF) */}
        <button
          className={`workos-toggle-btn ${largeCollectionStress ? 'btn-active' : ''}`}
          onClick={onToggleLargeCollectionStress}
          title="Toggle 1,000 invoices pagination stress test"
        >
          {largeCollectionStress ? '1K Records: ON' : 'Test 1K Records'}
        </button>

        {/* Empty Group State Toggle (Requirement 1.11) */}
        <button
          className={`workos-toggle-btn ${simulateEmpty ? 'btn-active' : ''}`}
          onClick={onToggleSimulateEmpty}
          title="Simulate empty relationships state"
        >
          {simulateEmpty ? 'Empty: ON' : 'Test Empty'}
        </button>

        {/* Error Simulation State Toggle (Requirement 1.10) */}
        <button
          className={`workos-toggle-btn ${simulateError ? 'btn-danger-active' : ''}`}
          onClick={onToggleSimulateError}
          title="Simulate network failure and error retry"
        >
          {simulateError ? 'Error: ON' : 'Test Error'}
        </button>

        <button
          className={`workos-toggle-btn ${restrictedDemo ? 'btn-active' : ''}`}
          onClick={onToggleRestrictedDemo}
          title="Open the restricted-record privacy demonstration"
        >
          {restrictedDemo ? 'Restricted: ON' : 'Test Restricted'}
        </button>
      </div>
    </header>
  );
};
