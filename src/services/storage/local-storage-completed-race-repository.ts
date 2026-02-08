import { STORAGE_KEYS } from '@/constants/game';
import type { Race, RaceSummary } from '@/types/race';
import type { CompletedRaceRepository } from '@/types/storage';
import { isLocalStorageSupported } from './support';

function readCompletedRaces(): Race[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.completedRacesLocalStorage);
    if (!raw) {
      return [];
    }

    const data = JSON.parse(raw) as Race[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeCompletedRaces(races: Race[]): void {
  localStorage.setItem(STORAGE_KEYS.completedRacesLocalStorage, JSON.stringify(races));
}

export function createLocalStorageCompletedRaceRepository(): CompletedRaceRepository {
  return {
    async getCompletedRaceById(id: string): Promise<Race | null> {
      return readCompletedRaces().find((race) => race.id === id) ?? null;
    },

    async saveCompletedRace(race: Race): Promise<void> {
      const races = readCompletedRaces();
      const existing = races.findIndex((item) => item.id === race.id);

      if (existing >= 0) {
        races[existing] = race;
      } else {
        races.push(race);
      }

      writeCompletedRaces(races);
    },

    async listCompletedRaces(): Promise<RaceSummary[]> {
      return readCompletedRaces()
        .map((race) => ({
          id: race.id,
          status: race.status,
          updatedAtMs: race.updatedAtMs,
        }))
        .sort((left, right) => right.updatedAtMs - left.updatedAtMs);
    },
  };
}

export function isLocalStorageCompletedRaceRepositorySupported(): boolean {
  return isLocalStorageSupported();
}
