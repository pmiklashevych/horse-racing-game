import type { Track } from '@/types/track';

export const DEFAULT_HORSE_CONDITION = 80;
export const CONDITION_STEP = 5;
export const MIN_CONDITION = 5;
export const MAX_CONDITION = 100;
export const TOTAL_HORSES = 20;
export const HORSES_PER_ROUND = 10;
export const SIMULATION_TIME_SCALE = 12;
export const MIN_LOADING_TIME_MS = 2000;

export const TRACKS: Track[] = [
  { id: 'track_1', name: 'Track 1', distance: 1200 },
  { id: 'track_2', name: 'Track 2', distance: 1400 },
  { id: 'track_3', name: 'Track 3', distance: 1600 },
  { id: 'track_4', name: 'Track 4', distance: 1800 },
  { id: 'track_5', name: 'Track 5', distance: 2000 },
  { id: 'track_6', name: 'Track 6', distance: 2200 },
];

export const STORAGE_KEYS = {
  activeRace: 'horse-racing:active-race',
  completedRacesLocalStorage: 'horse-racing:completed-races',
  dbName: 'horse-racing:db',
  completedRaceStore: 'completed-races',
};
