<template>
  <section class="menu panel" @keydown="onKeydown">
    <h1 class="menu-title">{{ title }}</h1>

    <div class="menu-actions">
      <AppButton
        v-for="(item, index) in items"
        :key="item.id"
        :ref="(element) => setButtonRef((element as AppButtonControl | null), index)"
        class="menu-button"
        variant="primary"
        block
        :disabled="item.disabled"
        :tabindex="item.disabled ? -1 : 0"
        @click="item.onSelect"
      >
        {{ item.label }}
      </AppButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import AppButton from '@/components/common/AppButton.vue';

interface AppButtonControl {
  focus: () => void;
  click: () => void;
  getElement: () => HTMLButtonElement | null;
}

export interface MenuItem {
  id: string;
  label: string;
  disabled: boolean;
  onSelect: () => void;
}

const props = defineProps<{
  title: string;
  items: MenuItem[];
}>();

const buttonRefs = ref<Array<AppButtonControl | null>>([]);

function setButtonRef(element: AppButtonControl | null, index: number): void {
  buttonRefs.value[index] = element;
}

function getEnabledButtons(): HTMLButtonElement[] {
  return props.items
    .map((_item, index) => buttonRefs.value[index]?.getElement() ?? null)
    .filter((button): button is HTMLButtonElement => Boolean(button && !button.disabled));
}

function focusFirstEnabled(): void {
  getEnabledButtons()[0]?.focus();
}

function moveFocus(direction: 1 | -1): void {
  const enabledButtons = getEnabledButtons();
  if (enabledButtons.length === 0) {
    return;
  }

  const currentIndex = enabledButtons.findIndex((button) => button === document.activeElement);

  if (currentIndex === -1) {
    enabledButtons[direction > 0 ? 0 : enabledButtons.length - 1]?.focus();
    return;
  }

  const targetIndex = (currentIndex + direction + enabledButtons.length) % enabledButtons.length;
  enabledButtons[targetIndex]?.focus();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) {
    event.preventDefault();
    moveFocus(1);
    return;
  }

  if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) {
    event.preventDefault();
    moveFocus(-1);
    return;
  }

  if (event.key === 'Enter') {
    const activeElement = document.activeElement as HTMLButtonElement | null;
    if (activeElement && !activeElement.disabled) {
      activeElement.click();
    }
  }
}

onMounted(async () => {
  await nextTick();
  focusFirstEnabled();
});

watch(
  () => props.items.map((item) => item.disabled).join('|'),
  async () => {
    await nextTick();
    focusFirstEnabled();
  },
);
</script>

<style scoped>
.menu {
  padding: 24px;
  width: min(520px, 100%);
}

.menu-title {
  margin: 0;
  font-size: clamp(1.8rem, 7vw, 2.7rem);
  text-align: center;
  letter-spacing: 0.08em;
}

.menu-actions {
  margin-top: 20px;
  display: grid;
  gap: 12px;
}

.menu-button {
  width: 100%;
  min-height: 58px;
  font-size: 1.03rem;
}
</style>
