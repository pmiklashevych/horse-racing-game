import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '@/constants/game';
import { createLocalStorageActiveRaceRepository } from '@/services/storage/local-storage-active-race-repository';
import { generateRace } from '@/utils/race-engine';

describe('localStorage active race repository', () => {
  it('saves, reads and clears active race', async () => {
    const repository = createLocalStorageActiveRaceRepository();
    const race = generateRace('20260217_101010');

    await repository.saveActiveRace(race);
    expect(await repository.getActiveRace()).toEqual(race);

    await repository.saveActiveRace(null);
    expect(localStorage.getItem(STORAGE_KEYS.activeRace)).toBeNull();
    expect(await repository.getActiveRace()).toBeNull();
  });

  it('returns null for malformed payload', async () => {
    const repository = createLocalStorageActiveRaceRepository();
    localStorage.setItem(STORAGE_KEYS.activeRace, '{bad-json');

    expect(await repository.getActiveRace()).toBeNull();
  });
});
