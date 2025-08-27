
export const issueTypeTableSchema = {
  id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  name: 'TEXT',
  created_date: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
  deleted_at: 'DATETIME NULL',
  sync_at: 'DATETIME NULL',
  updated_at: 'DATETIME NULL'
};


// const migrationSchema = [
//   `CREATE TABLE issue_type ${formatSchema(issueTypeTableSchema)}`,
//   "ALTER TABLE issue_status ADD COLUMN phone TEXT",  
// ]

// export default migrationSchema
