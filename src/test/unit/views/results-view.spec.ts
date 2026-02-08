import { createPinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import { messages } from '@/i18n/messages';
import { raceDataLayerKey } from '@/services/storage/injection';
import type { RaceSummary } from '@/types/race';
import ResultsView from '@/views/ResultsView.vue';

function createResults(count: number): RaceSummary[] {
  return Array.from({ length: count }, (_unused, index) => ({
    id: `race_${String(index).padStart(4, '0')}`,
    status: 'completed' as const,
    updatedAtMs: count - index,
  }));
}

describe('ResultsView', () => {
  it('uses virtual list windowing and fixed viewport height for 5 rows', async () => {
    const results = createResults(200);
    const pinia = createPinia();
    const i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages,
    });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div />' } },
        { path: '/results/:id', name: 'results-race', component: { template: '<div />' } },
      ],
    });

    await router.push('/');
    await router.isReady();

    const wrapper = mount(ResultsView, {
      global: {
        plugins: [pinia, i18n, router],
        provide: {
          [raceDataLayerKey as symbol]: {
            activeRaceRepository: {
              getActiveRace: async () => null,
              saveActiveRace: async () => undefined,
            },
            completedRaceRepository: {
              getCompletedRaceById: async () => null,
              listCompletedRaces: async () => results,
              saveCompletedRace: async () => undefined,
            },
          },
        },
      },
    });

    await flushPromises();
    await nextTick();

    const viewport = wrapper.get('.results-viewport');
    expect(viewport.attributes('style')).toContain('height: 280px');

    const initialRows = wrapper.findAll('.result-row');
    expect(initialRows.length).toBeGreaterThan(0);
    expect(initialRows.length).toBeLessThan(results.length);
    expect(wrapper.text()).toContain('race_0000');

    (viewport.element as HTMLElement).scrollTop = 56 * 80;
    await viewport.trigger('scroll');
    await nextTick();

    expect(wrapper.text()).not.toContain('race_0000');
  });
});
