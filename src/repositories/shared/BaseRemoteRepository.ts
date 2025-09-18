import { SortOrder } from '@nozbe/watermelondb/QueryDescription';

export abstract class BaseRemoteRepository<T> {
  
  abstract create(item: T): Promise<T>;

  abstract delete(id: string): Promise<void>;

  abstract fetchAll(
    endpointType: string | null,
    sortBy: string | null,
    sortOrder: SortOrder | null,
    limit: number | null,
    created_date: string | null,
    update_date: string | null,
    deleted_date: string | null
  ): Promise<T[]>;

  abstract fetchById(id: string): Promise<T>;

  abstract update(id: string, item: T): Promise<T>;
}
