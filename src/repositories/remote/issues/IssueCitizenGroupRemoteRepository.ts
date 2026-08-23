import request from '../../../utils/request';
import { BaseRemoteRepository } from '../../shared/BaseRemoteRepository';
import { IssueCitizenGroup } from '../../../models/issues/IssueCitizenGroup';

class IssueCitizenGroupRemoteRepository extends BaseRemoteRepository<IssueCitizenGroup> {
  create(item: IssueCitizenGroup): Promise<IssueCitizenGroup> {
    throw new Error('Method not implemented.');
  }
  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  update(id: string, item: IssueCitizenGroup): Promise<IssueCitizenGroup> {
    throw new Error('Method not implemented.');
  }

  fetchById(id: string): Promise<IssueCitizenGroup> {
    throw new Error('Method not implemented.');
  }

  async fetchAll(): Promise<IssueCitizenGroup[]> {
    const url = `/issues/citizen-groups/`;
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
      const results: IssueCitizenGroup[] = jsonData.results ?? [];
      return results;
    } catch (error) {
      console.error(error.message);
    }
  }
}

export default IssueCitizenGroupRemoteRepository;
