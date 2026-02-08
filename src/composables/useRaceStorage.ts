import { watchDebounced } from '@vueuse/core';
import { onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import { useRaceDataLayer } from './useRaceDataLayer';
import type { Race, RaceSummary } from '@/types/race';

export interface LoadedRaceResult {
  race: Race | null;
  source: 'active' | 'completed' | 'none';
}

export function useRaceStorage() {
  const { activeRaceRepository, completedRaceRepository } = useRaceDataLayer();
  let stopSync: (() => void) | null = null;

  async function loadRaceById(id: string): Promise<LoadedRaceResult> {
    const active = await activeRaceRepository.getActiveRace();
    if (active?.id === id) {
      return { race: active, source: 'active' };
    }

    const completed = await completedRaceRepository.getCompletedRaceById(id);
    if (completed) {
      return { race: completed, source: 'completed' };
    }

    return { race: null, source: 'none' };
  }

  async function getActiveRace(): Promise<Race | null> {
    return activeRaceRepository.getActiveRace();
  }

  async function saveActiveRace(race: Race | null): Promise<void> {
    await activeRaceRepository.saveActiveRace(race);
  }

  async function saveCompletedRace(race: Race): Promise<void> {
    await completedRaceRepository.saveCompletedRace(race);
  }

  async function getCompletedRaceById(id: string): Promise<Race | null> {
    return completedRaceRepository.getCompletedRaceById(id);
  }

  async function clearActiveRace(): Promise<void> {
    await activeRaceRepository.saveActiveRace(null);
  }

  async function listCompletedRaces(): Promise<RaceSummary[]> {
    return completedRaceRepository.listCompletedRaces();
  }

  function attachAutoSave(raceRef: Ref<Race | null>): void {
    stopSync?.();

    stopSync = watchDebounced(
      raceRef,
      (value) => {
        void activeRaceRepository.saveActiveRace(value);
      },
      {
        debounce: 250,
        maxWait: 1000,
        deep: true,
      },
    );
  }

  function detachAutoSave(): void {
    stopSync?.();
    stopSync = null;
  }

  onBeforeUnmount(() => {
    detachAutoSave();
  });

  return {
    attachAutoSave,
    clearActiveRace,
    detachAutoSave,
    getActiveRace,
    getCompletedRaceById,
    listCompletedRaces,
    loadRaceById,
    saveActiveRace,
    saveCompletedRace,
  };
}
