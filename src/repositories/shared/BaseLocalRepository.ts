import { Model, Q } from '@nozbe/watermelondb';
import { reader, writer } from '@nozbe/watermelondb/decorators';
import { SortOrder } from '@nozbe/watermelondb/QueryDescription';
import { syncServiceInstance } from '../../services/shared/SyncService';

export type Mapper<T> = {
  toModel: (row: any) => T;
  toRow: (model: T) => any;
};

type QueryClause = Q.Where | Q.SortBy | Q.Take;

export abstract class BaseLocalRepository<T> {
  constructor(public tableName: string) {}

  abstract fromLocalToRemote(localModel: Model): T;

  // @ts-ignore
  @writer
  async hardDelete(item: Model): Promise<void> {
    const dbInstance = syncServiceInstance.database
    await dbInstance.write(async () => {
      const dbItem = await dbInstance.get(this.tableName).find(item.id);
      await dbItem.destroyPermanently();
    });
  }

  // @ts-ignore
    async getAll(
    sortBy: string | null,
    sortOrder: SortOrder | null,
    limit: number | null,
    lastPulledAt: string | null
  ): Promise<T[]> {
    if (!sortBy) {
      sortBy = 'created_date';
    }
    if (!sortOrder) {
      sortOrder = Q.desc;
    }
    if (!limit) {
      limit = 100;
    }

    let queryClauses: QueryClause[] = [Q.sortBy(sortBy, sortOrder), Q.take(limit)];
    if (lastPulledAt) {
      queryClauses.push(Q.where('created_date', Q.gte(lastPulledAt)));
    }
    console.log("DATABASE", syncServiceInstance.database);

    const dbInstance = syncServiceInstance.database
    const results: Model[] = await dbInstance.get(this.tableName).query(...queryClauses);
    return results.map((result) => this.fromLocalToRemote(result));
  }

  // @ts-ignore
  @reader
  async findOne(id: string): Promise<T> {
    const dbInstance = syncServiceInstance.database
    return this.fromLocalToRemote(await dbInstance.get(this.tableName).find(id));
  }

  // @ts-ignore
  @writer
  async softDelete(item: Model): Promise<void> {
    const dbInstance = syncServiceInstance.database
    await dbInstance.write(async () => {
      const dbItem = await dbInstance.get(this.tableName).find(item.id);
      await dbItem.markAsDeleted();
    });
  }

  // @ts-ignore
  
  async upsert(item: Model): Promise<void> {
    const dbInstance = syncServiceInstance.database

    await dbInstance.write(async () => {
      const dbItem = await dbInstance.get(this.tableName).find(item.id);
      console.log("OLD INSTANCE:", dbItem);
      console.log("NEW INSTANCE", item);
      
      await dbItem.update(() => {
        Object.assign(dbItem, item);
      });
    });
  }
}
