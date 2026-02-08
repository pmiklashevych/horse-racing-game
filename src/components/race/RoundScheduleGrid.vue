<template>
  <section class="panel schedule-panel">
    <h2 class="panel-title">{{ title }}</h2>
    <div class="grid">
      <RoundResultsTable
        v-for="(round, index) in rounds"
        :key="round.id"
        class="schedule-item"
        :class="[round.status, { next: index === completed }]"
        :title="roundTitle(index + 1)"
        :subtitle="`${round.track.name} (${round.track.distance}m)`"
        :labels="labels"
        :entries="round.results"
        :horse-ids="round.horses"
        :horse-map="horseMap"
        :not-position="notPosition"
        :not-time="notTime"
        :dense="true"
        :use-panel="false"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import RoundResultsTable from './RoundResultsTable.vue';
import type { Horse } from '@/types/horse';
import type { Round } from '@/types/round';

defineProps<{
  title: string;
  roundTitle: (index: number) => string;
  labels: {
    position: string;
    horse: string;
    time: string;
  };
  completed: number;
  rounds: Round[];
  horseMap: Record<string, Horse>;
  notPosition: string;
  notTime: string;
}>();
</script>

<style scoped>
.schedule-panel {
  padding: 14px;
}

.panel-title {
  margin: 0 0 10px;
  font-size: 1.15rem;
}

.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  justify-items: center;
}

.schedule-item {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 14px;
  padding: 10px;
}

.schedule-item.completed {
  border: 1px solid var(--progress-completed-bg);
}

.schedule-item.new {
  border: 1px solid var(--progress-pending-bg);
}

.schedule-item.new.next {
  border: 1px solid var(--progress-next-bg);
  box-shadow: var(--progress-next-bg) 0 0 8px 1px;
}

@media (max-width: 560px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
