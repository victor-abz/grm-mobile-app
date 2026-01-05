import { RawRecord } from '@nozbe/watermelondb';
import { TABLE_NAMES } from "../../../migrations/tableName";
import { AdministrativeRegion, AdministrativeRegionLocalModel } from "../../../models/issues/AdministrativeRegions";
import { BaseLocalRepository } from '../../shared/BaseLocalRepository';

export class AdministrativeRegionLocalRepository extends BaseLocalRepository<AdministrativeRegion> {
  constructor() {
    super(TABLE_NAMES.administrativeRegions);
  }

  fromLocalToRemote(localModel: AdministrativeRegionLocalModel): AdministrativeRegion {
    return {
      id: localModel.id,
      name: localModel.name,
      created_date: localModel.created_date,
      administrative_level: localModel.administrative_level,
      parent: localModel.parent,
    };
  }

  fromRemoteToLocal(AdministrativeRegion: any): RawRecord {  
    const raw = {
      ...AdministrativeRegion,
    };
    return raw
  }

}
