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
      administrative_region: parseJson(localModel.administrative_region),
      assignee: parseJson(localModel.assignee),
      attachments: parseJson(localModel.attachments),
      category: parseJson(localModel.category),
      citizen: parseJson(localModel.citizen),
      component: parseJson(localModel.component),
      contact_information: parseJson(localModel.contact_information),
      issue_sub_type: parseJson(localModel.issue_sub_type),
      issue_type: parseJson(localModel.issue_type),
      reporter: parseJson(localModel.reporter),
      sub_component: parseJson(localModel.sub_component),
      status: parseJson(localModel.status),
    };
  }
}
