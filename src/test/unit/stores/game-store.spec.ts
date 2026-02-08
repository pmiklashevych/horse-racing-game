import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/stores/game-store';
import { generateRace } from '@/utils/race-engine';

describe('game store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts, pauses and resumes rounds', () => {
    const store = useGameStore();
    const race = store.createRace('20260218_120000');

    expect(store.canStartRound).toBe(true);
    const startedRound = store.startNextRound();

    expect(startedRound).not.toBeNull();
    expect(race.activeRoundId).toBe(startedRound?.id);
    expect(race.activeRoundStatus).toBe('in_progress');
    expect(race.runtime?.paused).toBe(false);

    store.pauseRound();
    expect(race.runtime?.paused).toBe(true);
    expect(race.runtime?.startedAtMs).toBeNull();

    store.resumeRound();
    expect(race.runtime?.paused).toBe(false);
    expect(race.runtime?.startedAtMs).not.toBeNull();
  });

  it('records horse finishes sorted by time and without duplicates', () => {
    const store = useGameStore();
    const race = store.createRace('20260218_120001');
    const startedRound = store.startNextRound();

    if (!startedRound) {
      throw new Error('Round should exist');
    }

    const [firstHorse, secondHorse] = startedRound.horses;
    if (!firstHorse || !secondHorse) {
      throw new Error('Round horses should exist');
    }

    store.recordHorseFinish(firstHorse, 3300);
    store.recordHorseFinish(secondHorse, 3100);
    store.recordHorseFinish(firstHorse, 2000);

    const results = store.currentRound?.results ?? [];
    expect(results.map((item) => item.horseId)).toEqual([secondHorse, firstHorse]);
    expect(results.map((item) => item.timeMs)).toEqual([3100, 3300]);
    expect(race.runtime?.finishedHorseIds).toEqual([firstHorse, secondHorse]);
  });

  it('hydrates in-progress race as paused and applies condition deltas when returning to lobby', () => {
    const store = useGameStore();
    const race = generateRace('20260218_120002');

    const firstRound = race.rounds[0];
    if (!firstRound) {
      throw new Error('Expected first round');
    }

    firstRound.status = 'in_progress';
    race.activeRoundId = firstRound.id;
    race.activeRoundStatus = 'in_progress';
    race.runtime = {
      roundId: firstRound.id,
      elapsedMs: 1400,
      paused: false,
      startedAtMs: Date.now(),
      finishedHorseIds: [],
    };

    store.hydrateLoadedRace(race);

    expect(store.isRoundPaused).toBe(true);
    expect(store.race?.runtime?.startedAtMs).toBeNull();

    const deltas = store.backToLobbyAndApplyCondition();
    expect(Object.keys(deltas)).toHaveLength(race.horses.length);
    expect(store.race?.activeRoundId).toBeNull();
    expect(store.race?.runtime).toBeNull();

    const consumed = store.consumeConditionDeltas();
    expect(Object.keys(consumed)).toHaveLength(race.horses.length);
    expect(store.consumeConditionDeltas()).toEqual({});
  });

  it('marks race as completed after all rounds are finished', () => {
    const store = useGameStore();
    store.createRace('20260218_120003');

    for (let index = 0; index < 6; index += 1) {
      const startedRound = store.startNextRound();
      expect(startedRound).not.toBeNull();
      store.finishCurrentRound();
      store.backToLobbyAndApplyCondition();
    }

    expect(store.race?.status).toBe('completed');
    expect(store.completedRoundsCount).toBe(6);
    expect(store.hasRoundsToComplete).toBe(false);
    expect(store.canStartRound).toBe(false);
  });
});
