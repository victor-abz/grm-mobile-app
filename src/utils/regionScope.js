import watermelonManager from '../database/watermelonManager';
import { logger } from './logger';

/**
 * Resolve every administrative region the signed-in user is responsible for.
 *
 * The backend already walks the tree downward from each assignment
 * (`egrm.api.lookup.get_user_accessible_regions` does a BFS over
 * `parent_region`), so `userContext.accessible_regions` normally arrives
 * complete. The local walk below re-expands from whatever seeds we were given
 * using the regions present in WatermelonDB, so the scope stays correct when
 * a hierarchy is only partially synced or when an older context payload is
 * replayed from cache.
 *
 * @param {object} userContext Parsed `user_context.context_data`.
 * @returns {Promise<string[]>} Region ids, deduped. Empty when the user has no
 *   assignments — callers must treat that as "show nothing", not "show all".
 */
export const getAccessibleRegionIds = async (userContext) => {
  const seeds = (userContext?.accessible_regions || [])
    .map((region) => region?.name || region?.id)
    .filter(Boolean);

  if (seeds.length === 0) {
    logger.warn('regionScope: user context carries no accessible regions');
    return [];
  }

  let localRegions = [];
  try {
    const db = watermelonManager.getDatabase();
    const records = await db.get('grm_administrative_regions').query().fetch();
    localRegions = records.map((record) => record._raw);
  } catch (error) {
    logger.error('regionScope: could not read local regions, using seeds only', error);
    return Array.from(new Set(seeds));
  }

  const childrenByParent = new Map();
  localRegions.forEach((region) => {
    const parent = region.parent_region;
    if (!parent) return;
    if (!childrenByParent.has(parent)) childrenByParent.set(parent, []);
    childrenByParent.get(parent).push(region.id);
  });

  const scope = new Set();
  const stack = [...seeds];
  while (stack.length > 0) {
    const regionId = stack.pop();
    if (!scope.has(regionId)) {
      scope.add(regionId);
      stack.push(...(childrenByParent.get(regionId) || []));
    }
  }

  return Array.from(scope);
};

export default getAccessibleRegionIds;
