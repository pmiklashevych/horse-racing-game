import { describe, expect, it } from 'vitest';
import { DEFAULT_HORSE_CONDITION, TRACKS } from '@/constants/game';
import { applyConditionDeltaForRound, calculateHorseSpeed, generateRace } from '@/utils/race-engine';

describe('race engine', () => {
  it('generates 20 unique horses with schedule of 6 rounds and 10 horses per round', () => {
    const race = generateRace('20260208_211718');

    expect(race.horses).toHaveLength(20);
    expect(race.rounds).toHaveLength(6);

    const uniqueNames = new Set(race.horses.map((horse) => horse.name));
    const uniqueColors = new Set(race.horses.map((horse) => horse.color.id));
    const uniqueBreeds = new Set(race.horses.map((horse) => horse.breed.id));

    expect(uniqueNames.size).toBe(20);
    expect(uniqueColors.size).toBe(20);
    expect(uniqueBreeds.size).toBe(20);

    for (const horse of race.horses) {
      expect(horse.condition).toBe(DEFAULT_HORSE_CONDITION);
    }

    for (const [index, round] of race.rounds.entries()) {
      expect(round.track.distance).toBe(TRACKS[index]?.distance);
      expect(round.horses).toHaveLength(10);
      expect(new Set(round.horses).size).toBe(10);
      expect(round.horses.every((horseId) => race.horses.some((horse) => horse.id === horseId))).toBe(true);
    }
  });

  it('calculates horse speed with condition impact', () => {
    expect(calculateHorseSpeed(16.5, 80)).toBeCloseTo(16.3, 6);
    expect(calculateHorseSpeed(17.0, 100)).toBeCloseTo(17.0, 6);
  });

  it('applies +5/-5 condition deltas and clamps values between 5 and 100', () => {
    const race = generateRace('20260208_211719');
    const targetRound = race.rounds[0];

    const firstRoundHorses = new Set(targetRound?.horses ?? []);

    if (!targetRound) {
      throw new Error('Round not generated');
    }

    const deltas = applyConditionDeltaForRound(race, targetRound.id);
    expect(deltas).toHaveLength(20);

    for (const horse of race.horses) {
      const deltaEntry = deltas.find((entry) => entry.horseId === horse.id);
      expect(deltaEntry).toBeDefined();

      if (firstRoundHorses.has(horse.id)) {
        expect(horse.condition).toBe(DEFAULT_HORSE_CONDITION - 5);
      } else {
        expect(horse.condition).toBe(DEFAULT_HORSE_CONDITION + 5);
      }

      expect(horse.condition).toBeGreaterThanOrEqual(5);
      expect(horse.condition).toBeLessThanOrEqual(100);
    }

    const deltasSecondRun = applyConditionDeltaForRound(race, targetRound.id);
    expect(deltasSecondRun).toHaveLength(0);
  });
});
