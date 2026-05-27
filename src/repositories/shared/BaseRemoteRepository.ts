import { SortOrder } from '@nozbe/watermelondb/QueryDescription';

export abstract class BaseRemoteRepository<T> {
  
  abstract create(item: T): Promise<T>;

  abstract delete(id: string): Promise<void>;

  abstract fetchAll(
    endpointType: string | null,
    sortBy: string | null,
    sortOrder: SortOrder | null,
    page: number | null,
    limit: number | null,
    allPages: boolean | null,
    created_date: EpochTimeStamp | null,
    updated_date: EpochTimeStamp | null,
    deleted_date: EpochTimeStamp | null,
    parentId: string | null,
    search_param: string | null,
  ): Promise<T[]>;

  abstract fetchMore(endpointType: string): Promise<T[]>;

  abstract fetchById(id: string): Promise<T>;

  abstract update(id: string, item: T): Promise<T>;
}
