import request from '../../../utils/request';
import { config } from '../../../../config.dev';
import { IssueStatus } from '../../../models/issues/IssueStatus';
import { BaseRemoteRepository } from '../../shared/BaseRemoteRepository';

class IssueStatusRemoteRepository extends BaseRemoteRepository<IssueStatus> {
  private baseUrl = `${config.API_AUTH_BASE_URL}/issues/issue-statuses/`;

  create(item: IssueStatus): Promise<IssueStatus> {
    throw new Error('Method not implemented.');
  }

  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async fetchAll(): Promise<IssueStatus[]> {
    const url = `${this.baseUrl}`;
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
      return Promise.reject({ message: error.message });
    }
  }

  fetchById(id: string): Promise<IssueStatus> {
    throw new Error('Method not implemented.');
  }

  update(id: string, item: IssueStatus): Promise<IssueStatus> {
    throw new Error('Method not implemented.');
  }
}

export default IssueStatusRemoteRepository;
