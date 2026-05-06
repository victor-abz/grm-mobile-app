import request from '../../../utils/request';
import { BaseRemoteRepository } from '../../shared/BaseRemoteRepository';
import { AdministrativeRegion } from '../../../models/issues/AdministrativeRegions';
import { SortOrder } from '@nozbe/watermelondb/QueryDescription';

class AdministrativeRegionRemoteRepository extends BaseRemoteRepository<AdministrativeRegion> {

  fetchMore(endpointType: string): Promise<AdministrativeRegion[]> {
    throw new Error('Method not implemented.');
  }

  create(item: AdministrativeRegion): Promise<AdministrativeRegion> {
    throw new Error('Method not implemented.');
  }

  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  fetchById(id: string): Promise<AdministrativeRegion> {
    throw new Error('Method not implemented.');
  }

  update(id: string, item: AdministrativeRegion): Promise<AdministrativeRegion> {
    throw new Error('Method not implemented.');
  }

  async fetchAll(
    endpointType: string | null,
    sortBy: string | null,
    sortOrder: SortOrder | null,
    page: number | null,
    limit: number | null,
    allPages: boolean | null,
  ): Promise<AdministrativeRegion[]> {
  
    try {
      let regionsList: AdministrativeRegion[] = [];
      let lastPage = false;

      let url = `/issues/regions/`;
      
      while (!lastPage) {
        const requestOptions = {
          url,
          method: 'GET',
        };

        const response = await request({
          ...requestOptions,
        });
      
        if (
          response &&
          response.data &&
          response.data.results &&
          Array.isArray(response.data.results)
        ) {
          regionsList = regionsList.concat(response.data.results);
          if (!response.data.next) {
            lastPage = true;
          } else {
            url = response.data.next.substring(response.data.next.indexOf('/issues'));
          }
        } else {
          lastPage = true;
        }
      } 

      const results: AdministrativeRegion[] = regionsList ?? [];
      return results;
    } catch (error) {
      console.error(error.message);
    }
  }
}

export default AdministrativeRegionRemoteRepository;
