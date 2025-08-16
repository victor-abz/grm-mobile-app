import { openDatabase, ResultSet } from 'react-native-sqlite-storage';

const db = openDatabase({ name: 'grm-db.db' });

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
    private mapper: Mapper<T>
  ) {}

  async hardDelete(id: string | number): Promise<void> {
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = ?`;
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
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
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
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
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM ${this.tableName}
        WHERE ${this.updatedDateKey} != ${this.syncDateKey}
          OR ${this.syncDateKey} IS NULL
          OR deleted_at IS NOT NULL AND (${this.syncDateKey} IS NULL OR deleted_at != ${this.syncDateKey})
      `;

      db.transaction(tx => {
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
        console.log(item)
    const row = this.mapper.toRow(item);
    console.log(row)
    const id = row[this.idColumn];
    const updatedAt = row[this.updatedDateKey];
    alert(updatedAt)
    const sql = `UPDATE ${this.tableName} SET ${this.syncDateKey} = ? WHERE ${this.idColumn} = ?`;

    return new Promise((resolve, reject) => {
      db.transaction(tx => {
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
    const deletedAt = new Date().toISOString();
    const sql = `
      UPDATE ${this.tableName}
      SET deleted_at = ?, ${this.updatedDateKey} = ?
      WHERE ${this.idColumn} = ?
    `;
  

    return new Promise((resolve, reject) => {
      db.transaction(tx => {
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
    console.log(item)
    const row = this.mapper.toRow(item);
    console.log(row)
    const keys = Object.keys(row);
    const values = keys.map(k => row[k]);
    const placeholders = keys.map(() => '?').join(',');

    const sql = `REPLACE INTO ${this.tableName} (${keys.join(',')}) VALUES (${placeholders})`;

    return new Promise((resolve, reject) => {
      db.transaction(tx => {
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
}
