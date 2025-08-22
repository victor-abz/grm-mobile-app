import { Schema } from "../../repositories/local/BaseLocalRepository";

export const issueStatusTableSchema: Schema = {
  id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
  deleted_at: 'DATETIME NULL',
  final_status: 'BOOLEAN',
  initial_status: 'BOOLEAN',
  name: 'TEXT',
  open_status: 'BOOLEAN',
  rejected_status: 'BOOLEAN',
  sync_at: 'DATETIME NULL',
  updated_at: 'DATETIME NULL'
};