import { config } from "../../../../config.dev";
import { BaseRemoteRepository } from "../../shared/BaseRemoteRepository";
import { Issue } from "../../../models/issues/Issue";
import request from "../../../utils/request";

export class IssueRemoteRepository extends BaseRemoteRepository<Issue> {
  private baseUrl = `${config.API_AUTH_BASE_URL}/issues`;

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
      citizen: {
        name: item.citizen.name,
        type: item.citizen.type,
        age_group: item.citizen.age_group.id,
        group: item.citizen.group.id,
        group_2: item.citizen.group_2.id,
      },
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
      params: new URLSearchParams({ page: '1', pageSize: '20' }),
      body: JSON.stringify(body),
    };

    try {
      const response = await request({
        ...requestOptions,
      });

      const jsonData: any = response.data;
      return jsonData.results;
    } catch (error) {
      console.error("Error creating issue at remote", error.message);
    }
  }

  async delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async fetchAll(): Promise<Issue[]> {
    const url = `${this.baseUrl}/list/`;
    const requestOptions = {
      url,
      method: 'GET',
      params: new URLSearchParams({ page: '1', pageSize: '20' }),
    };
    try {
      const response = await request({
        ...requestOptions,
      });

      const jsonData: any = response.data;
      return jsonData.results;
    } catch (error) {
      console.error("Error at fetching issues from remote", error.message);
    }
  }

  async fetchById(id: string): Promise<Issue>  {
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
      console.error("Error at fetching issues from remote", error.message);
    }
  }

  async update(id: string, item: Issue): Promise<Issue> {
    throw new Error('Method not implemented.');
  }
}
