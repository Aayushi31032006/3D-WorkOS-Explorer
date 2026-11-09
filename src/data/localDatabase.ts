import { 
  BusinessObject, 
  ObjectType, 
  RelationshipGroup, 
  RecordFilter, 
  PaginatedResult 
} from '../types';
import { 
  BASE_OBJECTS, 
  BASE_RELATIONSHIPS, 
  generate1000InvoicesDataset 
} from './sampleData';

const EXPECTED_RELATIONSHIP_TYPES: Record<ObjectType, ObjectType[]> = {
  customer: ['invoice', 'project', 'person', 'task', 'product', 'contract', 'payment'],
  invoice: ['customer', 'project', 'payment', 'task'],
  project: ['customer', 'invoice', 'task', 'person'],
  task: ['project', 'person'],
  person: ['customer', 'project', 'task'],
  product: ['customer', 'project'],
  payment: ['invoice'],
  contract: ['customer']
};

export const LABEL_MAP: Record<ObjectType, string> = {
  customer: 'Customer',
  invoice: 'Invoices',
  project: 'Projects',
  task: 'Tasks',
  person: 'Contacts',
  product: 'Products',
  payment: 'Payment',
  contract: 'Contracts'
};

/**
 * LocalDatabase
 * Pure in-memory relational graph database with O(1) Map-based indexes.
 * Supports bi-directional relationship inference, dynamic derived summary fields,
 * and stable 1,000-record dataset indexing on demand.
 */
export class LocalDatabase {
  // Base Dataset Indexes
  private baseObjects = new Map<string, BusinessObject>();
  private baseCompanyIndex = new Map<string, string[]>();
  private baseAdjacency = new Map<string, Set<string>>();

  // 1K Records Dataset Indexes
  private largeObjects = new Map<string, BusinessObject>();
  private largeCompanyIndex = new Map<string, string[]>();
  private largeAdjacency = new Map<string, Set<string>>();
  private isLargeIndexed = false;

  constructor() {
    this.indexBaseData();
  }

  private indexBaseData(): void {
    // 1. Index objects
    for (const [id, obj] of Object.entries(BASE_OBJECTS)) {
      this.baseObjects.set(id, { ...obj });
      const companyList = this.baseCompanyIndex.get(obj.companyId) || [];
      companyList.push(id);
      this.baseCompanyIndex.set(obj.companyId, companyList);
    }

    // 2. Index bi-directional adjacency
    for (const { fromId, toId } of BASE_RELATIONSHIPS) {
      this.addAdjacencyLink(this.baseAdjacency, fromId, toId);
    }
  }

  private addAdjacencyLink(adjMap: Map<string, Set<string>>, a: string, b: string): void {
    if (!adjMap.has(a)) adjMap.set(a, new Set());
    if (!adjMap.has(b)) adjMap.set(b, new Set());
    adjMap.get(a)!.add(b);
    adjMap.get(b)!.add(a);
  }

  private ensureLargeIndexed(): void {
    if (this.isLargeIndexed) return;

    // Clone base indexes into large indexes
    for (const [id, obj] of this.baseObjects.entries()) {
      this.largeObjects.set(id, { ...obj });
    }
    for (const [compId, list] of this.baseCompanyIndex.entries()) {
      this.largeCompanyIndex.set(compId, [...list]);
    }
    for (const [id, set] of this.baseAdjacency.entries()) {
      this.largeAdjacency.set(id, new Set(set));
    }

    // Generate enough extra invoices to make the combined collection 1,000 records.
    const { objects, relationships } = generate1000InvoicesDataset();
    for (const [id, obj] of Object.entries(objects)) {
      this.largeObjects.set(id, { ...obj });
      const companyList = this.largeCompanyIndex.get(obj.companyId) || [];
      companyList.push(id);
      this.largeCompanyIndex.set(obj.companyId, companyList);
    }
    for (const { fromId, toId } of relationships) {
      this.addAdjacencyLink(this.largeAdjacency, fromId, toId);
    }

    this.isLargeIndexed = true;
  }

  private getStore(useLarge: boolean = false) {
    if (useLarge) {
      this.ensureLargeIndexed();
      return {
        objects: this.largeObjects,
        companyIndex: this.largeCompanyIndex,
        adjacency: this.largeAdjacency
      };
    }
    return {
      objects: this.baseObjects,
      companyIndex: this.baseCompanyIndex,
      adjacency: this.baseAdjacency
    };
  }

