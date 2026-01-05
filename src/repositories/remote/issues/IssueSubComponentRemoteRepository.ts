import request from '../../../utils/request';
import { BaseRemoteRepository } from '../../shared/BaseRemoteRepository';
import { IssueSubComponent } from '../../../models/issues/IssueSubComponent';

class IssueSubComponentRemoteRepository extends BaseRemoteRepository<IssueSubComponent> {
  
  create(item: IssueSubComponent): Promise<IssueSubComponent> {
    throw new Error('Method not implemented.');
  }

  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async fetchAll(): Promise<IssueSubComponent[]> {
    const url = `/issues/subcomponents/`;
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
      const results: IssueSubComponent[] = jsonData.results ?? []
      return results;
    } catch (error) {
      console.error(error.message);
    }
  }

  fetchById(id: string): Promise<IssueSubComponent> {
    throw new Error('Method not implemented.');
  }

  update(id: string, item: IssueSubComponent): Promise<IssueSubComponent> {
    throw new Error('Method not implemented.');
  }
}

export default IssueSubComponentRemoteRepository;
