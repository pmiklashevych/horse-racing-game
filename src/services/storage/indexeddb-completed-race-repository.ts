import type { Race, RaceSummary } from '@/types/race';
import type { CompletedRaceRepository } from '@/types/storage';
import {
  getCompletedRaceByIdFromDb,
  listCompletedRaceSummariesFromDb,
  saveCompletedRaceToDb,
} from './indexeddb';
import { isIndexedDbSupported } from './support';

export function createIndexedDbCompletedRaceRepository(): CompletedRaceRepository {
  return {
    async getCompletedRaceById(id: string): Promise<Race | null> {
      return getCompletedRaceByIdFromDb(id);
    },

    async saveCompletedRace(race: Race): Promise<void> {
      await saveCompletedRaceToDb(race);
    },

    async listCompletedRaces(): Promise<RaceSummary[]> {
      return listCompletedRaceSummariesFromDb();
    },
  };
}

export function isIndexedDbCompletedRaceRepositorySupported(): boolean {
  return isIndexedDbSupported();
}
