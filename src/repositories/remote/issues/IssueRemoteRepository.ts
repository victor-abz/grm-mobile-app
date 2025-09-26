import { SortOrder } from '@nozbe/watermelondb/QueryDescription';
import { Issue } from '../../../models/issues/Issue';
import request from '../../../utils/request';
import { BaseRemoteRepository } from '../../shared/BaseRemoteRepository';

export class IssueRemoteRepository extends BaseRemoteRepository<Issue> {
  private baseUrl = `${config.API_AUTH_BASE_URL}/issues`;

  fromRemoteToLocal(issue: any, index): any {

    
    if (issue && typeof issue === 'object') {
      const i = issue as Record<string, any>;
      return {
      ...i,
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


  /**
   * Fetch all issues from a dynamic endpoint.
   * @param endpointType 'assignee' | 'reporter' | etc.
   */
  async fetchAll(
    endpointType: string | null,
    sortBy: string | null,
    sortOrder: SortOrder | null,
    limit: number | null,
    created_date: EpochTimeStamp | null,
    updated_date: EpochTimeStamp | null,
    deleted_date: EpochTimeStamp | null
  ): Promise<Issue[]> {
    const params: Record<string, string> = {};
    
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    if (limit) params.limit = limit.toString();
    if (created_date) params.created_date = String(new Date(created_date).toISOString());
    if (updated_date) params.updated_date = String(new Date(updated_date).toISOString());
    if (deleted_date) params.deleted_date = String(new Date(deleted_date).toISOString());

    const url = `${this.baseUrl}/${endpointType}/`;

    try {
      const response = await request({
        url,
        method: 'GET',
        params: new URLSearchParams(params),
      });

      const jsonData: any = response.data;
      return jsonData.results ?? []
    } catch (error) {
      return Promise.reject({ message: error.message });
    }
  }

  async create(item: Issue): Promise<Issue> {
    const body = {
      title: item.title,
      description: item.description,
      status: item.status.id,
      category: item.category.id,
      issue_type: item.issue_type.id,
      issue_sub_type: item.issue_sub_type.id,
      issue_location: item.issue_location_id,
      intake_date: item.intake_date,
      administrative_region: item.administrative_region.id,
      reporter: item.reporter.id,
      assignee: item.assignee.id,
      citizen: item.citizen ? {
        name: item.citizen.name,
        type: item.citizen.type,
        age_group: item.citizen.age_group.id,
        group: item.citizen.group.id,
        group_2: item.citizen.group_2.id,
      } : null,
      component: item.component.id,
      sub_component: item.sub_component.id,
      contact_medium: item.contact_medium,
      contact_method: item.contact_method,
      contact_information: item.contact_information,
      ongoing_issue: item.ongoing_issue,
      tracking_code: item.tracking_code,
    };

    const url = `${this.baseUrl}/create/`;

    const requestOptions = {
      url,
      method: 'POST',
      body: JSON.stringify(body),
    };

    try {
      const response = await request({
        ...requestOptions,
      });

      const jsonData: any = response.data;
      return jsonData;
    } catch (error) {
      console.error('Error creating issue at remote', error.message);
    }
  }

  async delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async fetchById(id: string): Promise<Issue> {
    throw new Error('Method not implemented.');
  }

  // Partially update an issue. Only specific fields can be modified.
  // Access Control:
  // Only users who are either the reporter or assignee of the issue can access this endpoint.
  async update(id: string, item: Issue): Promise<Issue> {
    const url = `${this.baseUrl}/${id}/update/`;

    const body = {
      escalate_flag: item.escalate_flag,
      reject_flag: item.reject_flag,
      rating: item.rating,
      escalation_reason: item.escalation_reason,
      research_result: item.research_result,
      status: item.status.id,
    };

    const requestOptions = {
      url,
      method: 'PATCH',
      data: JSON.stringify(body),
      headers: {'Content-Type': 'application/json'}
    };

    try {
      const response = await request({
        ...requestOptions,
      });
      const jsonData: any = response.data;
      return jsonData;
    } catch (error) {
      console.error('Error updating issue at remote', error.message);
    }
  }
}
