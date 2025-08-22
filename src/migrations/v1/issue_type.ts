export const issueTypeTableSchema = {
  id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  name: 'TEXT',
  created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',  
  deleted_at: 'DATETIME NULL',
  sync_at: 'DATETIME NULL',
  updated_at: 'DATETIME NULL'
};