<template>
  <span class="horse-icon" :style="{ backgroundColor }" aria-hidden="true">
    <InlineSVG
      class="horse-glyph"
      :icon="iconDefinition"
      :color="color"
      :size="iconSize"
    />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import InlineSVG from '@/components/common/InlineSVG.vue';
import { HORSE_HEAD_ICON, RUNNING_HORSE_ICON } from '@/constants/icons';

type HorseIconVariant = 'head' | 'running';

const props = withDefaults(
  defineProps<{
    backgroundColor?: string;
    color?: string;
    variant?: HorseIconVariant;
    iconSize?: number;
  }>(),
  {
    backgroundColor: 'var(--horse-icon-background-color)',
    color: 'var(--horse-icon-color)',
    variant: 'head',
    iconSize: 24,
  },
);

const iconDefinition = computed(() => (props.variant === 'running' ? RUNNING_HORSE_ICON : HORSE_HEAD_ICON));
</script>

<style scoped>
.horse-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.28);
  flex: 0 0 auto;
  line-height: 1;
  overflow: hidden;
}

.horse-glyph {
  pointer-events: none;
}
</style>
