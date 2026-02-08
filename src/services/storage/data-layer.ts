import type {
  ActiveRaceRepository,
  ActiveRaceRepositoryType,
  CompletedRaceRepository,
  CompletedRaceRepositoryType,
  RaceDataLayer,
  RaceStorageOptions,
} from '@/types/storage';
import {
  createLocalStorageActiveRaceRepository,
  isLocalStorageActiveRaceRepositorySupported,
} from './local-storage-active-race-repository';
import {
  createLocalStorageCompletedRaceRepository,
  isLocalStorageCompletedRaceRepositorySupported,
} from './local-storage-completed-race-repository';
import {
  createIndexedDbCompletedRaceRepository,
  isIndexedDbCompletedRaceRepositorySupported,
} from './indexeddb-completed-race-repository';

interface ActiveRaceRepositoryDefinition {
  create: () => ActiveRaceRepository;
  isSupported: () => boolean;
}

interface CompletedRaceRepositoryDefinition {
  create: () => CompletedRaceRepository;
  isSupported: () => boolean;
}

const activeRepositoryDefinitions: Record<ActiveRaceRepositoryType, ActiveRaceRepositoryDefinition> = {
  localstorage: {
    create: createLocalStorageActiveRaceRepository,
    isSupported: isLocalStorageActiveRaceRepositorySupported,
  },
};

const completedRepositoryDefinitions: Record<CompletedRaceRepositoryType, CompletedRaceRepositoryDefinition> = {
  indexeddb: {
    create: createIndexedDbCompletedRaceRepository,
    isSupported: isIndexedDbCompletedRaceRepositorySupported,
  },
  localstorage: {
    create: createLocalStorageCompletedRaceRepository,
    isSupported: isLocalStorageCompletedRaceRepositorySupported,
  },
};

function resolveActiveRaceRepository(type: ActiveRaceRepositoryType): ActiveRaceRepository {
  const definition = activeRepositoryDefinitions[type];

  if (definition.isSupported()) {
    return definition.create();
  }

  throw new Error(`ActiveRaceRepository "${type}" is not supported in this environment.`);
}

function resolveCompletedRaceRepository(
  primaryType: CompletedRaceRepositoryType,
  fallbackType: CompletedRaceRepositoryType | null,
): CompletedRaceRepository {
  const primary = completedRepositoryDefinitions[primaryType];
  if (primary.isSupported()) {
    return primary.create();
  }

  if (!fallbackType) {
    throw new Error(`CompletedRaceRepository "${primaryType}" is not supported in this environment.`);
  }

  const fallback = completedRepositoryDefinitions[fallbackType];
  if (fallback.isSupported()) {
    return fallback.create();
  }

  throw new Error(
    `CompletedRaceRepository "${primaryType}" is not supported and fallback "${fallbackType}" is not available.`,
  );
}

export function createRaceDataLayer(options: RaceStorageOptions = {}): RaceDataLayer {
  const activeType = options.activeRaceRepository ?? 'localstorage';
  const completedPrimaryType = options.completedRaceRepository ?? 'indexeddb';
  const completedFallbackType = options.completedRaceFallbackRepository ?? 'localstorage';

  return {
    activeRaceRepository: resolveActiveRaceRepository(activeType),
    completedRaceRepository: resolveCompletedRaceRepository(completedPrimaryType, completedFallbackType),
  };
}
