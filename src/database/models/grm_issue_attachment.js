import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class GrmIssueAttachment extends Model {
  static table = 'grm_issue_attachments';

  static associations = {
    grm_issues: { type: 'belongs_to', key: 'grm_issue' },
  };

  @field('attachment') attachment;

  @field('file_name') fileName;

  @field('local_url') localUrl;

  @field('server_url') serverUrl;

  @field('uploaded') uploaded;

  // Add Frappe sync timestamp fields
  @date('creation') creation;

  @date('modified') modified;

  @date('created_at') createdAt;

  @date('updated_at') updatedAt;

  @field('grm_issue') grmIssue;
}