  /**
   * Derive summary fields dynamically from graph connections (Requirement 1.3:
   * never duplicate relationships as hard-coded text).
   */
  private enrichObject(rawObj: BusinessObject, useLarge: boolean): BusinessObject {
    const { objects, adjacency } = this.getStore(useLarge);
    const neighbors = Array.from(adjacency.get(rawObj.id) || [])
      .map(id => objects.get(id))
      .filter((n): n is BusinessObject => !!n);

    const summary: Record<string, string | number> = { ...(rawObj.summaryFields || {}) };

    if (rawObj.type === 'customer') {
      const invoices = neighbors.filter(n => n.type === 'invoice');
      const projects = neighbors.filter(n => n.type === 'project');
      const contacts = neighbors.filter(n => n.type === 'person');
      summary['Active Invoices'] = invoices.length;
      summary['Active Projects'] = projects.length;
      summary['Primary Contacts'] = contacts.length;
      if (contacts[0]) summary['Primary Contact'] = contacts[0].name;
    } else if (rawObj.type === 'invoice') {
      const cust = neighbors.find(n => n.type === 'customer');
      const proj = neighbors.find(n => n.type === 'project');
      const pay = neighbors.find(n => n.type === 'payment');
      if (cust) summary['Customer'] = cust.name;
      if (proj) summary['Linked project'] = proj.name;
      if (pay) summary['Payment Reference'] = pay.name;
      summary['Payment Terms'] = 'Net 30';
    } else if (rawObj.type === 'project') {
      const cust = neighbors.find(n => n.type === 'customer');
      const tasks = neighbors.filter(n => n.type === 'task');
      const contacts = neighbors.filter(n => n.type === 'person');
      if (cust) summary['Customer'] = cust.name;
      summary['Linked Tasks'] = tasks.length;
      if (contacts[0]) summary['Project Lead'] = contacts[0].name;
    } else if (rawObj.type === 'task') {
      const proj = neighbors.find(n => n.type === 'project');
      const assignee = neighbors.find(n => n.type === 'person');
      if (proj) summary['Parent project'] = proj.name;
      if (assignee) summary['Assignee'] = assignee.name;
    } else if (rawObj.type === 'person') {
      const cust = neighbors.find(n => n.type === 'customer');
      const projs = neighbors.filter(n => n.type === 'project');
      if (cust) summary['Organization'] = cust.name;
      if (projs.length > 0) summary['Assigned Projects'] = projs.map(p => p.name).join(', ');
    } else if (rawObj.type === 'product') {
      const cust = neighbors.find(n => n.type === 'customer');
      const projs = neighbors.filter(n => n.type === 'project');
      if (cust) summary['Customer'] = cust.name;
      if (projs.length > 0) summary['Deployed In'] = projs.map(p => p.name).join(', ');
    } else if (rawObj.type === 'payment') {
      const invs = neighbors.filter(n => n.type === 'invoice');
      if (invs.length > 0) summary['Invoices'] = invs.map(i => i.name).join(', ');
    } else if (rawObj.type === 'contract') {
      const cust = neighbors.find(n => n.type === 'customer');
      if (cust) summary['Counterparty'] = cust.name;
    }

    return {
      ...rawObj,
      summaryFields: summary
    };
  }

  public findById(id: string, companyId: string, useLarge: boolean = false): BusinessObject | null {
    const { objects } = this.getStore(useLarge);
    const obj = objects.get(id);
    if (!obj || obj.companyId !== companyId) {
      return null;
    }
    return this.enrichObject(obj, useLarge);
  }

