<template>
  <button
    ref="buttonRef"
    class="btn"
    :class="[`btn-${variant}`, { 'btn-block': block }]"
    :type="type"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

type AppButtonVariant = 'primary' | 'light';
type AppButtonType = 'button' | 'submit' | 'reset';

withDefaults(
  defineProps<{
    variant?: AppButtonVariant;
    type?: AppButtonType;
    disabled?: boolean;
    block?: boolean;
  }>(),
  {
    variant: 'primary',
    type: 'button',
    disabled: false,
    block: false,
  },
);

defineOptions({
  inheritAttrs: false,
});

const buttonRef = ref<HTMLButtonElement | null>(null);

function focus(): void {
  buttonRef.value?.focus();
}

function click(): void {
  buttonRef.value?.click();
}

function getElement(): HTMLButtonElement | null {
  return buttonRef.value;
}

defineExpose({
  focus,
  click,
  getElement,
});
</script>

<style scoped>
.btn {
  background: transparent;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  min-height: 60px;
  min-width: 120px;
  padding: 0;
  border-radius: 0;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
  user-select: none;
  -webkit-user-select: none;
  line-height: 100%;
  font-family: 'Figtree', Arial, sans-serif !important;
  font-weight: 500;
  font-style: normal;
  color: #261a28;
  gap: 8px;
  white-space: nowrap;
}

.btn.btn-light {
  padding: 0 16px;
  box-shadow: 0 0 0 1px rgba(38, 26, 40, 0.1);
  background: #fafafa;
  border-radius: 80px;
  font-size: 22px;
  line-height: 100%;
  letter-spacing: 0.2px;
}

.btn.btn-primary {
  padding: 0 16px;
  box-shadow:
    0 -1px 1px 1px rgba(38, 26, 40, 0.1) inset,
    0 1px 1px 1px rgba(239, 235, 228, 0.2) inset,
    0 6px 6px -3px rgba(38, 26, 40, 0.05),
    0 3px 3px -1.5px rgba(38, 26, 40, 0.05),
    0 1px 1px -0.5px rgba(38, 26, 40, 0.05),
    0 0 0 1px rgba(239, 235, 228, 0.1);
  background: linear-gradient(0deg, #e92e2f 0%, #ff6126 100%);
  border-radius: 80px;
  font-size: 22px;
  letter-spacing: 0.2px;
  color: #efebe4;
}

.btn.btn-block {
  width: 100%;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (hover: hover) and (pointer: fine) {
  .btn.btn-light:hover:enabled,
  .btn.btn-primary:hover:enabled {
    border-radius: 12px;
  }
}

@media (hover: none) and (pointer: coarse) {
  .btn:enabled:active {
    border-radius: 12px;
    transform: scale(0.98);
    filter: brightness(0.96);
  }
}
</style>
