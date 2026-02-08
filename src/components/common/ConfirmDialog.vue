<template>
  <div v-if="open" class="dialog-overlay" role="dialog" aria-modal="true" :aria-labelledby="titleId">
    <div class="dialog-card panel">
      <h2 :id="titleId" class="dialog-title">{{ title }}</h2>
      <p class="dialog-body">{{ body }}</p>
      <div class="dialog-actions">
        <AppButton ref="confirmButtonRef" variant="primary" @click="$emit('confirm')">
          {{ confirmLabel }}
        </AppButton>
        <AppButton variant="light" @click="$emit('cancel')">
          {{ cancelLabel }}
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import AppButton from '@/components/common/AppButton.vue';

interface AppButtonControl {
  focus: () => void;
}

const props = defineProps<{
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
}>();

defineEmits<{
  cancel: [];
  confirm: [];
}>();

const confirmButtonRef = ref<AppButtonControl | null>(null);
const titleId = computed(() => `dialog-title-${Math.random().toString(36).slice(2)}`);

watch(
  () => props.open,
  async (value) => {
    if (!value) {
      return;
    }
    await nextTick();
    confirmButtonRef.value?.focus();
  },
);
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  padding: 16px;
  background: rgba(5, 12, 18, 0.65);
  display: grid;
  place-items: center;
  z-index: 20;
}

.dialog-card {
  width: min(440px, 100%);
  padding: 22px;
}

.dialog-title {
  margin: 0;
  font-size: 1.25rem;
}

.dialog-body {
  margin: 10px 0 18px;
  color: var(--text-soft);
}

.dialog-actions {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 48px;
}

@media (min-width: 640px) {
  .dialog-actions {
    flex-direction: row;
  }
}
</style>
