import { SortOrder } from '@nozbe/watermelondb/QueryDescription';

export abstract class BaseRemoteRepository<T> {
  abstract create(item: T): Promise<T>;

  abstract delete(id: string): Promise<void>;

  abstract fetchAll(
    sortBy: string | null,
    sortOrder: SortOrder | null,
    limit: number | null,
    createdAt: string | null,
    updatedAt: string | null,
    deletedAt: string | null,
    parentId: string | null,
  ): Promise<T[]>;

  abstract fetchById(id: string): Promise<T>;

  abstract update(id: string, item: T): Promise<T>;
}
