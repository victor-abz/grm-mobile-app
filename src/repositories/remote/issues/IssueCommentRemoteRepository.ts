import request from '../../../utils/request';
import { BaseRemoteRepository } from '../../shared/BaseRemoteRepository';
import { IssueComment } from '../../../models/issues/IssueComment';
import { config } from '../../../../config.dev';
import { SortOrder } from '@nozbe/watermelondb/QueryDescription';

class IssueCommentRemoteRepository extends BaseRemoteRepository<IssueComment> {
  fetchMore(endpointType: string): Promise<IssueComment[]> {
    throw new Error('Method not implemented.');
  }
  private baseUrl = `${config.API_AUTH_BASE_URL}/issues`;

  fromRemoteToLocal(issueComment: any): any {
    if (issueComment && typeof issueComment === 'object') {
      const ic = issueComment as Record<string, any>;

      return {
        ...ic,
        parent_id: String(ic.issue),
        comment: ic.comment,
        due_date: ic.due_date,
        name: ic.user?.name ?? 'Unknown',
        created_date: ic.created_date,
        updated_date: ic.updated_date,
      };
    }

    return null;
  }

  async create(item: IssueComment): Promise<IssueComment> {
    const body = {
      comment: item.comment,
    };
    const url = `${this.baseUrl}/${item.parent_id}/add-comment`;
    const requestOptions = {
      url,
      method: 'POST',
      data: body,
    };
    
    try {
      const response = await request({
        ...requestOptions,
      });
      const jsonData: any = response.data;
      const localInstance = this.fromRemoteToLocal(jsonData);

      return localInstance;
    } catch (error) {
      console.error('Error creating issue comment at remote', error.message);
    }
  }

  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async fetchAll(
    endpointType: string | null,
    sortBy: string | null,
    sortOrder: SortOrder | null,
    page: number | null,
    limit: number | null,
    allPages: boolean | null,
    created_date: EpochTimeStamp | null,
    updated_date: EpochTimeStamp | null,
    deleted_date: EpochTimeStamp | null,
    parentId: string | null
  ): Promise<IssueComment[]> {
    const url = `${this.baseUrl}/${parentId}/comments/`;
    const pageParam = page ?? 1;
    const pageSizeParam = limit ?? 20;
    const requestOptions = {
      url,
      method: 'GET',
      params: new URLSearchParams({
        page: String(pageParam),
        pageSize: String(pageSizeParam),
      }),
    };
    try {
      const response = await request({
        ...requestOptions,
      });

      const jsonData: any = response.data;
      const results = Array.isArray(jsonData?.results) ? jsonData.results : [];
      return results.map((item: any) => this.fromRemoteToLocal(item));
    } catch (error) {
      console.error(error.message);
    }
  }

  async fetchById(id: string): Promise<IssueComment> {
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
      console.error('Error at fetching issues comment from remote', error.message);
    }
  }

  update(id: string, item: IssueComment): Promise<IssueComment> {
    throw new Error('Method not implemented.');
  }
}

export default IssueCommentRemoteRepository;
