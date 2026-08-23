import { BaseLocalRepository } from '../../shared/BaseLocalRepository';
import { TABLE_NAMES } from "../../../migrations/tableName";
import { IssueComment, IssueCommentLocalModel } from "../../../models/issues/IssueComment";
import { RawRecord } from '@nozbe/watermelondb/RawRecord';
import { parseJson } from '../../../utils/utils';

export class IssueCommentLocalRepository extends BaseLocalRepository<IssueComment> {
  constructor() {
    super(TABLE_NAMES.issueComment);
  }  

  fromRemoteToLocal(issueComment: any): any {
    if (issueComment && typeof issueComment === 'object') {
      const ic = issueComment as Record<string, any>;
   
      return {
        ...ic,
        parent_id: String(ic.issue),
        comment: ic.comment,
        user: typeof ic.user === 'object' ? JSON.stringify(ic.user) : ic.user,
        due_date: ic.due_date,
        created_date: ic.created_date,
        updated_date: ic.updated_date,
        deleted_date: ic.deleted_date,
      };
    }

    return null;
  }

  fromLocalToRemote(localModel: IssueCommentLocalModel): IssueComment {
    
    return {
      parent_id: localModel.parent_id,
      id: localModel.id,
      comment: localModel.comment,
      user:
        typeof localModel.user === 'string' && localModel.user.trim().startsWith('{')
          ? parseJson(localModel.user)
          : localModel.user,
      created_date: localModel.created_date,
      due_date: localModel.due_date,
    };
  }
}
