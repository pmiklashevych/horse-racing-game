import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import HorseIcon from '@/components/common/HorseIcon.vue';
import RoundResultsTable from '@/components/race/RoundResultsTable.vue';
import type { Horse } from '@/types/horse';

function createHorse(id: string, name: string, color: string): Horse {
  return {
    id,
    name,
    breed: {
      id: `breed-${id}`,
      name: `Breed ${id}`,
      baseSpeed: 16.5,
    },
    color: {
      id: `color-${id}`,
      name: `Color ${id}`,
      value: color,
    },
    condition: 80,
  };
}

describe('RoundResultsTable', () => {
  it('sorts finished entries and appends pending + placeholder rows', () => {
    const horseMap = {
      h1: createHorse('h1', 'Horse 1', '#cc8800'),
      h2: createHorse('h2', 'Horse 2', '#4488dd'),
      h3: createHorse('h3', 'Horse 3', '#44aa55'),
    };

    const wrapper = mount(RoundResultsTable, {
      props: {
        title: 'Round 1',
        labels: {
          position: '#',
          horse: 'Horse',
          time: 'Time',
        },
        entries: [
          { horseId: 'h2', timeMs: 2000 },
          { horseId: 'h1', timeMs: 1000 },
        ],
        horseIds: ['h1', 'h2', 'h3'],
        totalHorses: 5,
        horseMap,
        notPosition: '--',
        notTime: '--:--:---',
      },
      global: {
        stubs: {
          TransitionGroup: false,
        },
      },
    });

    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(5);
    expect(rows[0]?.text()).toContain('Horse 1');
    expect(rows[1]?.text()).toContain('Horse 2');
    expect(rows[2]?.text()).toContain('Horse 3');
    expect(rows[2]?.text()).toContain('--:--:---');
    expect(rows[3]?.text()).toContain('--');
    expect(rows[4]?.text()).toContain('--');
  });

  it('uses smaller horse icon size in dense mode', () => {
    const wrapper = mount(RoundResultsTable, {
      props: {
        title: 'Round 1',
        labels: {
          position: '#',
          horse: 'Horse',
          time: 'Time',
        },
        entries: [{ horseId: 'h1', timeMs: 1000 }],
        horseMap: {
          h1: createHorse('h1', 'Horse 1', '#cc8800'),
        },
        notPosition: '--',
        notTime: '--:--:---',
        dense: true,
      },
      global: {
        stubs: {
          TransitionGroup: false,
        },
      },
    });

    const horseIcon = wrapper.findComponent(HorseIcon);
    expect(horseIcon.props('iconSize')).toBe(12);
    expect(wrapper.classes()).toContain('dense');
  });
});
