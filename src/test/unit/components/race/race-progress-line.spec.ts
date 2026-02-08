import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RaceProgressLine from '@/components/race/RaceProgressLine.vue';

describe('RaceProgressLine', () => {
  it('renders title, points count and progressbar aria values', () => {
    const wrapper = mount(RaceProgressLine, {
      props: {
        title: 'Race Progress',
        completed: 2,
        total: 6,
      },
    });

    expect(wrapper.get('h2').text()).toBe('Race Progress');

    const progressbar = wrapper.get('[role="progressbar"]');
    expect(progressbar.attributes('aria-valuemin')).toBe('0');
    expect(progressbar.attributes('aria-valuemax')).toBe('6');
    expect(progressbar.attributes('aria-valuenow')).toBe('2');

    const points = wrapper.findAll('.point');
    expect(points).toHaveLength(6);
    expect(points.map((point) => point.text())).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('marks completed and next points correctly', () => {
    const wrapper = mount(RaceProgressLine, {
      props: {
        title: 'Race Progress',
        completed: 2,
        total: 6,
      },
    });

    const points = wrapper.findAll('.point');
    const completedPoints = wrapper.findAll('.point.completed');
    const nextPoints = wrapper.findAll('.point.next');

    expect(completedPoints).toHaveLength(2);
    expect(nextPoints).toHaveLength(1);
    expect(points[2]?.classes()).toContain('next');
    expect(points[2]?.classes()).not.toContain('completed');
    expect(points[3]?.classes()).not.toContain('next');
    expect(points[3]?.classes()).not.toContain('completed');
  });

  it('does not mark any next point when all rounds are completed', () => {
    const wrapper = mount(RaceProgressLine, {
      props: {
        title: 'Race Progress',
        completed: 6,
        total: 6,
      },
    });

    expect(wrapper.findAll('.point.completed')).toHaveLength(6);
    expect(wrapper.findAll('.point.next')).toHaveLength(0);
  });
});
