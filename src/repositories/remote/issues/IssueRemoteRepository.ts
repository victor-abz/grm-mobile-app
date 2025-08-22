import { BaseRemoteRepository } from '../BaseRemoteRepository';
import { Issue } from '../../../models/Issue';
import { config } from "../../../../config.dev";

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

    const res = await fetch(`${this.baseUrl}/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async delete(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
  }

  async fetchAll(): Promise<Issue[]> {
    const res = await fetch(`${this.baseUrl}/list`, {
    });
    return res.json();
  }

  async fetchById(id: string): Promise<Issue> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
    });
    return res.json();
  }

  async update(id: string, item: Issue): Promise<Issue> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    return res.json();
  }
}
