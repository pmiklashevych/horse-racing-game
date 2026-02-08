import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { useRaceStorage } from '@/composables/useRaceStorage';
import { raceDataLayerKey } from '@/services/storage/injection';
import { generateRace } from '@/utils/race-engine';

describe('useRaceStorage', () => {
  it('loads active race first and then falls back to completed races', async () => {
    const activeRace = generateRace('20260217_130000');
    const completedRace = generateRace('20260217_120000');
    completedRace.status = 'completed';

    const activeRaceRepository = {
      getActiveRace: vi.fn().mockResolvedValue(activeRace),
      saveActiveRace: vi.fn().mockResolvedValue(undefined),
    };

    const completedRaceRepository = {
      getCompletedRaceById: vi.fn().mockResolvedValue(completedRace),
      saveCompletedRace: vi.fn().mockResolvedValue(undefined),
      listCompletedRaces: vi.fn().mockResolvedValue([]),
    };

    const Harness = defineComponent({
      setup() {
        return { raceStorage: useRaceStorage() };
      },
      template: '<div />',
    });

    const wrapper = mount(Harness, {
      global: {
        provide: {
          [raceDataLayerKey as symbol]: {
            activeRaceRepository,
            completedRaceRepository,
          },
        },
      },
    });

    const vm = wrapper.vm as unknown as {
      raceStorage: ReturnType<typeof useRaceStorage>;
    };

    const activeResult = await vm.raceStorage.loadRaceById(activeRace.id);
    expect(activeResult.source).toBe('active');
    expect(completedRaceRepository.getCompletedRaceById).not.toHaveBeenCalled();

    activeRaceRepository.getActiveRace.mockResolvedValue(null);
    const completedResult = await vm.raceStorage.loadRaceById(completedRace.id);
    expect(completedResult.source).toBe('completed');
    expect(completedRaceRepository.getCompletedRaceById).toHaveBeenCalledWith(completedRace.id);
  });
});
