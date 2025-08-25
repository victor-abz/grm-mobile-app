import IssueCategoryRemoteRepository from "../../repositories/remote/IssueCategoryRemoteRepository";
import { BaseService } from "../shared/BaseService";
import { IssueCategoryLocalRepository } from "../../repositories/local/issueCategory/IssueCategoryLocalRepository";
import { IssueCategory } from "../../models/IssueCategory";

const localRepository = new IssueCategoryLocalRepository();
const remoteRepository = new IssueCategoryRemoteRepository();

export const issueCategoryService = new BaseService<IssueCategory>(
    localRepository,
    remoteRepository
);

async function syncIssueCategoryList () {
    try {
        const response = await issueCategoryService.sync()   
        return response;
    } catch (error) {
        console.error("Error syncing issue category:", error);
    }
}

export async function fetchIssueCategoriesList(): Promise<IssueCategory[] | null> {
    try {
        //try sync with remote
        await syncIssueCategoryList()
        //proceed getting data from the local source origin
        const response = await issueCategoryService.getAll();
        return response
    } catch(error) {
          console.error("Error syncing issue category:", error);    
    } 
}

export const issueCategorySyncable = {
    sync: () => issueCategoryService.sync(),
    createTable: () => issueCategoryService.createTable()
};
