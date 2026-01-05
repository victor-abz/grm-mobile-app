import request from '../../../utils/request';
import { BaseRemoteRepository } from '../../shared/BaseRemoteRepository';
import { IssueComponent } from '../../../models/issues/IssueComponent';

class IssueComponentRemoteRepository extends BaseRemoteRepository<IssueComponent> {
  
  create(item: IssueComponent): Promise<IssueComponent> {
    throw new Error('Method not implemented.');
  }

  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async fetchAll(): Promise<IssueComponent[]> {
    const url = `/issues/components/`;
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
      const results: IssueComponent[] = jsonData.results ?? []
      return results;
    } catch (error) {
      console.error(error.message);
    }
  }

  fetchById(id: string): Promise<IssueComponent> {
    throw new Error('Method not implemented.');
  }

  update(id: string, item: IssueComponent): Promise<IssueComponent> {
    throw new Error('Method not implemented.');
  }
}

export default IssueComponentRemoteRepository;
