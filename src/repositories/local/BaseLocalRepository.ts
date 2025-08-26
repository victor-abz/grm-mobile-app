import { ResultSet } from 'react-native-sqlite-storage';
import { getDBConnection } from "../../services/shared/SyncService";

export type Schema = {
  [key: string]: string;
};

export type Mapper<T> = {
  toModel: (row: any) => T;
  toRow: (model: T) => any;
};

export class BaseLocalRepository<T> {
  constructor(
    private tableName: string,
    private idColumn: string,
    private updatedDateKey: string,
    private syncDateKey: string,
    private mapper: Mapper<T>,
    private schema: Schema,
  ) {}
  
  private formatSchema<T>(schema: Schema): string {
      return Object.entries(schema)
        .map(([key, value]) => `${key} ${value}`)
        .join(", ");
  };

  async createTable(): Promise<void> {
    const sql = `CREATE TABLE IF NOT EXISTS ${this.tableName} (${this.formatSchema(this.schema)})`;
    const dbInstance = await getDBConnection();

    return new Promise((resolve, reject) => {
      dbInstance.transaction(tx => {
        tx.executeSql(
          sql,
          () => resolve(),
          (_, err) => {
            reject(err);
            return false;
          }
        );
      });
    });
  }

  async hardDelete(id: string | number): Promise<void> {
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = ?`;
    const dbInstance = await getDBConnection();

    return new Promise((resolve, reject) => {
      dbInstance.transaction(tx => {
        tx.executeSql(
          sql,
          [id],
          () => resolve(),
          (_, err) => {
            reject(err);
            return false;
          }
        );
      });
    });
  }

  async getAll(): Promise<T[]> {
    const dbInstance = await getDBConnection();

    return new Promise((resolve, reject) => {
      dbInstance.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM ${this.tableName}`,
          [],
          (_, results: ResultSet) => {
            const rows = [];
            for (let i = 0; i < results.rows.length; i++) {
              rows.push(this.mapper.toModel(results.rows.item(i)));
            }
            resolve(rows);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getUnsynced(): Promise<T[]> {
    const dbInstance = await getDBConnection();

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM ${this.tableName}
        WHERE ${this.updatedDateKey} != ${this.syncDateKey}
          OR ${this.syncDateKey} IS NULL
          OR deleted_at IS NOT NULL AND (${this.syncDateKey} IS NULL OR deleted_at != ${this.syncDateKey})
      `;

      dbInstance.transaction(tx => {
        tx.executeSql(
          sql,
          [],
          (_, results: ResultSet) => {
            const rows = [];
            for (let i = 0; i < results.rows.length; i++) {
              rows.push(this.mapper.toModel(results.rows.item(i)));
            }
            resolve(rows);
          },
          (_, err) => {
            reject(err);
            return false;
          }
        );
      });
    });
  }

  async markSynced(item: T): Promise<void> {
    const dbInstance = await getDBConnection();
    const row = this.mapper.toRow(item);

    const id = row[this.idColumn];
    const updatedAt = row[this.updatedDateKey];

    const sql = `UPDATE ${this.tableName} SET ${this.syncDateKey} = ? WHERE ${this.idColumn} = ?`;

    return new Promise((resolve, reject) => {
      dbInstance.transaction(tx => {
        tx.executeSql(
          sql,
          [updatedAt, id],
          () => resolve(),
          (_, err) => {
            reject(err);
            return false;
          }
        );
      });
    });
  }

  async softDelete(id: string | number): Promise<void> {
    const dbInstance = await getDBConnection();
    const deletedAt = new Date().toISOString();
    const sql = `
      UPDATE ${this.tableName}
      SET deleted_at = ?, ${this.updatedDateKey} = ?
      WHERE ${this.idColumn} = ?
    `;


    return new Promise((resolve, reject) => {
      dbInstance.transaction(tx => {
        tx.executeSql(
          sql,
          [deletedAt, deletedAt, id],
          () => resolve(),
          (_, err) => {
            reject(err);
            return false;
          }
        );
      });
    });
  }

  async upsert(item: T): Promise<void> {
    try {
      const dbInstance = await getDBConnection();
      const row = this.mapper.toRow(item);

      const keys = Object.keys(row);
      const values = keys.map(k => row[k]);
      const placeholders = keys.map(() => '?').join(',');

      const sql = `REPLACE INTO ${this.tableName} (${keys.join(',')}) VALUES (${placeholders})`;

      return new Promise((resolve, reject) => {
        dbInstance.transaction(tx => {
          tx.executeSql(
            sql,
            values,
            () => resolve(),
            (_, err) => {
              reject(err);
              return false;
            }
          );

        });
      });
    }
    catch (error) {
      console.log("error:", error);
    }
  }
}
