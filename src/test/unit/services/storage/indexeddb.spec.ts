import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '@/constants/game';
import { getCompletedRaceByIdFromDb, listCompletedRaceSummariesFromDb, saveCompletedRaceToDb } from '@/services/storage/indexeddb';
import { generateRace } from '@/utils/race-engine';

interface FakeRequest<T = unknown> {
  error: Error | null;
  onerror: ((event: Event) => void) | null;
  onsuccess: ((event: Event) => void) | null;
  onupgradeneeded?: ((event: Event) => void) | null;
  result: T;
}

function createRequest<T>(result: T): FakeRequest<T> {
  return {
    error: null,
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
    result,
  };
}

describe('indexeddb adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates object store on upgrade and writes cloned race payload', async () => {
    let persistedRace: unknown;

    const store = {
      put: vi.fn((race: unknown) => {
        persistedRace = race;
        const request = createRequest(undefined);
        queueMicrotask(() => request.onsuccess?.(new Event('success')));
        return request;
      }),
    };

    const tx = {
      error: null,
      objectStore: vi.fn(() => store),
      oncomplete: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };

    const createObjectStore = vi.fn();
    const db = {
      close: vi.fn(),
      createObjectStore,
      objectStoreNames: {
        contains: vi.fn(() => false),
      },
      transaction: vi.fn(() => tx),
    };

    const open = vi.fn(() => {
      const request = createRequest(db);
      queueMicrotask(() => {
        request.onupgradeneeded?.(new Event('upgradeneeded'));
        request.onsuccess?.(new Event('success'));
      });
      return request;
    });

    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: { open },
    });

    const race = generateRace('20260218_130000');
    await saveCompletedRaceToDb(race);

    expect(open).toHaveBeenCalledWith(STORAGE_KEYS.dbName, 1);
    expect(createObjectStore).toHaveBeenCalledWith(STORAGE_KEYS.completedRaceStore, { keyPath: 'id' });
    expect(store.put).toHaveBeenCalledTimes(1);
    expect(persistedRace).toEqual(race);
    expect(persistedRace).not.toBe(race);
  });

  it('reads race by id and lists summaries sorted by updatedAtMs desc', async () => {
    const older = generateRace('20260218_130001');
    const newer = generateRace('20260218_130002');
    older.status = 'completed';
    older.updatedAtMs = 100;
    newer.status = 'completed';
    newer.updatedAtMs = 200;

    const store = {
      get: vi.fn((id: string) => {
        const request = createRequest(id === newer.id ? newer : undefined);
        queueMicrotask(() => request.onsuccess?.(new Event('success')));
        return request;
      }),
      getAll: vi.fn(() => {
        const request = createRequest([older, newer]);
        queueMicrotask(() => request.onsuccess?.(new Event('success')));
        return request;
      }),
    };

    const tx = {
      error: null,
      objectStore: vi.fn(() => store),
      oncomplete: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };

    const db = {
      close: vi.fn(),
      createObjectStore: vi.fn(),
      objectStoreNames: {
        contains: vi.fn(() => true),
      },
      transaction: vi.fn(() => tx),
    };

    const open = vi.fn(() => {
      const request = createRequest(db);
      queueMicrotask(() => request.onsuccess?.(new Event('success')));
      return request;
    });

    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: { open },
    });

    expect(await getCompletedRaceByIdFromDb(newer.id)).toEqual(newer);
    expect(await getCompletedRaceByIdFromDb('missing')).toBeNull();

    const summaries = await listCompletedRaceSummariesFromDb();
    expect(summaries.map((item) => item.id)).toEqual([newer.id, older.id]);
  });

  it('rejects when indexedDB open fails', async () => {
    const open = vi.fn(() => {
      const request = createRequest(undefined);
      request.error = new Error('Open failed');
      queueMicrotask(() => request.onerror?.(new Event('error')));
      return request;
    });

    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: { open },
    });

    await expect(listCompletedRaceSummariesFromDb()).rejects.toThrow('Open failed');
  });
});
