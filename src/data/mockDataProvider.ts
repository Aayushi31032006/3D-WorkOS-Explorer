import { 
  DataProvider, 
  BusinessObject, 
  RelationshipGroup, 
  TimelineEvent, 
  PaginatedResult, 
  ObjectType, 
  RecordFilter,
  NotFoundError,
  ForbiddenError,
  NetworkError
} from '../types';
import { localDB } from './localDatabase';

export interface MockDataProviderOptions {
  networkDelayMs?: number;
  simulateError?: boolean;
  simulateEmptyGroup?: boolean;
  useLargeCollectionStress?: boolean;
}

export class MockDataProvider implements DataProvider {
  private networkDelayMs: number;
  public simulateError: boolean;
  public simulateEmptyGroup: boolean;
  public useLargeCollectionStress: boolean;

  constructor(options: MockDataProviderOptions = {}) {
    this.networkDelayMs = options.networkDelayMs ?? 120;
    this.simulateError = options.simulateError ?? false;
    this.simulateEmptyGroup = options.simulateEmptyGroup ?? false;
    this.useLargeCollectionStress = options.useLargeCollectionStress ?? false;
  }

  private async delay(signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    if (this.networkDelayMs > 0) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          resolve();
        }, this.networkDelayMs);

        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }
      });
    }
  }

  private checkError(): void {
    if (this.simulateError) {
      throw new NetworkError('Could not load this information');
    }
  }

  public async getObject(id: string, companyId: string, signal?: AbortSignal): Promise<BusinessObject> {
    await this.delay(signal);
    this.checkError();

    // Check special restricted record simulation
    if (id === 'record_restricted') {
      const baseRestricted = localDB.findById(id, companyId, this.useLargeCollectionStress);
      if (!baseRestricted) {
        throw new NotFoundError('This record is unavailable');
      }
      // Return safe, masked business object (no private fields per requirement 1.10)
      return {
        id: baseRestricted.id,
        companyId: baseRestricted.companyId,
        type: baseRestricted.type,
        name: 'Restricted Record',
        status: 'Restricted',
        restricted: true,
        description: 'This record is unavailable'
      };
    }

    const obj = localDB.findById(id, companyId, this.useLargeCollectionStress);
    if (!obj) {
      throw new NotFoundError(`This record is unavailable`);
    }

    if (obj.restricted) {
      return {
        id: obj.id,
        companyId: obj.companyId,
        type: obj.type,
        name: 'Restricted Record',
        status: 'Restricted',
        restricted: true,
        description: 'This record is unavailable'
      };
    }

    return obj;
  }

  public async getRelationships(id: string, companyId: string, signal?: AbortSignal): Promise<RelationshipGroup[]> {
    await this.delay(signal);
    this.checkError();

    return localDB.getRelationshipsFor(
      id, 
      companyId, 
      this.useLargeCollectionStress, 
      this.simulateEmptyGroup
    );
  }

  public async searchObjects(
    query: string,
    companyId: string,
    signal?: AbortSignal,
    connectedToId?: string
  ): Promise<BusinessObject[]> {
    await this.delay(signal);
    this.checkError();

    return localDB.search(query, companyId, this.useLargeCollectionStress, connectedToId);
  }

  public async getTimeline(id: string, companyId: string, signal?: AbortSignal): Promise<TimelineEvent[]> {
    await this.delay(signal);
    this.checkError();

    const obj = await this.getObject(id, companyId, signal);
    return obj.activity || [];
  }

  public async getCollectionRecords(
    parentId: string,
    groupType: ObjectType,
    companyId: string,
    page: number = 1,
    pageSize: number = 20,
    filter?: RecordFilter,
    signal?: AbortSignal
  ): Promise<PaginatedResult<BusinessObject>> {
    await this.delay(signal);
    this.checkError();

    if (this.simulateEmptyGroup) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize,
        hasMore: false
      };
    }

    return localDB.queryCollection(
      parentId,
      groupType,
      companyId,
      page,
      pageSize,
      filter,
      this.useLargeCollectionStress
    );
  }

  /**
   * Helper to resolve linked record dynamically (Requirement 1.4)
   */
  public async getLinkedRecordOfType(id: string, targetType: ObjectType): Promise<BusinessObject | null> {
    return localDB.findConnectedRecordOfType(id, targetType, this.useLargeCollectionStress);
  }
}
