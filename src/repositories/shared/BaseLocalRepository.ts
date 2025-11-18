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
    lastPulledAt: string | null,
    parentId: string | null
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

    if (parentId) {
      queryClauses.push(Q.where('parent_id', Q.eq(parentId)));
    }

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
  
  async bulkCreate(entries: any[]): Promise<void> {
    try {
      const dbInstance = syncServiceInstance.database;
      let operations = []
  
      await dbInstance.write(async () => { 
        for (let index = 0; index < entries.length; index++) {
          const element = entries[index];
          operations.push(
            dbInstance.get(this.tableName).prepareCreate((tableElementPlaceholder) => {
              Object.keys(tableElementPlaceholder._raw).forEach((key) => {
                if (key == 'id') {
                  tableElementPlaceholder._raw[key] = String(element[key])
                }

                if (key !== 'id' && key !== '_changed' && key !== '_status') {
                  tableElementPlaceholder._raw[key] = element[key];
                }
              });
              tableElementPlaceholder = element;
            })
          );
        }
        dbInstance.batch(operations);
      })
      
    } catch (error) {
      throw new Error(error);
    }
  }

  // @ts-ignore
  async upsert(newEntry: unknown, configurableId?: string | number): Promise<any> {
    const dbInstance = syncServiceInstance.database;

    return await dbInstance.write(async () => {
      let dbItem: Model;
      try {
        dbItem = await dbInstance.get(this.tableName).find(String(newEntry.id));
        await dbItem.update((_item) => {
          Object.keys(_item._raw).forEach((key) => {
            if (key !== 'id' && key !== '_changed' && key !== '_status') {
              _item[key] = newEntry[key];
            }
          });
        });
        console.log('Item successfully updated');
        console.log('Succesfully Updated Watermelon DB');
        return newEntry;
      } catch (error) {
        // If not found, create new
        console.warn(error);
        console.log('Could not update locally, attempting to create locally...');
        try {
          await dbInstance.get(this.tableName).create((tableElementPlaceholder) => {
            if (configurableId) {
              tableElementPlaceholder._raw.id = String(configurableId);
            }
            Object.keys(newEntry).forEach((key) => {
              // Check if the value is an object (and not null or an array)
              if (
                newEntry[key] &&
                typeof newEntry[key] === 'object'
                // && !Array.isArray(newEntry[key])
              ) {
                // Handle nested object keys if needed
                // Object.keys(newEntry[key]).forEach((nestedKey) => {
                tableElementPlaceholder._raw[key] = JSON.stringify(newEntry[key]);
           
                // });
              } else {
                if (key !== 'id') {
                  tableElementPlaceholder._raw[key] = newEntry[key];
                } else if (newEntry.id) {
                  tableElementPlaceholder._raw.id = String(newEntry.id);
                }
              }
            });
          });
          console.log('Item successfully created');
          console.log('Succesfully Updated Watermelon DB');
          return newEntry;
        } catch (e) {
          console.log('Could not create locally. Reason:', e);
          return;
        }
      }
    });
  }
}
