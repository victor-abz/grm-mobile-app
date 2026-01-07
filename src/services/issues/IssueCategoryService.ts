import { BaseService } from '../shared/BaseService';
import { TABLE_NAMES } from "../../migrations/tableName";
import { IssueCategoryLocalRepository } from "../../repositories/local/issues/IssueCategoryLocalRepository";
import IssueCategoryRemoteRepository from "../../repositories/remote/issues/IssueCategoryRemoteRepository";
import { IssueCategory } from "../../models/issues/IssueCategory";
import { Syncable } from '../shared/types';

const localRepository = new IssueCategoryLocalRepository();
const remoteRepository = new IssueCategoryRemoteRepository();

const issueCategoryService = new BaseService<IssueCategory>(localRepository, remoteRepository);

export async function fetchIssueCategoriesList(): Promise<IssueCategory[] | null> {
    try {
        return await issueCategoryService.getAll();
    } catch (error) {
        console.error('Error syncing issues categories:', error);
    }
}

export const issueCategorySyncable: Syncable = {
    pushChanges: ({ changes, lastPulledAt }) =>
      issueCategoryService.pushChanges({ changes, lastPulledAt }),
    pullChanges: ({ tableName, lastPulledAt }) => issueCategoryService.pullChanges({ tableName, lastPulledAt }),
    tableName:  TABLE_NAMES.issueCategory,
};
