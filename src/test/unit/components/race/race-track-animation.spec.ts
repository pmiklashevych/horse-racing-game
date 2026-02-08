import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RaceTrackAnimation from '@/components/race/RaceTrackAnimation.vue';
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

describe('RaceTrackAnimation', () => {
  it('renders ruler ticks and appends final track distance tick', () => {
    const wrapper = mount(RaceTrackAnimation, {
      props: {
        elapsedLabel: 'Elapsed',
        trackLabel: 'Track 450m',
        elapsedMs: 0,
        trackDistance: 450,
        horses: [createHorse('h1', 'Horse 1', '#cc8800')],
        finishTimes: {},
      },
    });

    const tickTexts = wrapper.findAll('.tick').map((node) => node.text());
    expect(tickTexts).toContain('0m');
    expect(tickTexts).toContain('200m');
    expect(tickTexts).toContain('400m');
    expect(tickTexts).toContain('450m');
  });

  it('maps horse position by elapsed/finish ratio and clamps at 100%', () => {
    const wrapper = mount(RaceTrackAnimation, {
      props: {
        elapsedLabel: 'Elapsed',
        trackLabel: 'Track 1200m',
        elapsedMs: 1500,
        trackDistance: 1200,
        horses: [createHorse('h1', 'Horse 1', '#cc8800'), createHorse('h2', 'Horse 2', '#4488dd')],
        finishTimes: {
          h1: 1000,
          h2: 2000,
        },
      },
    });

    const wrappers = wrapper.findAll('.horse-wrapper');
    expect(wrappers).toHaveLength(2);
    expect(wrappers[0]?.attributes('style')).toContain('translateX(100%)');
    expect(wrappers[1]?.attributes('style')).toContain('translateX(75%)');
  });
});
