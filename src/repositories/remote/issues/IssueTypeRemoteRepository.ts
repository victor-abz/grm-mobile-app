import request from '../../../utils/request';
import { BaseRemoteRepository } from '../../shared/BaseRemoteRepository';
import { IssueType } from '../../../models/issues/IssueType';

class IssueTypeRemoteRepository extends BaseRemoteRepository<IssueType> {
  
  create(item: IssueType): Promise<IssueType> {
    throw new Error('Method not implemented.');
  }

  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async fetchAll(): Promise<IssueType[]> {
    const url = `/issues/issue-types/`;
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
      const results: IssueType[] = jsonData.results ?? []
      return results;
    } catch (error) {
      console.error(error.message);
    }
  }

  fetchById(id: string): Promise<IssueType> {
    throw new Error('Method not implemented.');
  }

  update(id: string, item: IssueType): Promise<IssueType> {
    throw new Error('Method not implemented.');
  }
}

export default IssueTypeRemoteRepository;
