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

  abstract fromRemoteToLocal(item: any): any;

  abstract fromLocalToRemote(localModel: Model): T;

  // @ts-ignore
  @writer
  async hardDelete(item: Model): Promise<void> {
    const dbInstance = syncServiceInstance.database;
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
    const dbInstance = syncServiceInstance.database;
    return this.fromLocalToRemote(await dbInstance.get(this.tableName).find(id));
  }

  // @ts-ignore
  @writer
  async softDelete(item: Model): Promise<void> {
    const dbInstance = syncServiceInstance.database;
    await dbInstance.write(async () => {
      const dbItem = await dbInstance.get(this.tableName).find(item.id);
      await dbItem.markAsDeleted();
    });
  }

  // @ts-ignore
  
  async upsert(newEntry: unknown): Promise<void> {
    const dbInstance = syncServiceInstance.database

    await dbInstance.write(async () => {
      let dbItem: Model;
      try {
        dbItem = await dbInstance.get(this.tableName).find(String(newEntry.id));
        await dbItem.update((_item) => {
          Object.keys(_item._raw).forEach((key) => {
            console.log(_item);
            console.log(newEntry);

            if (key !== 'id' && key !== '_changed' && key !== '_status') {
              _item[key] = newEntry[key];
            }
          });
        });
        console.log('Item successfully updated');
        console.log('Succesfully Updated Watermelon DB');
      } catch (error) {
        // If not found, create new
        console.warn(error);
        console.log('Could not update locally, attempting to create locally...');
        try {
          await dbInstance.get(this.tableName).create((updatableItem) => {

            Object.keys(newEntry).forEach((key) => {
              if (key !== 'id') {
                updatableItem[key] = newEntry[key];
              } else if (newEntry.id) {
                updatableItem._raw.id = String(newEntry.id);
              }
            });
          });
        } catch (e) {
          console.log('Could not create locally. Reason:', e);
          return;
        }
        console.log('Item successfully created');
        console.log('Succesfully Updated Watermelon DB');
      }
    });
  }
}
