import { Model, Q } from '@nozbe/watermelondb';
import { writer } from '@nozbe/watermelondb/decorators';
import { SyncStatus } from '@nozbe/watermelondb/Model';
import { SortOrder } from '@nozbe/watermelondb/QueryDescription';
import { databaseServiceInstance } from '../../utils/storageManager';

export type Mapper<T> = {
  toModel: (row: any) => T;
  toRow: (model: T) => any;
};

export type LatestValueAtCurrentPage = {
  fieldName: string;
  latestValue: any;
};

type QueryClause = Q.Where | Q.SortBy | Q.Take;

export abstract class BaseLocalRepository<T> {
  constructor(public tableName: string) {}

  abstract fromRemoteToLocal(item: any, parentId?: string | number): any;

  abstract fromLocalToRemote(localModel: Model): T;

  // @ts-ignore
  @writer
  async hardDelete(item: Model): Promise<void> {
    const dbInstance = databaseServiceInstance.database;
    await dbInstance.write(async () => {
      const dbItem = await dbInstance.get(this.tableName).find(item.id);
      await dbItem.destroyPermanently();
    });
  }

  // @ts-ignore
  async update(dbItem: Model, values: Record<string, any>, status?: SyncStatus) {
    const dbInstance = databaseServiceInstance.database;

    return await dbInstance.write(async () => {
      try {
        const updatedRecord = await dbItem.update((record) => {
          if (status) record._raw._status = status;

          Object.entries(values).forEach(([key, value]) => {
            // (record)[key] = value;
            (record._raw as any)[key] = value;
          });

          record._notifyChanged();
        });
        return updatedRecord;
      } catch (e) {
        console.error('Error at update method: ', e);
      }
    });
  }

  // @ts-ignore
  async getAll(
    sortBy: string | null,
    sortOrder: SortOrder | null,
    limit: number | null,
    lastPulledAt: string | null,
    parentId: string | null,
    page: number = 0, // zero-based page index
    extra: number = 0, // bring N more items (e.g. 100)
    latestValueAtCurrentPage?: LatestValueAtCurrentPage
  ): Promise<T[]> {
    if (!sortBy) sortBy = 'created_date';
    if (!sortOrder) sortOrder = Q.desc;

    // TODO: Keep using 100 limit
    // if (!limit) limit = 100;
    if (!limit) limit = 5;

    const pageSize = limit + (extra || 0);
    let queryClauses: QueryClause[] = [Q.sortBy(sortBy, sortOrder)];

    if (lastPulledAt) {
      queryClauses.push(Q.where('created_date', Q.gte(lastPulledAt)));
    }

    if (parentId) {
      queryClauses.push(Q.where('parent_id', Q.eq(String(parentId))));
    }

    console.log("LATEST_VALUE", latestValueAtCurrentPage);
    
    // Useful for pagination. If available, bring values below and equal the provided value.
    if (latestValueAtCurrentPage) {
      queryClauses.push(
        Q.where(
          latestValueAtCurrentPage.fieldName,
          Q.lte(latestValueAtCurrentPage.latestValue[latestValueAtCurrentPage.fieldName])
        )
      );
    }

    const dbInstance = databaseServiceInstance.database;
    // Note: WatermelonDB doesn't reliably support skip/offset in all versions;
    // so query the filtered/sorted set and slice for pagination.

    let results: Model[] = await dbInstance.get(this.tableName).query(...queryClauses);

    // If duplicated step: move it before everything, take the value, delete the duplicates and query Q.lte
    // If not duplicated: Careful with the latest value when no internet do something at the switch. [1,2]..load more(Q.lte)..[1,2,3]
    // Delete the latestValue when no internet the first time
    // let duplicatedRange = latestValue.value === results[1][latestValue.fieldName];
    //

    // Remove
    // const opposite = 1
    // Remove
    // if (duplicatedRange) {
    //   //add them duplicated all, delete the rendered old ones
    //   queryClauses.push(
    //     Q.and(
    //       Q.where(latestValue.fieldName, Q.gt(opposite)),
    //       Q.where('id', Q.lt(latestValue.id))
    //     )
    //   );
    //   results = await dbInstance.get(this.tableName).query(...queryClauses);
    // }

    console.log('====================');
    console.log('====================');
    console.log('====================');
    console.log('====================');
    console.log(results);

    let start = 5 * pageSize;

    const paged = results.slice(start, start + pageSize);

    return paged.map((result) => this.fromLocalToRemote(result));
  }

