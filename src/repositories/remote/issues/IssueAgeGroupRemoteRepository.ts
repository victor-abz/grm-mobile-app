import request from '../../../utils/request';
import { BaseRemoteRepository } from '../../shared/BaseRemoteRepository';
import { IssueAgeGroup } from '../../../models/issues/IssueAgeGroup';

class IssueAgeGroupRemoteRepository extends BaseRemoteRepository<IssueAgeGroup> {
  create(item: IssueAgeGroup): Promise<IssueAgeGroup> {
    throw new Error('Method not implemented.');
  }
  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  update(id: string, item: IssueAgeGroup): Promise<IssueAgeGroup> {
    throw new Error('Method not implemented.');
  }

  fetchById(id: string): Promise<IssueAgeGroup> {
    throw new Error('Method not implemented.');
  }

  async fetchAll(): Promise<IssueAgeGroup[]> {
    const url = `/issues/citizen-age-groups/`;
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
      const results: IssueAgeGroup[] = jsonData.results ?? [];
      return results;
    } catch (error) {
      console.error(error.message);
    }
  }
}

export default IssueAgeGroupRemoteRepository;
