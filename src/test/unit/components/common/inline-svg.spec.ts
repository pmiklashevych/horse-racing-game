import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import InlineSVG from '@/components/common/InlineSVG.vue';
import { HORSE_HEAD_ICON, RUNNING_HORSE_ICON } from '@/constants/icons';

describe('InlineSVG', () => {
  it('renders horse head icon definition', () => {
    const wrapper = mount(InlineSVG, {
      props: {
        icon: HORSE_HEAD_ICON,
        size: 30,
      },
    });

    const svg = wrapper.get('svg');
    const group = wrapper.get('g');
    const path = wrapper.get('path');

    expect(svg.attributes('viewBox')).toBe(HORSE_HEAD_ICON.viewBox);
    expect(group.attributes('transform')).toBe(HORSE_HEAD_ICON.gTransform);
    expect(path.attributes('d')?.startsWith('M10630 11425')).toBe(true);
    expect((svg.element as SVGElement).style.width).toBe('30px');
    expect((svg.element as SVGElement).style.height).toBe('30px');
  });

  it('renders running horse icon definition', () => {
    const wrapper = mount(InlineSVG, {
      props: {
        icon: RUNNING_HORSE_ICON,
      },
    });

    const svg = wrapper.get('svg');
    const group = wrapper.get('g');
    const path = wrapper.get('path');

    expect(svg.attributes('viewBox')).toBe(RUNNING_HORSE_ICON.viewBox);
    expect(group.attributes('transform')).toBe(RUNNING_HORSE_ICON.gTransform);
    expect(path.attributes('d')?.startsWith('M10712 10230')).toBe(true);
  });
});