  // @ts-ignore
  async getAllRaw(
    sortBy: string | null,
    sortOrder: SortOrder | null,
    limit: number | null,
    lastPulledAt: string | null,
    parentId: string | null
  ): Promise<Model[]> {
    if (!sortBy) sortBy = 'created_date';
    if (!sortOrder) sortOrder = Q.desc;
    if (!limit) limit = 200;
    let queryClauses: QueryClause[] = [];

    if (parentId) {
      queryClauses.push(Q.where('parent_id', Q.eq(String(parentId))));
    }
    const dbInstance = databaseServiceInstance.database;
    const results: Model[] = await dbInstance.get(this.tableName).query(...queryClauses);
    return results;
  }

  // @ts-ignore
  async findOneRaw(id: string | null): Promise<Model> {
    const dbInstance = databaseServiceInstance.database;
    const result: Model = await dbInstance.get(this.tableName).find(id);
    return result;
  }

  // @ts-ignore
  async findOne(id: string): Promise<T> {
    const dbInstance = databaseServiceInstance.database;
    const itemModel = await dbInstance.read(
      async () => await dbInstance.get(this.tableName).find(id)
    );
    return this.fromLocalToRemote(itemModel);
  }

  // @ts-ignore
  @writer
  async softDelete(item: Model): Promise<void> {
    const dbInstance = databaseServiceInstance.database;
    await dbInstance.write(async () => {
      const dbItem = await dbInstance.get(this.tableName).find(item.id);
      await dbItem.markAsDeleted();
    });
  }

  async bulkCreate(entries: any[]): Promise<void> {
    try {
      const dbInstance = databaseServiceInstance.database;
      let operations = [];

      await dbInstance.write(async () => {
        for (let index = 0; index < entries.length; index++) {
          const element = entries[index];
          operations.push(
            dbInstance.get(this.tableName).prepareCreate((tableElementPlaceholder) => {
              Object.keys(tableElementPlaceholder._raw).forEach((key) => {
                if (key == 'id') {
                  tableElementPlaceholder._raw[key] = String(element[key]);
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
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  // @ts-ignore
  async upsert(newEntry: unknown, configurableId?: string | number): Promise<any> {
    const dbInstance = databaseServiceInstance.database;

    return await dbInstance.write(async () => {
      let dbItem: Model;
      try {
        dbItem = await dbInstance.get(this.tableName).find(String(newEntry.id));
        await dbItem.update((_item) => {
          Object.keys(_item._raw).forEach((key) => {
            if (key !== 'id' && key !== '_changed' && key !== '_status' && newEntry[key]) {
              _item[key] = newEntry[key];
            }
          });
        });
        console.log('Item successfully updated');
        console.log('Succesfully Updated Watermelon DB');
        return dbItem;
      } catch (error) {
        // If not found, create new
        console.warn(error);
        console.log('Could not update locally, attempting to create locally...');
        try {
          const createdInstance = await dbInstance
            .get(this.tableName)
            .create((tableElementPlaceholder) => {
              if (configurableId) {
                tableElementPlaceholder._raw.id = String(configurableId);
                tableElementPlaceholder._raw._status = 'synced';
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
          console.log('Item Successfully Created');
          console.log('Succesfully Updated Watermelon DB');
          return createdInstance;
        } catch (e) {
          console.log('Could not create locally. Reason:', e);
          return;
        }
      }
    });
  }
}
