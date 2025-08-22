import { Base } from "./Base"; 

export interface IssueStatus extends Base {
    final_status: boolean,
    initial_status: boolean,
    rejected_status: boolean,
    open_status: boolean
}