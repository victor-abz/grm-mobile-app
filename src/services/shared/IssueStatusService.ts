import { BaseLocalRepository } from "../../repositories/local/BaseLocalRepository";
import { mapper } from "../../repositories/local/IssueStatus/mapper";
import IssueStatusRemoteRepository, { IssueStatusModel } from "../../repositories/remote/IssueStatusRemoteRepository";
import { BaseService } from "./BaseService";

const localRepository = new BaseLocalRepository<IssueStatusModel>('issue_statuses', 'id', "updated_at", "sync_at", mapper)
const remoteRepository = new IssueStatusRemoteRepository();

const issueStatusService = new BaseService<IssueStatusModel>(
    localRepository,
    remoteRepository
);

async function syncIssueStatusList () {
    try {
        const response = await issueStatusService.sync()   
        return response;
    } catch (error) {
        console.error("Error syncing issue statuses:", error);
    }
}

export async function fetchIssueStatusList(): Promise<IssueStatusModel[] | null> {
    try {
        //try sync with remote
        await syncIssueStatusList()
        //proceed getting data from the local source origin
        const response = await issueStatusService.getAll();
        return response
    } catch(error) {
          console.error("Error syncing issue statuses:", error);    
    } 
}

export const issueStatusSyncables = [
    { sync: () => issueStatusService.sync()}
];
