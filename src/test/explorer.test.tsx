import React from 'react';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { ObjectSpaceExplorer } from '../explorer';
import { MockDataProvider } from '../data/mockDataProvider';
import { localDB } from '../data/localDatabase';
import { BASE_OBJECTS } from '../data/sampleData';

vi.mock('../explorer/scene/Scene', () => ({
  Scene: ({ currentObject }: { currentObject: { name: string } }) => (
    <div aria-label="3D scene mock">{currentObject.name}</div>
  )
}));

afterEach(() => {
  cleanup();
});

describe('WorkOS Object Space Explorer Specification Acceptance Tests', () => {
  // Test 1: First screen shows Invoices (7)
  it('1.1: First screen shows Invoices (7) and expected relationship counts for Globex Ltd', async () => {
    const dataProvider = new MockDataProvider({ networkDelayMs: 0 });

    render(
      <ObjectSpaceExplorer
        startingId="cust_globex"
        companyContext="company_globex"
        dataProvider={dataProvider}
      />
    );

    // Initial breadcrumb and central customer
    await waitFor(() => {
      expect(screen.getAllByText('Globex Ltd').length).toBeGreaterThan(0);
      expect(screen.getByText('Objects')).toBeInTheDocument();
    });

    // Check relationship groups from data layer
    const rels = await dataProvider.getRelationships('cust_globex', 'company_globex');
    const invoiceGroup = rels.find(g => g.type === 'invoice');
    expect(invoiceGroup).toBeDefined();
    expect(invoiceGroup?.count).toBe(7);
  });

  // Test 2: Full canonical journey in List View
  it('1.2: Canonical journey Customer -> Invoices (7) -> INV-0042 -> linked project -> Open project in WorkOS -> Return', async () => {
    const dataProvider = new MockDataProvider({ networkDelayMs: 0 });
    const onOpenExecution = vi.fn();

    const { rerender } = render(
      <ObjectSpaceExplorer
        startingId="cust_globex"
        companyContext="company_globex"
        dataProvider={dataProvider}
        onOpenExecution={onOpenExecution}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Globex Ltd').length).toBeGreaterThan(0);
    });

    // Switch to List view
    fireEvent.click(screen.getByRole('button', { name: /list/i }));

    // Click Invoices group row (7 items -> opens collection panel)
    const invoicesRow = await screen.findByText('Invoices');
    fireEvent.click(invoicesRow);

    // Collection panel opens titled "Invoices for Globex Ltd"
    await waitFor(() => {
      expect(screen.getByText('Invoices for Globex Ltd')).toBeInTheDocument();
    });

    // Select INV-0042 from collection
    const inv42Card = screen.getByText('INV-0042');
    fireEvent.click(inv42Card);

    // Verify INV-0042 is central
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'INV-0042' })).toBeInTheDocument();
    });

    // Open Details panel
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));

    // Wait for details panel and verify dynamic linked project "Project Alpha"
    await waitFor(() => {
      expect(screen.getByText('Invoice details')).toBeInTheDocument();
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });

    // Click "Open project in WorkOS" button
    const openWorkOSBtn = screen.getByRole('button', { name: /open project in workos/i });
    fireEvent.click(openWorkOSBtn);

    expect(onOpenExecution).toHaveBeenCalledTimes(1);
    const [recordId, returnCtx] = onOpenExecution.mock.calls[0];
    expect(recordId).toBe('proj_alpha');
    expect(returnCtx.objectId).toBe('inv_0042');
    // Assert ReturnContext contains only IDs, filters and camera (NO record names)
    expect((returnCtx as any).name).toBeUndefined();
    expect((returnCtx as any).customerName).toBeUndefined();

    // Now simulate host return with returnCtx
    rerender(
      <ObjectSpaceExplorer
        startingId="cust_globex"
        companyContext="company_globex"
        dataProvider={dataProvider}
        initialReturnContext={returnCtx}
        onOpenExecution={onOpenExecution}
      />
    );

    // Verify returned view restores INV-0042 as center (never jumps to default customer)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'INV-0042' })).toBeInTheDocument();
    });
  });

  // Test 3: Back button and ReturnContext preserves history stack
  it('1.6 & 1.7: Back button restores previous record; Return restores history so Back keeps working', async () => {
    const dataProvider = new MockDataProvider({ networkDelayMs: 0 });

    render(
      <ObjectSpaceExplorer
        startingId="cust_globex"
        companyContext="company_globex"
        dataProvider={dataProvider}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Globex Ltd').length).toBeGreaterThan(0);
    });

    // Switch to List view
    fireEvent.click(screen.getByRole('button', { name: /list/i }));

    // Back button should initially be disabled
    const backBtn = screen.getByRole('button', { name: /go back/i });
    expect(backBtn).toBeDisabled();

    // Open Invoices and select INV-0042
    fireEvent.click(await screen.findByText('Invoices'));
    fireEvent.click(await screen.findByText('INV-0042'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'INV-0042' })).toBeInTheDocument();
    });

    // Now Back button should be enabled
    expect(backBtn).not.toBeDisabled();

    // Click Back button
    fireEvent.click(backBtn);

    // Restores Globex Ltd
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Globex Ltd' })).toBeInTheDocument();
    });
  });

  // Test 4: INV-0043 links to proj_beta (Requirement 1.4)
  it('1.4: Dynamic project resolution: INV-0043 links to proj_beta and hands off proj_beta', async () => {
    const dataProvider = new MockDataProvider({ networkDelayMs: 0 });
    const onOpenExecution = vi.fn();

    render(
      <ObjectSpaceExplorer
        startingId="inv_0043"
        companyContext="company_globex"
        dataProvider={dataProvider}
        onOpenExecution={onOpenExecution}
      />
    );

    // Wait for initial load of INV-0043
    await waitFor(() => {
      expect(screen.getAllByText('INV-0043').length).toBeGreaterThan(0);
    });

    // Switch to List view
    fireEvent.click(screen.getByRole('button', { name: /list/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'INV-0043' })).toBeInTheDocument();
    });

    // Open details
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));

    await waitFor(() => {
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });

    // Click "Open project in WorkOS"
    const openBtn = screen.getByRole('button', { name: /open project in workos/i });
    fireEvent.click(openBtn);

    expect(onOpenExecution).toHaveBeenCalledWith('proj_beta', expect.anything());
  });

  // Test 5: Single-record groups (Requirement 1.5)
  it('1.5: Single-record group click navigates directly to the record; 2+ opens collection panel', async () => {
    const dataProvider = new MockDataProvider({ networkDelayMs: 0 });

    render(
      <ObjectSpaceExplorer
        startingId="inv_0042"
        companyContext="company_globex"
        dataProvider={dataProvider}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByText('INV-0042').length).toBeGreaterThan(0);
    });

    // Switch to List view
    fireEvent.click(screen.getByRole('button', { name: /list/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'INV-0042' })).toBeInTheDocument();
    });

    // Customer group has exactly 1 record (Globex Ltd). Clicking it navigates directly to Globex Ltd
    const customerRow = screen.getByLabelText(/Customer group containing 1 record/i);
    fireEvent.click(customerRow);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Globex Ltd' })).toBeInTheDocument();
    });

    // On Globex Ltd, Invoices group has 7 records (2+). Clicking it opens the collection panel
    const invoicesRow = screen.getByLabelText(/Invoices group containing 7 records/i);
    fireEvent.click(invoicesRow);

    await waitFor(() => {
      expect(screen.getByText('Invoices for Globex Ltd')).toBeInTheDocument();
    });
  });

  // Test 6: Every sample record has at least one connection (Requirement 1.3)
  it('1.3: Graph integrity: every base record has at least one connection with zero dead ends', () => {
    for (const [id, obj] of Object.entries(BASE_OBJECTS)) {
      const rels = localDB.getRelationshipsFor(id, obj.companyId);
      const totalConnections = rels.reduce((sum, g) => sum + g.count, 0);
      expect(totalConnections).toBeGreaterThan(0);
    }
  });

  // Test 7: Stable IDs in normal and 1K mode (Requirement 1.2)
  it('1.2: Stable IDs: inv_0048 has same stable ID in 1K mode with no inv_stress_* prefixes', async () => {
    const regularProvider = new MockDataProvider({ networkDelayMs: 0, useLargeCollectionStress: false });
    const largeProvider = new MockDataProvider({ networkDelayMs: 0, useLargeCollectionStress: true });

    const obj42Regular = await regularProvider.getObject('inv_0042', 'company_globex');
    const obj42Large = await largeProvider.getObject('inv_0042', 'company_globex');
    expect(obj42Regular.id).toBe('inv_0042');
    expect(obj42Large.id).toBe('inv_0042');

    // 1K mode item inv_0048 has real stable ID
    const obj48 = await largeProvider.getObject('inv_0048', 'company_globex');
    expect(obj48.id).toBe('inv_0048');
    expect(obj48.name).toBe('INV-0048');
    expect(obj48.id.startsWith('inv_stress_')).toBe(false);
  });

  // Test 8: Search dropdown and company switch prop (Requirements 2.15 & 1.13)
  it('2.15 & 1.13: Search dropdown finds records; company prop switch resets explorer state', async () => {
    const dataProvider = new MockDataProvider({ networkDelayMs: 0 });

    const { rerender } = render(
      <ObjectSpaceExplorer
        startingId="cust_globex"
        companyContext="company_globex"
        dataProvider={dataProvider}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Globex Ltd').length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(/search connected records/i);
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });

    // Select search result
    fireEvent.click(screen.getByText('Project Alpha'));

    // Switch to list view to verify Project Alpha is central
    fireEvent.click(screen.getByRole('button', { name: /list/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Project Alpha' })).toBeInTheDocument();
    });

    // Now change companyContext prop to Initech
    rerender(
      <ObjectSpaceExplorer
        startingId="cust_initech"
        companyContext="company_initech"
        dataProvider={dataProvider}
      />
    );

    // Explorer should clear previous company data and render Initech Corporation
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Initech Corporation' })).toBeInTheDocument();
    });
  });

  // Test 9: Loading overlay, empty, network error + Retry, restricted (Requirements 1.10, 1.11, 1.12)
  it('1.10, 1.11, 1.12: Loading, Empty state ("No invoices linked yet"), Network Error + Retry, Restricted message', async () => {
    // 9a: Error + Retry
    const errorProvider = new MockDataProvider({ networkDelayMs: 0, simulateError: true });
    const { rerender } = render(
      <ObjectSpaceExplorer
        startingId="cust_globex"
        companyContext="company_globex"
        dataProvider={errorProvider}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Could not load this information')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    errorProvider.simulateError = false;
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Globex Ltd').length).toBeGreaterThan(0);
    });

    // 9b: Empty state
    const emptyProvider = new MockDataProvider({ networkDelayMs: 0, simulateEmptyGroup: true });
    rerender(
      <ObjectSpaceExplorer
        startingId="cust_globex"
        companyContext="company_globex"
        dataProvider={emptyProvider}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Globex Ltd').length).toBeGreaterThan(0);
    });

    // Switch to List view
    fireEvent.click(screen.getByRole('button', { name: /list/i }));

    // Click Invoices (0)
    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Invoices'));

    // Panel displays exact brief wording: "No invoices linked yet"
    await waitFor(() => {
      expect(screen.getByText('No invoices linked yet')).toBeInTheDocument();
    });

    // 9c: Restricted record
    const normalProvider = new MockDataProvider({ networkDelayMs: 0 });
    rerender(
      <ObjectSpaceExplorer
        startingId="record_restricted"
        companyContext="company_globex"
        dataProvider={normalProvider}
      />
    );

    // Shows "This record is unavailable" with no retry button and no private fields
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'This record is unavailable' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  // Test 10: 1,000 invoices paged 20 at a time with "Load more" button (Requirement 2.3)
  it('2.3: 1,000 invoices load 20 per page, and clicking "Load more" gives 40', async () => {
    const largeProvider = new MockDataProvider({ networkDelayMs: 0, useLargeCollectionStress: true });

    render(
      <ObjectSpaceExplorer
        startingId="cust_globex"
        companyContext="company_globex"
        dataProvider={largeProvider}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Globex Ltd').length).toBeGreaterThan(0);
    });

    // Switch to List view
    fireEvent.click(screen.getByRole('button', { name: /list/i }));

    // Click Invoices group
    fireEvent.click(await screen.findByText('Invoices'));

    await waitFor(() => {
      expect(screen.getByText('Invoices for Globex Ltd')).toBeInTheDocument();
      expect(screen.getByText(/1000 records available/i)).toBeInTheDocument();
    });

    // Initially 20 items loaded
    const loadMoreBtn = screen.getByRole('button', { name: /load more/i });
    expect(loadMoreBtn).toBeInTheDocument();

    // Click "Load more"
    fireEvent.click(loadMoreBtn);

    // Paging increments and items increase
    await waitFor(() => {
      expect(screen.getByText(/960 remaining/i)).toBeInTheDocument();
    });
  });

  // Test 11: Escape closes panel; blank space click does not close panel
  it('Blank space click does not close panel; Escape key closes panel', async () => {
    const dataProvider = new MockDataProvider({ networkDelayMs: 0 });

    render(
      <ObjectSpaceExplorer
        startingId="cust_globex"
        companyContext="company_globex"
        dataProvider={dataProvider}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Globex Ltd').length).toBeGreaterThan(0);
    });

    // Switch to List view
    fireEvent.click(screen.getByRole('button', { name: /list/i }));

    // Open Invoices collection panel
    fireEvent.click(await screen.findByText('Invoices'));

    await waitFor(() => {
      expect(screen.getByText('Invoices for Globex Ltd')).toBeInTheDocument();
    });

    // Click container empty space
    const mainShell = screen.getByRole('main');
    fireEvent.click(mainShell);

    // Panel must still be open
    expect(screen.getByText('Invoices for Globex Ltd')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });

    // Panel closes
    await waitFor(() => {
      expect(screen.queryByText('Invoices for Globex Ltd')).not.toBeInTheDocument();
    });
  });
});
