import type { Track } from './track';

export type RoundStatus = 'new' | 'in_progress' | 'completed';

export interface RoundResultEntry {
  horseId: string;
  timeMs: number;
}

export interface Round {
  id: string;
  status: RoundStatus;
  track: Track;
  horses: string[]; // horse ids
  results: RoundResultEntry[];
  conditionApplied: boolean;
}
