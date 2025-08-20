interface Base {
  created_date: Date,
  deleted_date?: Date | null,
  id: string,
  name: string,
  sync_date?: Date | null,
  updated_date?: Date | null
}

interface AssignedDepartment extends Base {
    administrative_level: string
}

interface AssignedEscalationDepartment extends Base {
    administrative_level: string
}

interface AssignedAppealDepartment extends Base {
    administrative_level: string
}

export interface IssueCategory extends Base {
    abbreviation: string,
    assigned_department: AssignedDepartment,
    assigned_appeal_department: AssignedEscalationDepartment,
    assigned_escalation_department: AssignedAppealDepartment,
    confidentiality_level: string,
    redirection_protocol: number,
    label: string,
    value: number
}