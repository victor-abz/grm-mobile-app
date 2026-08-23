import { BaseLocalRepository } from '../../shared/BaseLocalRepository';
import { ContactMedium, ContactMethod, Issue, IssueLocalModel } from '../../../models/issues/Issue';
import { TABLE_NAMES } from '../../../migrations/tableName';
import { parseJson } from '../../../utils/utils';

export class IssueLocalRepository extends BaseLocalRepository<Issue> {
  constructor() {
    super(TABLE_NAMES.issue);
  }
  
  fromRemoteToLocal(issue: any): any {
    if (issue && typeof issue === 'object') {
      const i = issue as Record<string, any>;
      
      return {
        ...i,
        administrative_region: typeof i.administrative_region === 'object' ? JSON.stringify(i.administrative_region) : i.administrative_region,
        assignee: typeof i.assignee === 'object' ? JSON.stringify(i.assignee) : i.assignee,
        category: typeof i.category === 'object' ? JSON.stringify(i.category) : i.category,
        citizen: typeof i.citizen === 'object' ? JSON.stringify(i.citizen) : i.citizen,
        component: typeof i.component === 'object' ? JSON.stringify(i.component) : i.component,
        issue_sub_type: typeof i.issue_sub_type === 'object' ? JSON.stringify(i.issue_sub_type) : i.issue_sub_type,
        issue_type: typeof i.issue_type === 'object' ? JSON.stringify(i.issue_type) : i.issue_type,
        reporter: typeof i.reporter === 'object' ? JSON.stringify(i.reporter) : i.reporter,
        sub_component: typeof i.sub_component === 'object' ? JSON.stringify(i.sub_component) : i.sub_component,
        status: typeof i.status === 'object' ? JSON.stringify(i.status) : i.status,
      };
    }
    return null;
  }

  fromLocalToRemote(localModel: IssueLocalModel): Issue {

    return {
      id: localModel.id,
      name: localModel.name,
      escalate_flag: localModel.escalate_flag,
      reject_flag: localModel.reject_flag,
      reject_reason: localModel.reject_reason,
      rating: localModel.rating,
      escalation_reason: localModel.escalation_reason,
      research_result: localModel.research_result,
      auto_increment_id: localModel.auto_increment_id,
      confirmed: localModel.confirmed,
      description: localModel.description,
      issue_location_id: localModel.issue_location_id,
      internal_code: localModel.internal_code,
      location_description: localModel.location_description,
      ongoing_issue: localModel.ongoing_issue,
      title: localModel.title,
      tracking_code: localModel.tracking_code,
      contact_medium: localModel.contact_medium as ContactMedium,
      contact_method: localModel.contact_method as ContactMethod,
      created_date: localModel.created_date,
      updated_date: localModel.updated_date,
      intake_date: localModel.intake_date,
      resolution_date: localModel.resolution_date ? new Date(localModel.resolution_date) : null,
      administrative_region:
        typeof localModel.administrative_region === 'string' &&
        localModel.administrative_region.trim().startsWith('{')
          ? parseJson(localModel.administrative_region)
          : localModel.administrative_region,
      assignee:
        typeof localModel.assignee === 'string' && localModel.assignee.trim().startsWith('{')
          ? parseJson(localModel.assignee)
          : localModel.assignee,
      attachments:
        typeof localModel.attachments === 'string'
          ? parseJson(localModel.attachments)
          : localModel.attachments,
      category:
        typeof localModel.category === 'string' && localModel.category.trim().startsWith('{')
          ? parseJson(localModel.category)
          : localModel.category,
      citizen:
        typeof localModel.citizen === 'string' && localModel.citizen.trim().startsWith('{')
          ? parseJson(localModel.citizen)
          : localModel.citizen,
      component:
        typeof localModel.component === 'string' && localModel.component.trim().startsWith('{')
          ? parseJson(localModel.component)
          : localModel.component,
      contact_information: localModel.contact_information,
      issue_sub_type: 
        typeof localModel.issue_sub_type === 'string' &&
        localModel.issue_type.trim().startsWith('{')
          ? parseJson(localModel.issue_sub_type)
          : localModel.issue_sub_type,
      issue_type: 
        typeof localModel.issue_type === 'string' && localModel.issue_type.trim().startsWith('{')
          ? parseJson(localModel.issue_type)
          : localModel.issue_type,
      reporter:
        typeof localModel.reporter === 'string' && localModel.reporter.trim().startsWith('{')
          ? parseJson(localModel.reporter)
          : localModel.reporter,
      sub_component:
        typeof localModel.sub_component === 'string' &&
        localModel.sub_component.trim().startsWith('{')
          ? parseJson(localModel.sub_component)
          : localModel.sub_component,
      status:
        typeof localModel.status === 'string' && localModel.status.trim().startsWith('{')
          ? parseJson(localModel.status)
          : localModel.status,
    };
  }
}
