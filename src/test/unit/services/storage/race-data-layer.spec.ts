import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRaceDataLayer } from '@/services/storage/data-layer';
import { generateRace } from '@/utils/race-engine';

const localActiveRepository = {
  getActiveRace: vi.fn(),
  saveActiveRace: vi.fn(),
};

const indexedCompletedRepository = {
  getCompletedRaceById: vi.fn(),
  saveCompletedRace: vi.fn(),
  listCompletedRaces: vi.fn(),
};

const localCompletedRepository = {
  getCompletedRaceById: vi.fn(),
  saveCompletedRace: vi.fn(),
  listCompletedRaces: vi.fn(),
};

const supportFlags = vi.hoisted(() => ({
  activeLocalStorage: true,
  completedIndexedDb: true,
  completedLocalStorage: true,
}));

vi.mock('@/services/storage/local-storage-active-race-repository', () => ({
  createLocalStorageActiveRaceRepository: () => localActiveRepository,
  isLocalStorageActiveRaceRepositorySupported: () => supportFlags.activeLocalStorage,
}));

vi.mock('@/services/storage/indexeddb-completed-race-repository', () => ({
  createIndexedDbCompletedRaceRepository: () => indexedCompletedRepository,
  isIndexedDbCompletedRaceRepositorySupported: () => supportFlags.completedIndexedDb,
}));

vi.mock('@/services/storage/local-storage-completed-race-repository', () => ({
  createLocalStorageCompletedRaceRepository: () => localCompletedRepository,
  isLocalStorageCompletedRaceRepositorySupported: () => supportFlags.completedLocalStorage,
}));

describe('race data layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supportFlags.activeLocalStorage = true;
    supportFlags.completedIndexedDb = true;
    supportFlags.completedLocalStorage = true;
  });

  it('uses indexedDB completed repository by default when supported', async () => {
    const dataLayer = createRaceDataLayer();
    const race = generateRace('20260217_110000');
    race.status = 'completed';

    await dataLayer.completedRaceRepository.saveCompletedRace(race);
    expect(indexedCompletedRepository.saveCompletedRace).toHaveBeenCalledWith(race);
    expect(localCompletedRepository.saveCompletedRace).not.toHaveBeenCalled();
  });

  it('falls back to localStorage completed repository only when primary is unsupported', async () => {
    supportFlags.completedIndexedDb = false;

    const dataLayer = createRaceDataLayer({
      completedRaceRepository: 'indexeddb',
      completedRaceFallbackRepository: 'localstorage',
    });

    await dataLayer.completedRaceRepository.listCompletedRaces();
    expect(localCompletedRepository.listCompletedRaces).toHaveBeenCalledTimes(1);
    expect(indexedCompletedRepository.listCompletedRaces).not.toHaveBeenCalled();
  });

  it('throws when neither selected repository nor fallback are supported', () => {
    supportFlags.completedIndexedDb = false;
    supportFlags.completedLocalStorage = false;

    expect(() =>
      createRaceDataLayer({
        completedRaceRepository: 'indexeddb',
        completedRaceFallbackRepository: 'localstorage',
      }),
    ).toThrow('not supported');
  });
});
