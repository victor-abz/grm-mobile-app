import { BaseLocalRepository } from '../../shared/BaseLocalRepository';
import { ContactMedium, ContactMethod, Issue, IssueLocalModel } from '../../../models/issues/Issue';
import { TABLE_NAMES } from '../../../migrations/tableName';

export class IssueLocalRepository extends BaseLocalRepository<Issue> {
  constructor() {
    super(TABLE_NAMES.issue);
  }
  fromRemoteToLocal(issue: any): any {
    if (issue && typeof issue === 'object') {
      const i = issue as Record<string, any>;
      
      return {
        ...i,
        administrative_region: JSON.stringify(i.administrative_region),
        assignee: JSON.stringify(i.assignee),
        category: JSON.stringify(i.category),
        citizen: JSON.stringify(i.citizen),
        component: JSON.stringify(i.component),
        issue_sub_type: JSON.stringify(i.issue_sub_type),
        issue_type: JSON.stringify(i.issue_type),
        reporter: JSON.stringify(i.reporter),
        sub_component: JSON.stringify(i.sub_component),
        status: JSON.stringify(i.status),
      };
    }
    return null;
  }

  fromLocalToRemote(localModel: IssueLocalModel): Issue {

    const parseJson = (jsonString: string | null): any => {
      try {
        return jsonString ? JSON.parse(jsonString) : null;
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        return jsonString;
      }
    };

    return {
      id: localModel.id,
      name: localModel.name,
      escalate_flag: localModel.escalate_flag,
      reject_flag: localModel.reject_flag,
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
      intake_date: new Date(localModel.intake_date),
      issue_date: localModel.issue_date ? new Date(localModel.issue_date) : null,
      resolution_date: localModel.resolution_date ? new Date(localModel.resolution_date) : null,
      administrative_region: typeof localModel.administrative_region === 'string'
        ? parseJson(localModel.administrative_region)
        : localModel.administrative_region,
      assignee: typeof localModel.assignee === 'string'
        ? parseJson(localModel.assignee)
        : localModel.assignee,
      attachments: typeof localModel.attachments === 'string'
        ? parseJson(localModel.attachments)
        : localModel.attachments,
      category: typeof localModel.category === 'string'
        ? parseJson(localModel.category)
        : localModel.category,
      citizen: typeof localModel.citizen === 'string'
        ? parseJson(localModel.citizen)
        : localModel.citizen,
      component: typeof localModel.component === 'string'
        ? parseJson(localModel.component)
        : localModel.component,
      contact_information: typeof localModel.contact_information === 'string'
        ? parseJson(localModel.contact_information)
        : localModel.contact_information,
      issue_sub_type: typeof localModel.issue_sub_type === 'string'
        ? parseJson(localModel.issue_sub_type)
        : localModel.issue_sub_type,
      issue_type: typeof localModel.issue_type === 'string'
        ? parseJson(localModel.issue_type)
        : localModel.issue_type,
      reporter: typeof localModel.reporter === 'string'
        ? parseJson(localModel.reporter)
        : localModel.reporter,
      sub_component: typeof localModel.sub_component === 'string'
        ? parseJson(localModel.sub_component)
        : localModel.sub_component,
      status: typeof localModel.status === 'string'
        ? parseJson(localModel.status)
        : localModel.status,
    };
  }
}
