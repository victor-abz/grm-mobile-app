
export const issueTypeTableSchema = {
  id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  name: 'TEXT',
  created_date: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
  deleted_date: 'DATETIME NULL',
  sync_date: 'DATETIME NULL',
  updated_date: 'DATETIME NULL'
};


// const migrationSchema = [
//   `CREATE TABLE issue_type ${formatSchema(issueTypeTableSchema)}`,
//   "ALTER TABLE issue_status ADD COLUMN phone TEXT",
// ]

// export default migrationSchema
