import type { Horse } from './horse';
import type { Round, RoundStatus } from './round';

export type RaceStatus = 'in_progress' | 'completed';

export interface RoundRuntimeState {
  roundId: string;
  elapsedMs: number;
  paused: boolean;
  startedAtMs: number | null;
  finishedHorseIds: string[];
}

export interface Race {
  id: string;
  status: RaceStatus;
  horses: Horse[];
  rounds: Round[];
  activeRoundId: string | null;
  activeRoundStatus: RoundStatus | null;
  runtime: RoundRuntimeState | null;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface RaceSummary {
  id: string;
  status: RaceStatus;
  updatedAtMs: number;
}
