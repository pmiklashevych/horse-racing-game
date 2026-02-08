import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '@/constants/game';
import { createLocalStorageCompletedRaceRepository } from '@/services/storage/local-storage-completed-race-repository';
import { generateRace } from '@/utils/race-engine';

describe('localStorage completed race repository', () => {
  it('stores completed races, updates existing records and lists summaries in desc order', async () => {
    const repository = createLocalStorageCompletedRaceRepository();
    const olderRace = generateRace('20260217_090000');
    const newerRace = generateRace('20260217_120000');

    olderRace.status = 'completed';
    olderRace.updatedAtMs = 100;
    newerRace.status = 'completed';
    newerRace.updatedAtMs = 200;

    await repository.saveCompletedRace(olderRace);
    await repository.saveCompletedRace(newerRace);

    const updatedOlderRace = { ...olderRace, updatedAtMs: 300 };
    await repository.saveCompletedRace(updatedOlderRace);

    expect(await repository.getCompletedRaceById(olderRace.id)).toEqual(updatedOlderRace);
    expect(await repository.getCompletedRaceById('missing-race')).toBeNull();

    const summaries = await repository.listCompletedRaces();
    expect(summaries.map((item) => item.id)).toEqual([olderRace.id, newerRace.id]);
    expect(summaries.map((item) => item.updatedAtMs)).toEqual([300, 200]);
  });

  it('returns empty list for malformed payload', async () => {
    const repository = createLocalStorageCompletedRaceRepository();
    localStorage.setItem(STORAGE_KEYS.completedRacesLocalStorage, '{bad-json');

    expect(await repository.listCompletedRaces()).toEqual([]);
  });
});
