import { SortOrder } from '@nozbe/watermelondb/QueryDescription';
import { Issue } from '../../../models/issues/Issue';
import request from '../../../utils/request';
import { BaseRemoteRepository } from '../../shared/BaseRemoteRepository';
import config from '../../../../config';

export class IssueRemoteRepository extends BaseRemoteRepository<Issue> {
  private baseUrl = `${config.API_AUTH_BASE_URL}/issues`;
  private nextReporterListPage: string = null;
  private nextAssigneeListPage: string = null;

  /**
   * Fetch all issues from a dynamic endpoint.
   * @param endpointType 'assignee' | 'reporter' | etc.
   */
  async fetchAll(
    endpointType: 'assignee' | 'reporter' | null,
    sortBy: string | null,
    sortOrder: SortOrder | null,
    page: number | null,
    limit: number | null,
    allPages: boolean | null,
    created_date: EpochTimeStamp | null,
    updated_date: EpochTimeStamp | null,
    deleted_date: EpochTimeStamp | null
  ): Promise<Issue[]> {
    const params: Record<string, string> = {};

    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    if (page) params.page = page.toString();
    if (limit) params.page_size = limit.toString();
    if (created_date) params.created_date = String(new Date(created_date).toISOString());
    if (updated_date) params.updated_date = String(new Date(updated_date).toISOString());
    if (deleted_date) params.deleted_date = String(new Date(deleted_date).toISOString());

    const url = `${this.baseUrl}/${endpointType}/`;

    if (allPages) {
      try {
        let issuesList: Issue[] = [];
        let lastPage = false;

        let _url = url;

        while (!lastPage) {
          const requestOptions = {
            url: _url,
            method: 'GET',
            params: new URLSearchParams(params),
          };

          const response = await request({
            ...requestOptions,
          });

          if (
            response &&
            response.data &&
            response.data.results &&
            Array.isArray(response.data.results)
          ) {
            issuesList = issuesList.concat(response.data.results);
            if (!response.data.next) {
              lastPage = true;
            } else {
              _url = response.data.next.substring(response.data.next.indexOf('/issues'));
            }
          } else {
            lastPage = true;
          }
        }

        const results: Issue[] = issuesList ?? [];
        return results;
      } catch (error) {
        console.error(error.message);
      }
    } else {
      try {
        const response = await request({
          url,
          method: 'GET',
          params: new URLSearchParams(params),
        });
        const jsonData: any = response.data;
        if (response.data && response.data.next) {
          if (endpointType === 'reporter') {
            this.nextReporterListPage = response.data.next;
          } else if (endpointType === 'assignee') {
            this.nextAssigneeListPage = response.data.next;
          }
        }
        return jsonData.results ?? [];
      } catch (error) {
        return Promise.reject({ message: error.message });
      }
    }
  }

  async fetchMore(endpointType: 'assignee' | 'reporter'): Promise<Issue[]> {
    const url: string | null =
      endpointType == 'reporter' ? this.nextReporterListPage : this.nextAssigneeListPage;
    if (!url) return [];

    const response = await request({
      url,
      method: 'GET',
    });

    if (endpointType == 'reporter') {
      this.nextReporterListPage = response.data.next;
    } else {
      this.nextAssigneeListPage = response.data.next;
    }
    
    return response?.data?.results;
  }

  async create(item: Issue): Promise<Issue> {
    const body = {
      title: item.title,
      description: item.description,
      status: item.status.id ?? item.status,
      category: item.category ? (item.category.id ?? item.category) : null,
      issue_type: item.issue_type ? (item.issue_type.id ?? item.issue_type) : null,
      issue_sub_type: item.issue_sub_type ? (item.issue_sub_type.id ?? item.issue_sub_type) : null,
      issue_location: item.issue_location_id,
      intake_date: item.intake_date,
      administrative_region: item.administrative_region
        ? (item.administrative_region.id ?? item.administrative_region)
        : null,
      reporter: item.reporter ? (item.reporter.id ?? item.reporter) : null,
      assignee: item.assignee ? (item.assignee.id ?? item.assignee) : null,
      citizen: item.citizen
        ? {
            name: item.citizen.name,
            type: item.citizen.type,
            age_group: item.citizen.age_group
              ? (item.citizen.age_group.id ?? item.citizen.age_group)
              : null, // coming from local db or creation form
            group: item.citizen.group ? (item.citizen.group.id ?? item.citizen.group) : null, // coming from local db or creation form
            group_2: item.citizen.group_2
              ? (item.citizen.group_2.id ?? item.citizen.group_2)
              : null, // coming from local db or creation form
          }
        : null,
      component: item.component ? (item.component.id ?? item.component) : null,
      sub_component: item.sub_component ? (item.sub_component.id ?? item.sub_component) : null,
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
      data: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
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
    const url = `${this.baseUrl}/${id}`;
    const requestOptions = {
      url,
      method: 'GET',
    };
    try {
      const response = await request({
        ...requestOptions,
      });

      const jsonData: any = response.data;
      return jsonData.results;
    } catch (error) {
      console.error('Error at fetching issues from remote', error.message);
    }
  }

  // Partially update an issue. Only specific fields can be modified.
  // Access Control:
  // Only users who are either the reporter or assignee of the issue can access this endpoint.
  async update(id: string, item: Issue): Promise<Issue> {
    const url = `${this.baseUrl}/${id}/update/`;

    const body = {
      escalate_flag: item.escalate_flag,
      reject_flag: item.reject_flag,
      rating: item.rating ?? undefined,
      escalation_reason: item.escalation_reason,
      research_result: item.research_result,
      status: item.status.id,
    };

    const requestOptions = {
      url,
      method: 'PATCH',
      data: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
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
