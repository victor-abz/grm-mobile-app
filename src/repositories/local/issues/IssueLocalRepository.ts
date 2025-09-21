import { BaseLocalRepository } from '../../shared/BaseLocalRepository';
import { ContactMedium, ContactMethod, Issue, IssueLocalModel } from '../../../models/issues/Issue';
import { TABLE_NAMES } from '../../../migrations/tableName';
import moment from 'moment';

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
      console.log(`PARSER STEP 1 - if null, it is an empty field at watermelon (review it)`, jsonString);
      try {
        const parsedJson = jsonString
          ? JSON.parse(JSON.stringify(jsonString), (key, value) => {
              if (typeof value === 'string') {
                // Try to parse ISO date strings to Date or Moment
                const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/;
                if (isoDateRegex.test(value)) {
                  return moment(value);
                }
              }
              if (key === 'id') {
                return String(value);
              }

              if (value === undefined) {
                return null;
              }
              return value;
            })
          : null;
        console.log('PARSER STEP 2', parsedJson);
        return parseJson;
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        return null;
      }
    };

    return {
      id: localModel.id,
      name: localModel.name,
      escalate_flag: localModel.escalate_flag,
      reject_flag: localModel.reject_flag,
      rating: localModel.rating,
      escalation_reason: localModel.escalate_flag,
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
      administrative_region: localModel.administrative_region,
      assignee: localModel.assignee,
      attachments: localModel.attachments,
      category: localModel.category,
      citizen: localModel.citizen,
      component: localModel.component,
      contact_information: localModel.contact_information,
      issue_sub_type: localModel.issue_sub_type,
      issue_type: localModel.issue_type,
      reporter: localModel.reporter,
      sub_component: localModel.sub_component,
      status: localModel.status,
    };
  }
}
