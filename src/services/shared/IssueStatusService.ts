import { BaseLocalRepository } from "../../repositories/local/BaseLocalRepository";
import { mapper } from "../../repositories/local/IssueStatus/mapper";
import IssueStatusRemoteRepository from "../../repositories/remote/IssueStatusRemoteRepository";
import { BaseService } from "./BaseService";
import { issue_status } from "../../migrations/v1/issue_status";
import { IssueStatus } from "../../models/issue_status";

const localRepository = new BaseLocalRepository<IssueStatus>(
  'issue_statuses',
  'id',
  "updated_at",
  "sync_at",
  mapper,
  issue_status
)
const remoteRepository = new IssueStatusRemoteRepository();

const issueStatusService = new BaseService<IssueStatus>(
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

export async function fetchIssueStatusList(): Promise<IssueStatus[] | null> {
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

export const issueStatusSyncable =     {
        sync: () => issueStatusService.sync(),
        createTable: () => issueStatusService.createTable()
    };
