import IssueTypeRemoteRepository from "../../repositories/remote/IssueTypeRemoteRepository";
import { BaseService } from "./BaseService";
import { IssueTypeLocalRepository } from "../../repositories/local/issueType/IssueTypeLocalRepository";
import { IssueType } from "../../models/IssueType";

const localRepository = new IssueTypeLocalRepository();
const remoteRepository = new IssueTypeRemoteRepository();

export const issueTypeService = new BaseService<IssueType>(
    localRepository,
    remoteRepository
);

async function syncIssueTypeList () {
    try {
        const response = await issueTypeService.sync()   
        return response;
    } catch (error) {
        console.error("Error syncing Issue Type:", error);
    }
}

export async function fetchIssueTypeList(): Promise<IssueType[] | null> {
    try {
        //try sync with remote
        await syncIssueTypeList()
        //proceed getting data from the local source origin
        const response = await issueTypeService.getAll();
        return response
    } catch(error) {
          console.error("Error syncing Issue Type:", error);    
    } 
}

export const issueTypeSyncable = {
    sync: () => issueTypeService.sync(),
    createTable: () => issueTypeService.createTable()
};
