import { appSchema } from '@nozbe/watermelondb'
// eslint-disable-next-line import/extensions,import/no-unresolved
import { issueStatusTableSchema } from "./v1/issue_status";
// eslint-disable-next-line import/extensions,import/no-unresolved
import { issueTableSchema } from "./v1/issue";

export default appSchema({
  version: 1,
  tables: [
    issueStatusTableSchema,
    issueTableSchema
  ]
})