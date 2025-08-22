import { Base } from "./Base"


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
    assigned_appeal_department: AssignedAppealDepartment,
    assigned_escalation_department: AssignedEscalationDepartment,
    confidentiality_level: string,
    redirection_protocol: number,
    label: string,
    value: number
}