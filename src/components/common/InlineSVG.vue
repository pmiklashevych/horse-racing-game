<template>
  <svg
    class="inline-svg"
    :viewBox="icon.viewBox"
    aria-hidden="true"
    :style="{ color, width: sizePx, height: sizePx }"
    v-bind="$attrs"
  >
    <g v-if="icon.gTransform" :transform="icon.gTransform">
      <path
        v-for="(path, index) in icon.paths"
        :key="`path-${index}`"
        fill="currentColor"
        :d="path"
      />
    </g>
    <template v-else>
      <path
        v-for="(path, index) in icon.paths"
        :key="`path-${index}`"
        fill="currentColor"
        :d="path"
      />
    </template>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { InlineSvgIconDefinition } from '@/constants/icons';

const props = withDefaults(
  defineProps<{
    icon: InlineSvgIconDefinition;
    color?: string;
    size?: number;
  }>(),
  {
    color: 'currentColor',
    size: 24,
  },
);

const sizePx = computed(() => `${props.size ?? 24}px`);
</script>

<style scoped>
.inline-svg {
  display: block;
  flex: 0 0 auto;
}
</style>
