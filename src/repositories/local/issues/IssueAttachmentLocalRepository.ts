import { BaseLocalRepository } from '../../shared/BaseLocalRepository';
import { TABLE_NAMES } from "../../../migrations/tableName";
import { IssueAttachment, IssueAttachmentLocalModel } from "../../../models/issues/IssueAttachment";

export class IssueAttachmentLocalRepository extends BaseLocalRepository<IssueAttachment> {
  constructor() {
    super(TABLE_NAMES.issueAttachment);
  }

  fromRemoteToLocal(issueAttachment: any, parentId?: string | number): any {
    if (issueAttachment && typeof issueAttachment === 'object') {
      const i = issueAttachment as Record<string, any>;
      
      const rawFile = i.file ?? '';
      let fileStr = typeof rawFile === 'string' ? rawFile : String(rawFile);

      // remove surrounding quotes like "\"...\"" -> ...
      fileStr = fileStr.replace(/^"+|"+$/g, '');

      // keep only the path part (starting at /media/attachments if present)
      const mediaIndex = fileStr.indexOf('/media/attachments');
      const path = mediaIndex >= 0 ? fileStr.slice(mediaIndex) : fileStr;

      const filename = (path.split('/').pop() || `attachment_${i.id ?? Date.now()}`).replace(/^"+|"+$/g, '');
      const localDir = `issues/${parentId ?? i?.issue?.id ?? 'unknown'}/attachments`;
      const localPath = `${localDir}/${filename}`;

      return {
        ...i,
        // file_name: filename,
        // store a local path derived from the remote url (actual download should be done elsewhere)
        // local_url: localPath,
        // is_audio: /\.(3gp|mp3|wav|m4a|aac)$/i.test(filename),
        parent_id: String(parentId ?? i?.issue?.id ?? ''),
        // keep the cleaned-up remote path
        url: i.file
      };
    }
    
    return null;
  }   

  fromLocalToRemote(localModel: IssueAttachmentLocalModel): IssueAttachment {
    return {
      id: localModel.id,
      name: localModel.file_name,
      created_date: localModel.created_date,
      local_url: localModel.local_url,
      url: localModel.url,
      is_audio: localModel.is_audio,
      parent_id: localModel.parent_id,
      file_name: localModel.file_name
    };
  }
}
