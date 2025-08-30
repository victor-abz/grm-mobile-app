import { BaseService } from '../shared/BaseService';
import { Issue } from '../../models/Issue';
import { IssueRemoteRepository } from '../../repositories/remote/issues/IssueRemoteRepository';
import { IssueLocalRepository } from "../../repositories/local/issues/IssueLocalRepository";

const localRepository = new IssueLocalRepository();
const remoteRepository = new IssueRemoteRepository();

const issueService = new BaseService<Issue>(
    localRepository,
    remoteRepository
);

async function syncIssueList () {
    try {
        const response = await issueService.sync()   
        return response;
    } catch (error) {
        console.error("Error syncing issues:", error);
    }
}

export async function fetchIssueList(): Promise<Issue[] | null> {
    try {
        //try sync with remote
        await syncIssueList()
        //proceed getting data from the local source origin
      return await issueService.getAll();
    } catch(error) {
          console.error("Error syncing issues:", error);
    } 
}

export const issueSyncable =     {
        sync: () => issueService.sync(),
        createTable: () => issueService.createTable()
    };
