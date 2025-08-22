export interface IssueStatus {
    id: number,
    name: string,
    final_status: boolean,
    initial_status: boolean,
    rejected_status: boolean,
    open_status: boolean
}