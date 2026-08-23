import { Model, Q } from '@nozbe/watermelondb';
import { writer } from '@nozbe/watermelondb/decorators';
import { SyncStatus } from '@nozbe/watermelondb/Model';
import { SortOrder } from '@nozbe/watermelondb/QueryDescription';
import { databaseServiceInstance } from '../../utils/storageManager';
import { parseJson } from '../../utils/utils';

export type LocalGetAllEventInfo = { firstPageRetrievalMade: boolean }

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
    latestValueAtCurrentPage?: LatestValueAtCurrentPage,
    allPages = false,
    extraQueries: QueryClause[] | null = null
  ): Promise<{ event: LocalGetAllEventInfo; results: T[] }> {
    if (!sortBy) sortBy = 'created_date';
    if (!sortOrder) sortOrder = Q.desc;

    if (!limit) limit = 20;

    const pageSize = limit;

    let queryClauses: QueryClause[] = [Q.sortBy(sortBy, sortOrder)];
    if (extraQueries && extraQueries.length > 0) {
      queryClauses = [...queryClauses, ...extraQueries];
    }

    if (lastPulledAt) {
      queryClauses.push(Q.where('created_date', Q.gte(lastPulledAt)));
    }

    if (parentId) {
      parentId = String(parentId).replace(/\\"/g, '').replace(/"/g, '');
      queryClauses.push(Q.where('parent_id', Q.eq(parentId)));
    }

    // Useful for pagination. If available, bring values below and equal the provided value.
    if (latestValueAtCurrentPage) {
      queryClauses.push(
        Q.where(
          latestValueAtCurrentPage.fieldName,
          Q.lte(latestValueAtCurrentPage.latestValue[latestValueAtCurrentPage.fieldName])
        )
      );
      queryClauses.push(Q.sortBy('intake_date', 'desc'));
      const dbInstance = databaseServiceInstance.database;
      // Note: WatermelonDB doesn't reliably support skip/offset in all versions;
      // so query the filtered/sorted set and slice for pagination.
      console.log("OFFLINE SWITCH FIRST AND LAST FULL RETRIEVAL");
      let results: Model[] = await dbInstance.get(this.tableName).query(...queryClauses);
      
      //add the missing here to fill the page at the bottom
      if (results.length % pageSize != 0) {
        queryClauses.pop()
        const getAllResults = await dbInstance.get(this.tableName).query(...queryClauses);
        const coefficient = getAllResults.length / pageSize - Math.floor(getAllResults.length / pageSize); 
        const numberOfItemsToAdd = pageSize - (coefficient) * pageSize
        
        const extraResults = getAllResults.slice(
          getAllResults.length,
          getAllResults.length
        );
   
        return {
          event: { firstPageRetrievalMade: true },
          results: [...results, ...extraResults].map((result) => this.fromLocalToRemote(result)),
        };
      } else {
        return {
          event: { firstPageRetrievalMade: true },
          results: results.map((result) => this.fromLocalToRemote(result)),
        };

      }
    }

    const dbInstance = databaseServiceInstance.database;
    // Note: WatermelonDB doesn't reliably support skip/offset in all versions;
    // so query the filtered/sorted set and slice for pagination.
    let results: Model[] = await dbInstance.get(this.tableName).query(...queryClauses);
    // Delete the latestValue when no internet the first time
    let start = page * pageSize;
    const paged = allPages ? results : results.slice(start, start + pageSize);
    return {
      event: { firstPageRetrievalMade: false },
      results: paged.map((result) => this.fromLocalToRemote(result)),
    };
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
      parentId = String(parentId).replace(/\\"/g, '').replace(/"/g, '');
      queryClauses.push(Q.where('parent_id', Q.eq(parentId)));
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

  isKeyIdentifiable(key: string) {
    switch (key) {
      case 'id': 
        return true
      case 'administrative_level': 
        return true
      default: 
        return false
    }
  }

  async bulkCreate(formattedEntries: any[]): Promise<void> {
    try {
      const dbInstance = databaseServiceInstance.database;
      let operations = [];

      await dbInstance.write(async () => {
        for (let index = 0; index < formattedEntries.length; index++) {
          const element = formattedEntries[index];
          operations.push(
            dbInstance.get(this.tableName).prepareCreate((tableElementPlaceholder) => {
              Object.keys(tableElementPlaceholder._raw).forEach((key) => {
                if (this.isKeyIdentifiable(key)) {
                  
                  tableElementPlaceholder._raw[key] = String(element[key])
                    .replace(/\\"/g, '')
                    .replace(/"/g, '');
                }

                if (key !== 'id' && key !== '_changed' && key !== '_status') {
                  tableElementPlaceholder._raw[key] = element[key];
                }
              });
              // tableElementPlaceholder = element;
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
    
    if (newEntry.id) {  
      newEntry['id'] = String(newEntry.id).replace(/\\"/g, '').replace(/"/g, '');
    }
    
    if (configurableId) {  
      configurableId = String(configurableId).replace(/\\"/g, '').replace(/"/g, '');
    }

    if (newEntry._raw && newEntry._raw.id) {  
      newEntry['_raw']['id'] = String(newEntry._raw.id).replace(/\\"/g, '').replace(/"/g, '');
    }

    const dbInstance = databaseServiceInstance.database;

    return await dbInstance.write(async () => {
      let dbItem: Model;
      try {
        // UPDATE INTENT
        dbItem = await dbInstance.get(this.tableName).find(newEntry.id);
        await dbItem.update((_item) => {
          Object.keys(_item._raw).forEach((key) => {
            if (
              key !== 'id' &&
              key !== '_changed' &&
              key !== '_status' &&
              typeof newEntry == 'object' &&
              Object.hasOwn(newEntry, key)
            ) {
              _item[key] = newEntry[key];
            }
          });
        });
        console.log('Item successfully updated');
        console.log('✅ Succesfully Updated Watermelon DB');
        return dbItem;
      } catch (error) {
        // If not found, create new
        console.warn(`Could not update locally; creating a fresh copy instead. ${error}`);
        try {
          const createdInstance = await dbInstance
            .get(this.tableName)
            .create((tableElementPlaceholder) => {
              
              if (configurableId) {
                tableElementPlaceholder._raw.id = configurableId;
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
                    tableElementPlaceholder._raw.id = newEntry.id;
                  }
                }
              });

            });
          console.log('Item Successfully Created');
          console.log('✅ Succesfully Updated Watermelon DB');
          return createdInstance;
        } catch (e) {
          console.error('Could not create locally. Reason:', e);
          return;
        }
      }
    });
  }
}
