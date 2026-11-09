export type ObjectType = 
  | 'customer' 
  | 'invoice' 
  | 'project' 
  | 'task' 
  | 'person' 
  | 'product' 
  | 'payment' 
  | 'contract';

export class NotFoundError extends Error {
  constructor(message: string = 'This record is unavailable') {
    super(message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'This record is unavailable') {
    super(message);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Could not load this information') {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export interface TimelineEvent {
  id: string;
  date: string;
  description: string;
}

export interface BusinessObject {
  id: string;
  companyId: string;
  type: ObjectType;
  name: string;
  code?: string;
  status?: string;
  owner?: string;
  amount?: string;
  dueDate?: string;
  createdDate?: string;
  description?: string;
  summaryFields?: Record<string, string | number>;
  activity?: TimelineEvent[];
  restricted?: boolean;
}

export interface RelationshipGroup {
  type: ObjectType;
  label: string;
  count: number;
  recordIds?: string[];
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  type: ObjectType | 'category';
  categoryKey?: string;
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

export interface CollectionFilterState {
  groupType: ObjectType;
  query?: string;
  status?: string;
}

export interface ReturnContext {
  objectId: string;
  historyIds: string[];
  viewMode: '3D' | 'List';
  camera?: CameraState;
  collectionFilter?: CollectionFilterState | null;
  openPanel?: 'none' | 'details' | 'collection';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface RecordFilter {
  query?: string;
  status?: string;
}

export interface DataProvider {
  getObject(id: string, companyId: string, signal?: AbortSignal): Promise<BusinessObject>;
  getRelationships(id: string, companyId: string, signal?: AbortSignal): Promise<RelationshipGroup[]>;
  searchObjects(query: string, companyId: string, signal?: AbortSignal, connectedToId?: string): Promise<BusinessObject[]>;
  getTimeline(id: string, companyId: string, signal?: AbortSignal): Promise<TimelineEvent[]>;
  getCollectionRecords(
    parentId: string, 
    groupType: ObjectType, 
    companyId: string, 
    page: number, 
    pageSize: number,
    filter?: RecordFilter,
    signal?: AbortSignal
  ): Promise<PaginatedResult<BusinessObject>>;
}

export interface ExplorerTheme {
  background?: string;
  central?: string;
  related?: string;
  selection?: string;
  label?: string;
  // Legacy / alternate aliases
  backgroundColor?: string;
  centralSphereColor?: string;
  relatedSphereColor?: string;
  selectionColor?: string;
  labelColor?: string;
}

export interface ObjectSpaceExplorerProps {
  /** Initial business record ID to focus on mount */
  startingId: string;
  /** Company partition context (e.g. company_globex) */
  companyContext: string;
  /** Asynchronous data provider implementing WorkOS business records query protocol */
  dataProvider: DataProvider;
  /** Callback fired when an execution handoff is triggered (e.g. Open project in WorkOS) */
  onOpenExecution?: (recordId: string, returnContext: ReturnContext) => void;
  /** Optional state restored when returning from an external WorkOS module */
  initialReturnContext?: ReturnContext | null;
  /** Theme palette overrides adhering to WorkOS specifications */
  theme?: ExplorerTheme;
  /** Callback fired when navigation to another business record occurs */
  onNavigate?: (objectId: string) => void;
  /** Error reporting callback */
  onError?: (err: Error) => void;
}
