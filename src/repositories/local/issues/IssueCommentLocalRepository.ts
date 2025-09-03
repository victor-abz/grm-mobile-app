import { BaseLocalRepository } from '../../shared/BaseLocalRepository';
import { TABLE_NAMES } from "../../../migrations/tableName";
import { IssueComment, IssueCommentLocalModel } from "../../../models/issues/IssueComment";

export class IssueCommentLocalRepository extends BaseLocalRepository<IssueComment> {
  constructor() {
    super(TABLE_NAMES.issueComment);
  }

  fromLocalToRemote(localModel: IssueCommentLocalModel): IssueComment {
    return {
      id: localModel.id,
      comment: localModel.comment,
      due_date: localModel.due_date
    };
  }
}
