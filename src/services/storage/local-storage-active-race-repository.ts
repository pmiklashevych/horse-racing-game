import { STORAGE_KEYS } from '@/constants/game';
import type { ActiveRaceRepository } from '@/types/storage';
import type { Race } from '@/types/race';
import { isLocalStorageSupported } from './support';

function parseRace(raw: string | null): Race | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Race;
  } catch {
    return null;
  }
}

export function createLocalStorageActiveRaceRepository(): ActiveRaceRepository {
  return {
    async getActiveRace(): Promise<Race | null> {
      return parseRace(localStorage.getItem(STORAGE_KEYS.activeRace));
    },

    async saveActiveRace(race: Race | null): Promise<void> {
      if (!race) {
        localStorage.removeItem(STORAGE_KEYS.activeRace);
        return;
      }

      localStorage.setItem(STORAGE_KEYS.activeRace, JSON.stringify(race));
    },
  };
}

export function isLocalStorageActiveRaceRepositorySupported(): boolean {
  return isLocalStorageSupported();
}
