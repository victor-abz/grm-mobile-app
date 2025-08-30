import IssueTypeRemoteRepository from "../../repositories/remote/IssueTypeRemoteRepository";
import { BaseService } from "../shared/BaseService";
import { IssueTypeLocalRepository } from "../../repositories/local/issues/IssueTypeLocalRepository";
import type { IssueType } from "../../models/IssueType";

const localRepository = new IssueTypeLocalRepository();
const remoteRepository = new IssueTypeRemoteRepository();

export const issueTypeService = new BaseService<IssueType>(
  localRepository,
  remoteRepository
);

async function syncIssueTypesList() {
  try {
    const response = await issueTypeService.sync()
    return response;
  } catch (error) {
    console.error("Error syncing Issue Type:", error);
  }
}

export async function fetchIssueTypesList(): Promise<IssueType[] | null> {
  try {
    //try sync with remote
    await syncIssueTypesList()
    //proceed getting data from the local source origin
    const response = await issueTypeService.getAll();

    return response
  } catch (error) {
    console.error("Error syncing Issue Type:", error);
  }
}

export const issueTypeSyncable = {
  sync: () => issueTypeService.sync(),
  createTable: () => issueTypeService.createTable()
};
