<template>
  <section :class="[usePanel ? 'panel' : '', 'results-panel', { dense }]">
    <h3 class="panel-title">{{ title }}</h3>
    <p v-if="subtitle" class="panel-subtitle">{{ subtitle }}</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{{ labels.position }}</th>
            <th>{{ labels.horse }}</th>
            <th>{{ labels.time }}</th>
          </tr>
        </thead>
        <TransitionGroup tag="tbody" name="result-move">
          <tr v-for="(entry, index) in sortedEntries" :key="entry.horseId">
            <td>{{ index + 1 }}</td>
            <td>
              <span class="horse-cell">
                <HorseIcon
                  class="horse-cell-icon"
                  :icon-size="horseIconSize"
                  :background-color="horseMap[entry.horseId]?.color.value ?? 'var(--horse-icon-background-color)'"
                />
                <span>{{ horseMap[entry.horseId]?.name ?? entry.horseId }}</span>
              </span>
            </td>
            <td><span class="stopwatch">{{ formatDurationMs(entry.timeMs) }}</span></td>
          </tr>
          <tr v-for="horseId in pendingHorseIds" :key="`pending-${horseId}`">
            <td>{{ notPosition }}</td>
            <td>
              <span class="horse-cell">
                <HorseIcon
                  class="horse-cell-icon"
                  :icon-size="horseIconSize"
                  :background-color="horseMap[horseId]?.color.value ?? 'var(--horse-icon-background-color)'"
                />
                <span>{{ horseMap[horseId]?.name ?? horseId }}</span>
              </span>
            </td>
            <td><span class="stopwatch">{{ notTime }}</span></td>
          </tr>
          <tr v-for="placeholder in placeholders" :key="`placeholder-${placeholder}`">
            <td>{{ notPosition }}</td>
            <td>--</td>
            <td><span class="stopwatch">{{ notTime }}</span></td>
          </tr>
        </TransitionGroup>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import HorseIcon from '@/components/common/HorseIcon.vue';
import type { Horse } from '@/types/horse';
import type { RoundResultEntry } from '@/types/round';
import { formatDurationMs } from '@/utils/time';

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    labels: {
      position: string;
      horse: string;
      time: string;
    };
    entries: RoundResultEntry[];
    horseIds?: string[];
    totalHorses?: number;
    horseMap: Record<string, Horse>;
    notPosition: string;
    notTime: string;
    usePanel?: boolean;
    dense?: boolean;
  }>(),
  {
    usePanel: true,
    dense: false,
  },
);

const horseIconSize = computed(() => (props.dense ? 12 : 16));
const sortedEntries = computed(() => [...props.entries].sort((left, right) => left.timeMs - right.timeMs));
const pendingHorseIds = computed(() => {
  if (!props.horseIds || props.horseIds.length === 0) {
    return [];
  }

  const finishedHorseIds = new Set(sortedEntries.value.map((entry) => entry.horseId));
  return props.horseIds.filter((horseId) => !finishedHorseIds.has(horseId));
});
const placeholders = computed(() =>
  Array.from(
    {
      length: Math.max((props.totalHorses ?? 0) - sortedEntries.value.length - pendingHorseIds.value.length, 0),
    },
    (_unused, index) => index,
  ),
);
</script>

<style scoped>
.results-panel {
  padding: 14px;
  width: min(460px, 100%);
}

.panel-title {
  margin: 0 0 4px;
  font-size: 1.15rem;
}

.panel-subtitle {
  margin: 0 0 10px;
  color: var(--text-soft);
  font-size: 0.92rem;
}

.results-panel.dense .panel-title {
  margin: 0 0 2px;
  font-size: 1rem;
}

.results-panel.dense .panel-subtitle {
  margin: 0 0 6px;
  font-size: 0.8rem;
}

.table-wrap {
  overflow-x: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 8px;
  border-bottom: 1px solid rgba(24, 34, 40, 0.12);
  white-space: nowrap;
}

.results-panel.dense th,
.results-panel.dense td {
  padding: 2px 6px;
  font-size: 0.8rem;
}

th {
  text-align: left;
  color: var(--text-soft);
}

.horse-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.results-panel.dense .horse-cell {
  gap: 5px;
}

.horse-cell-icon {
  width: 26px;
  height: 26px;
}

.results-panel.dense .horse-cell-icon {
  width: 20px;
  height: 20px;
}
</style>
