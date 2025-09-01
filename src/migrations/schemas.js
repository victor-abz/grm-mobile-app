import { appSchema } from '@nozbe/watermelondb'
import { issueStatusTableSchema } from "./v1/issue_status";
import { issueTableSchema } from "./v1/issue";
import { issueCategoryTableSchema } from "./v1/issue_category";
import { issueTypeTableSchema } from "./v1/issue_type";

export default appSchema({
  version: 1,
  tables: [
    issueStatusTableSchema,
    issueTableSchema,
    issueCategoryTableSchema,
    issueTypeTableSchema,
  ]
})
