import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import { nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { messages } from '@/i18n/messages';
import { raceDataLayerKey } from '@/services/storage/injection';
import { useGameStore } from '@/stores/game-store';
import type { Race } from '@/types/race';
import { generateRace } from '@/utils/race-engine';
import RaceView from '@/views/RaceView.vue';

async function flushUpdates(): Promise<void> {
  await Promise.resolve();
  await nextTick();
}

function createRouterForRaceViews() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/results', name: 'results', component: { template: '<div />' } },
      { path: '/race/:id', name: 'race', component: RaceView },
      { path: '/results/:id', name: 'results-race', component: RaceView },
    ],
  });
}

describe('RaceView orchestration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads completed race directly in results mode and returns to results on back', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const i18n = createI18n({ legacy: false, locale: 'en', messages });
    const router = createRouterForRaceViews();

    const completedRace = generateRace('race_results_1');
    completedRace.status = 'completed';
    completedRace.activeRoundId = null;
    completedRace.activeRoundStatus = null;
    completedRace.runtime = null;

    const activeRepository = {
      getActiveRace: vi.fn(async () => null),
      saveActiveRace: vi.fn(async () => undefined),
    };
    const completedRepository = {
      getCompletedRaceById: vi.fn(async () => completedRace),
      listCompletedRaces: vi.fn(async () => []),
      saveCompletedRace: vi.fn(async () => undefined),
    };

    await router.push(`/results/${completedRace.id}`);
    await router.isReady();

    const wrapper = mount(RaceView, {
      global: {
        plugins: [pinia, i18n, router],
        provide: {
          [raceDataLayerKey as symbol]: {
            activeRaceRepository: activeRepository,
            completedRaceRepository: completedRepository,
          },
        },
        stubs: {
          LoadingSplash: { template: '<div class="loading-splash-stub" />' },
        },
      },
      attachTo: document.body,
    });

    await vi.runAllTimersAsync();
    await flushUpdates();

    expect(completedRepository.getCompletedRaceById).toHaveBeenCalledWith(completedRace.id);
    expect(activeRepository.getActiveRace).not.toHaveBeenCalled();

    const backButton = wrapper.find('.header-back-button');
    expect(backButton.exists()).toBe(true);
    await backButton.trigger('click');
    await vi.runAllTimersAsync();
    await flushUpdates();

    expect(router.currentRoute.value.name).toBe('results');

    wrapper.unmount();
  });

  it('persists completed race and clears active race in normal mode', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const i18n = createI18n({ legacy: false, locale: 'en', messages });
    const router = createRouterForRaceViews();

    const activeRace = generateRace('race_active_1');
    activeRace.status = 'in_progress';

    const activeRepository = {
      getActiveRace: vi.fn(async () => activeRace),
      saveActiveRace: vi.fn(async () => undefined),
    };
    const completedRepository = {
      getCompletedRaceById: vi.fn(async () => null),
      listCompletedRaces: vi.fn(async () => []),
      saveCompletedRace: vi.fn(async () => undefined),
    };

    await router.push(`/race/${activeRace.id}`);
    await router.isReady();

    const wrapper = mount(RaceView, {
      global: {
        plugins: [pinia, i18n, router],
        provide: {
          [raceDataLayerKey as symbol]: {
            activeRaceRepository: activeRepository,
            completedRaceRepository: completedRepository,
          },
        },
        stubs: {
          LoadingSplash: { template: '<div class="loading-splash-stub" />' },
        },
      },
      attachTo: document.body,
    });

    await vi.runAllTimersAsync();
    await flushUpdates();

    const store = useGameStore();
    expect(store.race?.id).toBe(activeRace.id);

    (store.race as Race).status = 'completed';
    (store.race as Race).activeRoundId = null;
    (store.race as Race).activeRoundStatus = null;
    (store.race as Race).runtime = null;

    await flushUpdates();
    await flushUpdates();

    expect(completedRepository.saveCompletedRace).toHaveBeenCalledWith(expect.objectContaining({ id: activeRace.id }));
    expect(
      (activeRepository.saveActiveRace as ReturnType<typeof vi.fn>).mock.calls.some((call) => call[0] === null),
    ).toBe(true);

    wrapper.unmount();
  });
});
