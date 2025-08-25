export const issueStatusTableSchema = {
  id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  created_date: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
  deleted_date: 'DATETIME NULL',
  final_status: 'BOOLEAN',
  initial_status: 'BOOLEAN',
  name: 'TEXT',
  open_status: 'BOOLEAN',
  rejected_status: 'BOOLEAN',
  sync_date: 'DATETIME NULL',
  updated_date: 'DATETIME NULL'
};