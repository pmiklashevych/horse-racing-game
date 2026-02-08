import { inject } from 'vue';
import { raceDataLayerKey } from '@/services/storage/injection';
import type { RaceDataLayer } from '@/types/storage';

export function useRaceDataLayer(): RaceDataLayer {
  const dataLayer = inject(raceDataLayerKey);
  if (!dataLayer) {
    throw new Error('Race data layer is not provided.');
  }

  return dataLayer;
}
