import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createIndexedDbCompletedRaceRepository, isIndexedDbCompletedRaceRepositorySupported } from '@/services/storage/indexeddb-completed-race-repository';
import { generateRace } from '@/utils/race-engine';

const indexedDbMocks = vi.hoisted(() => ({
  getById: vi.fn(),
  save: vi.fn(),
  list: vi.fn(),
}));

vi.mock('@/services/storage/indexeddb', () => ({
  getCompletedRaceByIdFromDb: indexedDbMocks.getById,
  saveCompletedRaceToDb: indexedDbMocks.save,
  listCompletedRaceSummariesFromDb: indexedDbMocks.list,
}));

describe('indexedDB completed race repository', () => {
  beforeEach(() => {
    indexedDbMocks.getById.mockReset();
    indexedDbMocks.save.mockReset();
    indexedDbMocks.list.mockReset();
  });

  it('delegates reads and writes to indexedDB adapter', async () => {
    const repository = createIndexedDbCompletedRaceRepository();
    const race = generateRace('20260217_101500');
    race.status = 'completed';

    indexedDbMocks.getById.mockResolvedValue(race);
    indexedDbMocks.list.mockResolvedValue([
      {
        id: race.id,
        status: race.status,
        updatedAtMs: race.updatedAtMs,
      },
    ]);

    await repository.saveCompletedRace(race);
    const loadedRace = await repository.getCompletedRaceById(race.id);
    const summaries = await repository.listCompletedRaces();

    expect(indexedDbMocks.save).toHaveBeenCalledWith(race);
    expect(indexedDbMocks.getById).toHaveBeenCalledWith(race.id);
    expect(indexedDbMocks.list).toHaveBeenCalledTimes(1);
    expect(loadedRace).toEqual(race);
    expect(summaries).toHaveLength(1);
  });

  it('reports support based on indexedDB capability', () => {
    const original = window.indexedDB;

    Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true });
    expect(isIndexedDbCompletedRaceRepositorySupported()).toBe(false);

    Object.defineProperty(window, 'indexedDB', { value: {} as IDBFactory, configurable: true });
    expect(isIndexedDbCompletedRaceRepositorySupported()).toBe(true);

    Object.defineProperty(window, 'indexedDB', { value: original, configurable: true });
  });
});
