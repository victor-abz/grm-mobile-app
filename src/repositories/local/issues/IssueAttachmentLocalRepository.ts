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
      

      return {
        ...i,
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
