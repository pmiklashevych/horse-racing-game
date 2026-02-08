import { STORAGE_KEYS } from '@/constants/game';
import type { Race, RaceSummary } from '@/types/race';

const DB_VERSION = 1;

function toPersistableRace(race: Race): Race {
  return JSON.parse(JSON.stringify(race)) as Race;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(STORAGE_KEYS.dbName, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORAGE_KEYS.completedRaceStore)) {
        db.createObjectStore(STORAGE_KEYS.completedRaceStore, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open indexedDB'));
  });
}

function withTransaction<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORAGE_KEYS.completedRaceStore, mode);
        const store = tx.objectStore(STORAGE_KEYS.completedRaceStore);

        tx.oncomplete = () => db.close();
        tx.onerror = () => reject(tx.error ?? new Error('indexedDB transaction failed'));

        handler(store, resolve, reject);
      }),
  );
}

export function saveCompletedRaceToDb(race: Race): Promise<void> {
  return withTransaction<void>('readwrite', (store, resolve, reject) => {
    const request = store.put(toPersistableRace(race));
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Failed to store race result'));
  });
}

export function getCompletedRaceByIdFromDb(id: string): Promise<Race | null> {
  return withTransaction<Race | null>('readonly', (store, resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve((request.result as Race | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error('Failed to read race result'));
  });
}

export function listCompletedRaceSummariesFromDb(): Promise<RaceSummary[]> {
  return withTransaction<RaceSummary[]>('readonly', (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const races = (request.result as Race[]).map((race) => ({
        id: race.id,
        status: race.status,
        updatedAtMs: race.updatedAtMs,
      }));
      races.sort((left, right) => right.updatedAtMs - left.updatedAtMs);
      resolve(races);
    };
    request.onerror = () => reject(request.error ?? new Error('Failed to list race results'));
  });
}
