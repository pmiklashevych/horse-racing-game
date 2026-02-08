import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import AppButton from '@/components/common/AppButton.vue';

describe('AppButton', () => {
  it('renders with primary defaults and slot content', () => {
    const wrapper = mount(AppButton, {
      slots: {
        default: 'Start',
      },
    });

    const button = wrapper.get('button');

    expect(button.text()).toBe('Start');
    expect(button.classes()).toContain('btn');
    expect(button.classes()).toContain('btn-primary');
    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('applies light, block, disabled and forwards native attributes', () => {
    const wrapper = mount(AppButton, {
      props: {
        variant: 'light',
        block: true,
        disabled: true,
        type: 'submit',
      },
      attrs: {
        id: 'results-back',
        tabindex: '0',
      },
    });

    const button = wrapper.get('button');

    expect(button.classes()).toContain('btn-light');
    expect(button.classes()).toContain('btn-block');
    expect(button.attributes('disabled')).toBeDefined();
    expect(button.attributes('type')).toBe('submit');
    expect(button.attributes('id')).toBe('results-back');
    expect(button.attributes('tabindex')).toBe('0');
  });

  it('exposes focus, click and getElement helpers', () => {
    const wrapper = mount(AppButton, {
      attachTo: document.body,
    });
    const buttonElement = wrapper.get('button').element as HTMLButtonElement;
    const exposed = wrapper.vm.$.exposed as {
      focus: () => void;
      click: () => void;
      getElement: () => HTMLButtonElement | null;
    };

    const clickSpy = vi.fn();
    buttonElement.addEventListener('click', clickSpy);

    exposed.focus();
    expect(document.activeElement).toBe(buttonElement);

    exposed.click();
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(exposed.getElement()).toBe(buttonElement);

    wrapper.unmount();
  });
});
