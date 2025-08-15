import { openDatabase, ResultSet, enablePromise } from 'react-native-sqlite-storage';

const DB_NAME = "grm-db.db";
const DB_VERSION = 1; //
let dbInstance = null;

enablePromise(true);

async function getDBConnection() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDatabase({ name: DB_NAME, location: 'default' });
  return dbInstance;
}

export async function initDB() {
  const db = await getDBConnection();
  // await db.executeSql(`DROP TABLE issue_statuses`);
  // await db.executeSql(`DROP TABLE meta`);
  // Check if schema version table exists
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    )
  `);

  // Get current DB version
  const [results] = await db.executeSql(`SELECT value FROM meta WHERE key = 'db_version'`);
      
  const currentVersion = results?.rows?.length ? parseInt(results.rows.item(0).value, 10) : 0;

  if (currentVersion === 0) {
    // First run — create tables
    await createTables(db);

    // Save version
    await db.executeSql(`INSERT OR REPLACE INTO meta (key, value) VALUES ('db_version', ?)`, [
      DB_VERSION.toString(),
    ]);
  } else if (currentVersion < DB_VERSION) {
    // Migration path
    await runMigrations(db, currentVersion, DB_VERSION);

    await db.executeSql(`UPDATE meta SET value = ? WHERE key = 'db_version'`, [
      DB_VERSION.toString(),
    ]);
  }

  console.log("Finish migrations");

  return db;
}
  
async function createTables(db) {
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS issue_statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      final_status BOOLEAN,
      initial_status BOOLEAN,
      rejected_status BOOLEAN,
      open_status BOOLEAN,
      updated_at DATETIME NULL,
      sync_at DATETIME NULL,
      deleted_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

//   await db.executeSql(`
//     CREATE TABLE IF NOT EXISTS posts (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       user_id INTEGER,
//       title TEXT,
//       body TEXT,
//       FOREIGN KEY(user_id) REFERENCES users(id)
//     )
//   `);
}

async function runMigrations(db, fromVersion, toVersion) {
  console.log(`Migrating DB from v${fromVersion} to v${toVersion}`);

  // Example migration steps
  if (fromVersion < 2) {
    await db.executeSql(`ALTER TABLE users ADD COLUMN phone TEXT`);
  }

  // Add more migrations here for future versions
}


export type Mapper<T> = {
  toModel: (row: any) => T;
  toRow: (model: T) => any;
};

export class BaseLocalRepository<T> {
  constructor(
    private tableName: string,
    private idColumn: string,
    private updatedAtKey: string,
    private syncAtKey: string,
    private mapper: Mapper<T>
  ) { }
  
  async hardDelete(id: string | number): Promise<void> {
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = ?`;
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
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM ${this.tableName}
        WHERE ${this.updatedAtKey} != ${this.syncAtKey}
          OR ${this.syncAtKey} IS NULL
          OR deleted_at IS NOT NULL AND (${this.syncAtKey} IS NULL OR deleted_at != ${this.syncAtKey})
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
    const row = this.mapper.toRow(item);
    const id = row[this.idColumn];
    const updatedAt = row[this.updatedAtKey];

    const sql = `UPDATE ${this.tableName} SET ${this.syncAtKey} = ? WHERE ${this.idColumn} = ?`;

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
    const deletedAt = new Date().toISOString();
    const sql = `
      UPDATE ${this.tableName}
      SET deleted_at = ?, ${this.updatedAtKey} = ?
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
