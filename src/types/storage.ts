import type { Race, RaceSummary } from './race';

export interface ActiveRaceRepository {
  getActiveRace(): Promise<Race | null>;
  saveActiveRace(race: Race | null): Promise<void>;
}

export interface CompletedRaceRepository {
  getCompletedRaceById(id: string): Promise<Race | null>;
  saveCompletedRace(race: Race): Promise<void>;
  listCompletedRaces(): Promise<RaceSummary[]>;
}

export type ActiveRaceRepositoryType = 'localstorage';
export type CompletedRaceRepositoryType = 'indexeddb' | 'localstorage';

export interface RaceStorageOptions {
  activeRaceRepository?: ActiveRaceRepositoryType;
  completedRaceRepository?: CompletedRaceRepositoryType;
  completedRaceFallbackRepository?: CompletedRaceRepositoryType | null;
}

export interface RaceDataLayer {
  activeRaceRepository: ActiveRaceRepository;
  completedRaceRepository: CompletedRaceRepository;
}
