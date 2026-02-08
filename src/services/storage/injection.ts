import type { InjectionKey } from 'vue';
import type { RaceDataLayer } from '@/types/storage';

export const raceDataLayerKey: InjectionKey<RaceDataLayer> = Symbol('race-data-layer');
