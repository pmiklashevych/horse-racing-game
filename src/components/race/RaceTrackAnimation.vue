<template>
  <section class="panel track-panel">
    <header class="track-header">
      <p>
        {{ elapsedLabel }}:
        <span class="stopwatch">{{ formatDurationMs(elapsedMs) }}</span>
      </p>
      <p>{{ trackLabel }}</p>
    </header>

    <div class="lanes">
      <div v-for="horse in horses" :key="horse.id" class="lane">
        <div class="horse-wrapper" :style="laneStyle(horse.id)">
          <HorseIcon class="horse-marker" :background-color="horse.color.value" variant="running" />
          <span class="horse-name">{{ horse.name }}</span>
        </div>
      </div>
    </div>

    <div class="ruler">
      <span v-for="tick in rulerTicks" :key="tick.value" class="tick" :style="{ left: `${tick.percent}%` }">
        {{ tick.value }}m
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import HorseIcon from '@/components/common/HorseIcon.vue';
import type { Horse } from '@/types/horse';
import { formatDurationMs } from '@/utils/time';

const props = defineProps<{
  elapsedLabel: string;
  trackLabel: string;
  elapsedMs: number;
  trackDistance: number;
  horses: Horse[];
  finishTimes: Record<string, number>;
}>();

const rulerTicks = computed(() => {
  const tickStep = 200;
  const ticks = [] as Array<{ value: number; percent: number }>;
  for (let value = 0; value <= props.trackDistance; value += tickStep) {
    ticks.push({
      value,
      percent: (value / props.trackDistance) * 100,
    });
  }
  if (ticks[ticks.length - 1]?.value !== props.trackDistance) {
    ticks.push({ value: props.trackDistance, percent: 100 });
  }
  return ticks;
});

function laneStyle(horseId: string): Record<string, string> {
  const finishTime = props.finishTimes[horseId];
  if (!finishTime) {
    return { transform: 'translateX(0%)' };
  }

  const ratio = Math.min(props.elapsedMs / finishTime, 1);
  return {
    transform: `translateX(${ratio * 100}%)`,
  };
}
</script>

<style scoped>
.track-panel {
  padding: 14px;
}

.track-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.track-header p {
  margin: 0;
  font-weight: 700;
}

.lanes {
  display: grid;
  gap: 8px;
}

.lane {
  height: 42px;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(38, 86, 111, 0.24), rgba(38, 86, 111, 0.06));
  position: relative;
  overflow: hidden;
}

.horse-wrapper {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 100ms linear;
}

.horse-marker {
  margin-left: 4px;
}

.horse-name {
  font-size: 0.85rem;
  color: #1f2b33;
  background: rgba(255, 255, 255, 0.72);
  padding: 2px 6px;
  border-radius: 8px;
}

.ruler {
  margin-top: 14px;
  position: relative;
  height: 30px;
  border-top: 2px solid rgba(24, 34, 40, 0.32);
}

.tick {
  position: absolute;
  top: 6px;
  transform: translateX(-50%);
  font-size: 0.74rem;
  color: var(--text-soft);
}

.tick::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  width: 1px;
  height: 8px;
  background: rgba(24, 34, 40, 0.36);
}
</style>
