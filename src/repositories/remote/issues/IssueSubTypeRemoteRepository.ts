import request from '../../../utils/request';
import { BaseRemoteRepository } from '../../shared/BaseRemoteRepository';
import { IssueSubType } from '../../../models/issues/IssueSubType';

class IssueSubTypeRemoteRepository extends BaseRemoteRepository<IssueSubType> {
  
  create(item: IssueSubType): Promise<IssueSubType> {
    throw new Error('Method not implemented.');
  }

  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async fetchAll(): Promise<IssueSubType[]> {
    const url = `/issues/issue-subtypes/`;
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
      const results: IssueSubType[] = jsonData.results ?? []
      return results;
    } catch (error) {
      console.error(error.message);
    }
  }

  fetchById(id: string): Promise<IssueSubType> {
    throw new Error('Method not implemented.');
  }

  update(id: string, item: IssueSubType): Promise<IssueSubType> {
    throw new Error('Method not implemented.');
  }
}

export default IssueSubTypeRemoteRepository;
