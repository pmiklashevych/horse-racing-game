import {
  CONDITION_STEP,
  DEFAULT_HORSE_CONDITION,
  HORSES_PER_ROUND,
  MAX_CONDITION,
  MIN_CONDITION,
  TOTAL_HORSES,
  TRACKS,
} from '@/constants/game';
import { HORSE_BREEDS } from '@/constants/horse-breeds';
import { HORSE_COLORS } from '@/constants/horse-colors';
import { HORSE_NAMES } from '@/constants/horse-names';
import type { Horse } from '@/types/horse';
import type { Race } from '@/types/race';
import type { Round } from '@/types/round';
import { pickUnique } from './random';

export interface ConditionDelta {
  horseId: string;
  delta: number;
}

export function clampCondition(value: number): number {
  return Math.min(MAX_CONDITION, Math.max(MIN_CONDITION, Math.round(value / CONDITION_STEP) * CONDITION_STEP));
}

export function calculateHorseSpeed(baseSpeed: number, condition: number): number {
  return baseSpeed - (1 - condition / 100);
}

export function calculateRoundTimeMs(distance: number, speed: number): number {
  return (distance / speed) * 1000;
}

export function generateRace(baseRaceId: string): Race {
  const names = pickUnique(HORSE_NAMES, TOTAL_HORSES);
  const breeds = pickUnique(HORSE_BREEDS, TOTAL_HORSES);
  const colors = pickUnique(HORSE_COLORS, TOTAL_HORSES);

  const horses: Horse[] = names.map((name, index) => ({
    id: `horse_${String(index + 1).padStart(2, '0')}`,
    name,
    breed: breeds[index],
    color: colors[index],
    condition: DEFAULT_HORSE_CONDITION,
  }));

  const rounds: Round[] = TRACKS.map((track, index) => {
    const pickedHorses = pickUnique(horses, HORSES_PER_ROUND);
    return {
      id: `round_${String(index + 1).padStart(2, '0')}`,
      status: 'new',
      track,
      horses: pickedHorses.map((horse) => horse.id),
      results: [],
      conditionApplied: false,
    };
  });

  const now = Date.now();

  return {
    id: baseRaceId,
    status: 'in_progress',
    horses,
    rounds,
    activeRoundId: null,
    activeRoundStatus: null,
    runtime: null,
    createdAtMs: now,
    updatedAtMs: now,
  };
}

export function getRoundHorseTimeMap(round: Round, race: Race): Record<string, number> {
  const result: Record<string, number> = {};

  for (const horseId of round.horses) {
    const horse = race.horses.find((candidate) => candidate.id === horseId);
    if (!horse) {
      continue;
    }
    const speed = calculateHorseSpeed(horse.breed.baseSpeed, horse.condition);
    result[horseId] = calculateRoundTimeMs(round.track.distance, speed);
  }

  return result;
}

export function getNextRound(race: Race): Round | null {
  return race.rounds.find((round) => round.status !== 'completed') ?? null;
}

export function applyConditionDeltaForRound(race: Race, roundId: string): ConditionDelta[] {
  const round = race.rounds.find((candidate) => candidate.id === roundId);
  if (!round || round.conditionApplied === true) {
    return [];
  }

  const horsesInRound = new Set(round.horses);
  const deltas: ConditionDelta[] = [];

  race.horses = race.horses.map((horse) => {
    const delta = horsesInRound.has(horse.id) ? -CONDITION_STEP : CONDITION_STEP;
    const nextValue = clampCondition(horse.condition + delta);
    const appliedDelta = nextValue - horse.condition;
    deltas.push({ horseId: horse.id, delta: appliedDelta });
    return {
      ...horse,
      condition: nextValue,
    };
  });

  round.conditionApplied = true;
  race.updatedAtMs = Date.now();

  return deltas;
}

export function hasIncompleteRounds(race: Race): boolean {
  return race.rounds.some((round) => round.status !== 'completed');
}

export function markRaceCompletedIfFinished(race: Race): void {
  if (!hasIncompleteRounds(race)) {
    race.status = 'completed';
  }
}
