import { BaseLocalRepository } from '../../shared/BaseLocalRepository';
import { TABLE_NAMES } from "../../../migrations/tableName";
import { IssueComment, IssueCommentLocalModel } from "../../../models/issues/IssueComment";

export class IssueCommentLocalRepository extends BaseLocalRepository<IssueComment> {
  constructor() {
    super(TABLE_NAMES.issueComment);
  }

  fromLocalToRemote(localModel: IssueCommentLocalModel): IssueComment {
    return {
      parent_id: localModel.parent_id,
      id: localModel.id,
      comment: localModel.comment_text,
      due_date: localModel.comment_due_date
    };
  }
}
