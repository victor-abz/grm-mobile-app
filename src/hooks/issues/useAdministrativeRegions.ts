import { useEffect, useState } from 'react';
import * as AdministrativeRegionService from '../../services/issues/AdministrativeRegionService';
import type { AdministrativeRegion } from '../../models/issues/AdministrativeRegions';

export function useAdministrativeRegions() {
  const [administrativeRegionsList, setAdministrativeRegionsList] = useState<AdministrativeRegion[]>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdministrativeRegionsList();
  }, []);

  const fetchAdministrativeRegionsList = async () => {
    setLoading(true);
    if (!administrativeRegionsList) {
      const administrativeRegions =
        await AdministrativeRegionService.fetchAdministrativeRegions(true);
        setAdministrativeRegionsList(administrativeRegions);
    }
    setLoading(false);
  };

  return { administrativeRegionsList, loading };
}
