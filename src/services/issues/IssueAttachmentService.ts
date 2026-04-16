import { BaseService, CreatedResponseWithBackendId, WatermelonId } from '../shared/BaseService';
import { TABLE_NAMES } from "../../migrations/tableName";
import { IssueAttachment, IssueAttachmentLocalModel } from "../../models/issues/IssueAttachment";
import { IssueAttachmentLocalRepository } from "../../repositories/local/issues/IssueAttachmentLocalRepository";
import IssueAttachmentRemoteRepository from "../../repositories/remote/issues/IssueAttachmentRemoteRepository";
import { Syncable } from '../shared/types';

import {
  downloadAsync,
  getInfoAsync,
  copyAsync,
  makeDirectoryAsync,
  documentDirectory,
} from 'expo-file-system';
import { SyncStatus } from '@nozbe/watermelondb/Model';

const localRepository = new IssueAttachmentLocalRepository();
const remoteRepository = new IssueAttachmentRemoteRepository();

const issueAttachmentService = new BaseService<IssueAttachment>(localRepository, remoteRepository);

// Ensure local copy exists; if not and online, download using backend-supplied signed URL getter
async function ensureLocalFile(record: IssueAttachmentLocalModel) {
  if (record.local_url) {
    const filename = record.local_url.split('/').reverse()[0];
    const { exists } = await getInfoAsync(record.local_url);
    if (exists) return {savedFile: record.local_url, filename};
  }

  if (!record.url) throw new Error('No backend url to fetch remote file.');
  const filename = record.url.split('/').reverse()[0];
  const savedFile = await saveToPersistentStorage(record.url, filename, String(record.parent_id));

  console.log("Successufully downloaded attachment files to issue directory");
  
  // caller should update DB: local_path = saved, signed_url_expires_at = expiresAt
  return { savedFile, filename };

}

// Save a temp/remote file into a persistent app folder and return saved path
export async function saveToPersistentStorage(srcUri: string, destFilename: string, parentId: string) {
  const dir = `${documentDirectory}issues/${parentId}/attachments`;
  await makeDirectoryAsync(dir, { intermediates: true }); 
  
  const dest = `${dir}/${destFilename}`;
  
  // copy local file or download remote URL to dest
  if (srcUri.startsWith('http')) {
    // const res = await downloadAsync({ fromUrl: srcUri, toFile: dest }).promise;
    const res = await downloadAsync(srcUri, dest);

    if (res.status && res.status >= 400) throw new Error(`Download failed: ${res.status}`);
  } else {
    await copyAsync({from: srcUri, to: dest});
  }
  return dest;
}

export async function fetchIssueAttachmentList(parentId: string): Promise<IssueAttachment[] | null> {
  let issueAttachmentsList = [];
  try {
    issueAttachmentsList = await issueAttachmentService.getAll(String(parentId));
    
    const invalidAttachments: IssueAttachment[] = [];

    for (const attachment of issueAttachmentsList) {
      try {       
        const { exists } = await getInfoAsync(attachment.local_url);
        if (!exists) {
          invalidAttachments.push(attachment)
          break;
        };
      } catch (err) {
        // treat any error as missing file
        invalidAttachments.push(attachment);
        break;
      }
    }
    
    const invalidAttachmentIndex =
      invalidAttachments.length > 0 ? invalidAttachments[0] : -1;

    if (invalidAttachmentIndex == -1) {
      return issueAttachmentsList;
    }

    // Add local paths to local list
    let issueAttachmentsListRaw: IssueAttachmentLocalModel[] = (await localRepository.getAllRaw(
      null,
      null,
      null,
      null,
      parentId
    )) as IssueAttachmentLocalModel[];

    for (const attachment of issueAttachmentsListRaw) {
      // test between creation (1st sync) - remove connection - get(2nd sync)
      // test between creation (1st sync) - remove connection - open detail - get(2nd sync)

      const { savedFile, filename } = await ensureLocalFile(attachment);
      console.log('SAVED FILE', savedFile, filename);

      if (savedFile) {
        localRepository.update(attachment, { local_url: savedFile, filename }, 'synced'); // mark as synced because local_url is not a field available in BE
      }
    }

    // refetch the list
    const updatedAttachments = await issueAttachmentService.getAll(parentId);
    
    return updatedAttachments;
  } catch (error) {
    console.error('Error syncing issues attachment:', error);
    return issueAttachmentsList;
  }
}

export async function createIssueAttachment(attachment: IssueAttachment): Promise<IssueAttachment[] | null> {
  try {
    
    return await issueAttachmentService.upsert(attachment)
  } catch (error) {
    console.error('Error creating issue attachment:', error);
  }
}

export async function refetchAttachment(attachmentId: string) {
  const issueAttachmentRaw = await localRepository.findOneRaw(attachmentId) as IssueAttachmentLocalModel;
  const { savedFile, filename } = await ensureLocalFile(issueAttachmentRaw);
  if (savedFile) {
    localRepository.update(issueAttachmentRaw, { local_url: savedFile, filename }, 'synced'); // mark as synced because local_url is not a field available in BE
  }
}

export const issueAttachmentSyncable: Syncable = {
  pushChanges: ({ changes, lastPulledAt }) =>
    issueAttachmentService.pushChanges({ changes, lastPulledAt }),
  pullChanges: ({ tableName, lastPulledAt, forceFetchAllPages, parentChanges }) =>
    issueAttachmentService.pullChanges({ tableName, lastPulledAt, forceFetchAllPages, parentChanges }),
  tableName: TABLE_NAMES.issueAttachment,
  replaceParentIds: (
    idsToReplace: [CreatedResponseWithBackendId, WatermelonId][],
    status?: SyncStatus
  ) =>
    issueAttachmentService.replaceParentIdProperty(idsToReplace as any, status) as any,
};
