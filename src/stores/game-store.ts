import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Race } from '@/types/race';
import type { Round, RoundResultEntry } from '@/types/round';
import { applyConditionDeltaForRound, generateRace, getNextRound, markRaceCompletedIfFinished } from '@/utils/race-engine';

function sortByTime(entries: RoundResultEntry[]): RoundResultEntry[] {
  return [...entries].sort((left, right) => left.timeMs - right.timeMs);
}

export const useGameStore = defineStore('game', () => {
  const race = ref<Race | null>(null);
  const isPreparingData = ref(false);
  const latestConditionDeltas = ref<Record<string, number>>({});

  const currentRound = computed<Round | null>(() => {
    if (!race.value || !race.value.activeRoundId) {
      return null;
    }
    return race.value.rounds.find((item) => item.id === race.value?.activeRoundId) ?? null;
  });

  const nextRound = computed<Round | null>(() => {
    if (!race.value) {
      return null;
    }
    return getNextRound(race.value);
  });

  const completedRoundsCount = computed(() => {
    if (!race.value) {
      return 0;
    }
    return race.value.rounds.filter((round) => round.status === 'completed').length;
  });

  const canStartRound = computed(() => {
    if (!race.value) {
      return false;
    }
    return race.value.status === 'in_progress' && race.value.activeRoundId === null && nextRound.value !== null;
  });

  const isRoundPhase = computed(() => {
    if (!race.value || !race.value.activeRoundId || !race.value.activeRoundStatus) {
      return false;
    }
    return race.value.activeRoundStatus === 'in_progress' || race.value.activeRoundStatus === 'completed';
  });

  const isRoundPaused = computed(() => race.value?.runtime?.paused ?? false);

  const isRaceCompleted = computed(() => race.value?.status === 'completed');

  const hasRoundsToComplete = computed(() => {
    if (!race.value) {
      return false;
    }
    return race.value.rounds.some((round) => round.status !== 'completed');
  });

  function touchRace(): void {
    if (!race.value) {
      return;
    }
    race.value.updatedAtMs = Date.now();
  }

  function setPreparingData(value: boolean): void {
    isPreparingData.value = value;
  }

  function setRace(value: Race | null): void {
    race.value = value;
    latestConditionDeltas.value = {};
  }

  function createRace(raceId: string): Race {
    const freshRace = generateRace(raceId);
    race.value = freshRace;
    latestConditionDeltas.value = {};
    return freshRace;
  }

  function hydrateLoadedRace(value: Race): Race {
    race.value = value;
    latestConditionDeltas.value = {};

    if (race.value.activeRoundId && race.value.activeRoundStatus === 'in_progress' && race.value.runtime) {
      race.value.runtime.paused = true;
      race.value.runtime.startedAtMs = null;
      touchRace();
    }

    return value;
  }

  function startNextRound(): Round | null {
    if (!race.value) {
      return null;
    }

    const targetRound = race.value.rounds.find((round) => round.status === 'new');
    if (!targetRound) {
      return null;
    }

    targetRound.status = 'in_progress';
    race.value.activeRoundId = targetRound.id;
    race.value.activeRoundStatus = 'in_progress';
    race.value.runtime = {
      roundId: targetRound.id,
      elapsedMs: 0,
      paused: false,
      startedAtMs: Date.now(),
      finishedHorseIds: [],
    };
    touchRace();

    return targetRound;
  }

  function resumeRound(): void {
    if (!race.value || !race.value.runtime) {
      return;
    }

    race.value.runtime.paused = false;
    race.value.runtime.startedAtMs = Date.now();
    race.value.activeRoundStatus = 'in_progress';
    touchRace();
  }

  function pauseRound(): void {
    if (!race.value || !race.value.runtime) {
      return;
    }

    race.value.runtime.paused = true;
    race.value.runtime.startedAtMs = null;
    touchRace();
  }

  function setRoundElapsed(elapsedMs: number): void {
    if (!race.value?.runtime) {
      return;
    }

    race.value.runtime.elapsedMs = elapsedMs;
    touchRace();
  }

  function recordHorseFinish(horseId: string, timeMs: number): void {
    if (!race.value) {
      return;
    }

    const round = currentRound.value;
    if (!round) {
      return;
    }

    if (!round.results.some((entry) => entry.horseId === horseId)) {
      round.results = sortByTime([...round.results, { horseId, timeMs }]);
    }

    const runtime = race.value.runtime;
    if (runtime && !runtime.finishedHorseIds.includes(horseId)) {
      runtime.finishedHorseIds.push(horseId);
    }

    touchRace();
  }

  function finishCurrentRound(): void {
    if (!race.value) {
      return;
    }

    const round = currentRound.value;
    if (!round) {
      return;
    }

    round.status = 'completed';
    race.value.activeRoundStatus = 'completed';

    if (race.value.runtime) {
      race.value.runtime.paused = true;
      race.value.runtime.startedAtMs = null;
    }

    markRaceCompletedIfFinished(race.value);
    touchRace();
  }

  function backToLobbyAndApplyCondition(): Record<string, number> {
    if (!race.value) {
      return {};
    }

    const activeRoundId = race.value.activeRoundId;
    race.value.activeRoundId = null;
    race.value.activeRoundStatus = null;
    race.value.runtime = null;

    const deltas: Record<string, number> = {};
    if (activeRoundId) {
      for (const item of applyConditionDeltaForRound(race.value, activeRoundId)) {
        deltas[item.horseId] = item.delta;
      }
    }

    latestConditionDeltas.value = deltas;
    markRaceCompletedIfFinished(race.value);
    touchRace();

    return deltas;
  }

  function consumeConditionDeltas(): Record<string, number> {
    const value = { ...latestConditionDeltas.value };
    latestConditionDeltas.value = {};
    return value;
  }

  return {
    canStartRound,
    completedRoundsCount,
    consumeConditionDeltas,
    createRace,
    currentRound,
    backToLobbyAndApplyCondition,
    finishCurrentRound,
    hasRoundsToComplete,
    hydrateLoadedRace,
    isPreparingData,
    isRaceCompleted,
    isRoundPaused,
    isRoundPhase,
    latestConditionDeltas,
    nextRound,
    pauseRound,
    race,
    recordHorseFinish,
    resumeRound,
    setPreparingData,
    setRace,
    setRoundElapsed,
    startNextRound,
  };
});
