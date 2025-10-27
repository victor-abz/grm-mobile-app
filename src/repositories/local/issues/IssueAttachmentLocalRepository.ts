import { BaseLocalRepository } from '../../shared/BaseLocalRepository';
import { TABLE_NAMES } from "../../../migrations/tableName";
import { IssueAttachment, IssueAttachmentLocalModel } from "../../../models/issues/IssueAttachment";

export class IssueAttachmentLocalRepository extends BaseLocalRepository<IssueAttachment> {
  constructor() {
    super(TABLE_NAMES.issueAttachment);
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