  public getRelationshipsFor(
    id: string, 
    companyId: string, 
    useLarge: boolean = false,
    forceEmpty: boolean = false
  ): RelationshipGroup[] {
    const { objects, adjacency } = this.getStore(useLarge);
    const current = objects.get(id);
    if (!current) return [];

    const expectedTypes = EXPECTED_RELATIONSHIP_TYPES[current.type] || [];

    if (forceEmpty) {
      return expectedTypes.map(type => ({
        type,
        label: LABEL_MAP[type] || type,
        count: 0,
        recordIds: []
      }));
    }

    const neighborIds = Array.from(adjacency.get(id) || []);
    const groupMap = new Map<ObjectType, string[]>();

    for (const nId of neighborIds) {
      const neighbor = objects.get(nId);
      if (neighbor && neighbor.companyId === companyId) {
        const list = groupMap.get(neighbor.type) || [];
        list.push(nId);
        groupMap.set(neighbor.type, list);
      }
    }

    // Build relationship groups for all expected types (with count 0 if none)
    // plus any other connected types
    const seenTypes = new Set<ObjectType>();
    const groups: RelationshipGroup[] = [];

    for (const type of expectedTypes) {
      seenTypes.add(type);
      const ids = groupMap.get(type) || [];
      groups.push({
        type,
        label: LABEL_MAP[type] || type,
        count: ids.length,
        recordIds: ids
      });
    }

    // Add any connected types not in default expected list
    for (const [type, ids] of groupMap.entries()) {
      if (!seenTypes.has(type)) {
        groups.push({
          type,
          label: LABEL_MAP[type] || type,
          count: ids.length,
          recordIds: ids
        });
      }
    }

    return groups;
  }

  public search(
    query: string,
    companyId: string,
    useLarge: boolean = false,
    connectedToId?: string
  ): BusinessObject[] {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    const { objects, adjacency } = this.getStore(useLarge);

    const results: BusinessObject[] = [];
    for (const obj of objects.values()) {
      if (obj.companyId !== companyId) continue;

      // Requirement 2.15: Scoped to records that have at least one connection
      const neighborCount = adjacency.get(obj.id)?.size || 0;
      if (neighborCount === 0) continue;
      if (connectedToId && !adjacency.get(connectedToId)?.has(obj.id)) continue;

      if (
        obj.name.toLowerCase().includes(q) ||
        obj.code?.toLowerCase().includes(q) ||
        obj.type.toLowerCase().includes(q) ||
        obj.owner?.toLowerCase().includes(q)
      ) {
        results.push(this.enrichObject(obj, useLarge));
        if (results.length >= 15) break;
      }
    }
    return results;
  }

  public queryCollection(
    parentId: string,
    groupType: ObjectType,
    companyId: string,
    page: number = 1,
    pageSize: number = 20,
    filter?: RecordFilter,
    useLarge: boolean = false
  ): PaginatedResult<BusinessObject> {
    const { objects, adjacency } = this.getStore(useLarge);
    const neighborIds = Array.from(adjacency.get(parentId) || []);

    let records: BusinessObject[] = [];
    for (const nId of neighborIds) {
      const n = objects.get(nId);
      if (n && n.type === groupType && n.companyId === companyId) {
        records.push(this.enrichObject(n, useLarge));
      }
    }

    // Sort: Ensure canonical invoices (0041-0047) or natural numerical order
    records.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    // Apply Filter (query & status)
    if (filter) {
      if (filter.query && filter.query.trim()) {
        const q = filter.query.toLowerCase().trim();
        records = records.filter(r =>
          r.name.toLowerCase().includes(q) ||
          r.code?.toLowerCase().includes(q) ||
          r.owner?.toLowerCase().includes(q)
        );
      }
      if (filter.status && filter.status !== 'All') {
        const statusMatch = filter.status.toLowerCase();
        records = records.filter(r => r.status?.toLowerCase() === statusMatch);
      }
    }

    const total = records.length;
    const startIndex = (page - 1) * pageSize;
    const items = records.slice(startIndex, startIndex + pageSize);
    const hasMore = startIndex + pageSize < total;

    return {
      items,
      total,
      page,
      pageSize,
      hasMore
    };
  }

  /**
   * Find a connected record of a specific type for navigation resolution
   * (e.g. resolve linked project for INV-0042 -> proj_alpha, INV-0043 -> proj_beta)
   */
  public findConnectedRecordOfType(id: string, targetType: ObjectType, useLarge: boolean = false): BusinessObject | null {
    const { objects, adjacency } = this.getStore(useLarge);
    const neighborIds = Array.from(adjacency.get(id) || []);
    for (const nId of neighborIds) {
      const n = objects.get(nId);
      if (n && n.type === targetType) {
        return this.enrichObject(n, useLarge);
      }
    }
    return null;
  }
}

export const localDB = new LocalDatabase();
