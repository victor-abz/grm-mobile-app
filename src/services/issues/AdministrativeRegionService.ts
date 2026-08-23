import { BaseService } from '../shared/BaseService';
import { AdministrativeRegionLocalRepository } from "../../repositories/local/issues/AdministrativeRegionLocalRepository";
import AdministrativeRegionRemoteRepository from "../../repositories/remote/issues/AdministrativeRegionRemoteRepository";
import { AdministrativeRegion } from "../../models/issues/AdministrativeRegions";
import { getData, removeValue, storeData } from '../../utils/storageManager';
import { INITIAL_DATA_FETCHED_STORAGE_KEY } from '../../utils/constants';

const localRepository = new AdministrativeRegionLocalRepository();
const remoteRepository = new AdministrativeRegionRemoteRepository();

const administrativeRegionService = new BaseService<AdministrativeRegion>(localRepository, remoteRepository);

export async function fetchAdministrativeRegions(fetchAllPages: boolean): Promise<AdministrativeRegion[] | null> {
  try {
    const fetchFromLocal = await getData(INITIAL_DATA_FETCHED_STORAGE_KEY);
    const response = await administrativeRegionService.getAll(null, null, fetchFromLocal, null, fetchAllPages);
    
    if (!fetchFromLocal) {
      await administrativeRegionService.bulkCreate(response); 
      //Turn off sync global loading
    }
    return response;

  } catch (error) {
    throw new Error(`Error fetching administrative regions: ${error}`);
  }
}
