import { BaseService } from '../shared/BaseService';
import { AdministrativeRegionLocalRepository } from "../../repositories/local/issues/AdministrativeRegionLocalRepository";
import AdministrativeRegionRemoteRepository from "../../repositories/remote/issues/AdministrativeRegionRemoteRepository";
import { AdministrativeRegion } from "../../models/issues/AdministrativeRegions";
import { getData, removeValue, storeData } from '../../utils/storageManager';
import { INITIAL_DATA_FETCHED_STORAGE_KEY } from '../../utils/constants';

const localRepository = new AdministrativeRegionLocalRepository();
const remoteRepository = new AdministrativeRegionRemoteRepository();

const administrativeRegionService = new BaseService<AdministrativeRegion>(localRepository, remoteRepository);

export async function fetchAdministrativeRegions(fetchAll: boolean): Promise<AdministrativeRegion[] | null> {
  try {
    // removeValue(INITIAL_DATA_FETCHED_STORAGE_KEY)
    const fetchFromLocal = await getData(INITIAL_DATA_FETCHED_STORAGE_KEY);
    const response = await administrativeRegionService.getAll(null, fetchFromLocal, null, fetchAll);
    if (!fetchFromLocal) {
      await administrativeRegionService.bulkCreate(response); 
    }
    return response;

  } catch (error) {
    throw new Error(`Error fetching administrative regions: ${error}`);
  }
}
