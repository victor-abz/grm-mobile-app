import IssueStatusRemoteRepository from "../../repositories/remote/IssueStatusRemoteRepository";
import { BaseService } from "./BaseService";
import type { IssueStatus } from "../../models/IssueStatus";
import { IssueStatusLocalRepository } from "../../repositories/local/IssueStatus/IssueStatusLocalRepository";


const localRepository = new IssueStatusLocalRepository();
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

export const issueStatusSyncable = {
        sync: () => issueStatusService.sync(),
        createTable: () => issueStatusService.createTable()
    };
