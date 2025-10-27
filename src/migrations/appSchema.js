import { appSchema } from '@nozbe/watermelondb'
import { issueStatusTableSchema } from "./table-schemas/issue_status";
import { issueTableSchema } from "./table-schemas/issue";
import { issueCategoryTableSchema } from "./table-schemas/issue_category";
import { issueTypeTableSchema } from "./table-schemas/issue_type";
import { issueCommentTableSchema } from './table-schemas/issue_comment';
import { issueAttachmentTableSchema } from './table-schemas/issue_attachment';

export default appSchema({
  version: 1,
  tables: [
    issueStatusTableSchema,
    issueTableSchema,
    issueCategoryTableSchema,
    issueTypeTableSchema,
    issueCommentTableSchema,
    issueAttachmentTableSchema,
  ],
});
