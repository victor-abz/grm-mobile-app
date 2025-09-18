import { appSchema } from '@nozbe/watermelondb'
import { issueStatusTableSchema } from "./table-schemas/issue_status";
import { issueTableSchema } from "./table-schemas/issue";
import { issueCategoryTableSchema } from "./table-schemas/issue_category";
import { issueTypeTableSchema } from "./table-schemas/issue_type";

export default appSchema({
  version: 1,
  tables: [
    issueStatusTableSchema,
    issueTableSchema,
    issueCategoryTableSchema,
    issueTypeTableSchema,
  ]
})
