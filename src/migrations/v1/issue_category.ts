// Create Table - issue categories

export const issueCategoryTableSchema = {
  id: "INTEGER PRIMARY KEY AUTOINCREMENT",
  name: "TEXT",
  abbreviation: "TEXT",
  assigned_department: "TEXT",
  assigned_appeal_department: "TEXT",
  assigned_escalation_department: "TEXT",
  confidentiality_level: "TEXT",
  redirection_protocol: "INTEGER",
  label: "TEXT",
  value: "INTEGER",
  created_date: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  deleted_at: "DATETIME NULL",
  sync_at: "DATETIME NULL",
  updated_at: "DATETIME NULL",
}
