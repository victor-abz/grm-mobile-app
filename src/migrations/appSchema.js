import { appSchema } from '@nozbe/watermelondb'
import { issueStatusTableSchema } from "./table-schemas/issue_status";
import { issueTableSchema } from "./table-schemas/issue";
import { issueCategoryTableSchema } from "./table-schemas/issue_category";
import { issueTypeTableSchema } from "./table-schemas/issue_type";
import { issueSubTypeTableSchema } from "./table-schemas/issue_subtype";
import { issueSubComponentTableSchema } from "./table-schemas/issue_subcomponent";
import { issueComponentTableSchema } from "./table-schemas/issue_component";
import { issueAgeGroupTableSchema } from "./table-schemas/issue_age_group";
import { administrativeRegionTableSchema } from './table-schemas/administrative_region';
import { issueCommentTableSchema } from './table-schemas/issue_comment';
import { issueAttachmentTableSchema } from './table-schemas/issue_attachment';
import { issueCitizenGroupTableSchema } from './table-schemas/issue_citizen_group';

export default appSchema({
  version: 2,
  tables: [
    administrativeRegionTableSchema,
    issueStatusTableSchema,
    issueTableSchema,
    issueCategoryTableSchema,
    issueTypeTableSchema,
    issueSubTypeTableSchema,
    issueSubComponentTableSchema,
    issueComponentTableSchema,
    issueAgeGroupTableSchema,
    issueCitizenGroupTableSchema,
    issueCommentTableSchema,
    issueAttachmentTableSchema,
  ],
});
