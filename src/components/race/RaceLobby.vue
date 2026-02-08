<template>
  <section class="lobby-page">
    <RaceProgressLine
      v-if="showProgressLine"
      :title="t('lobby.raceProgress')"
      :completed="completedRounds"
      :total="race.rounds.length"
    />

    <RoundScheduleGrid
      :title="scheduleTitle"
      :round-title="(index: number) => t('lobby.roundCard.title', { index })"
      :labels="{
        position: t('round.resultTable.position'),
        horse: t('round.resultTable.horse'),
        time: t('round.resultTable.time'),
      }"
      :completed="completedRounds"
      :rounds="race.rounds"
      :horse-map="horseMap"
      :not-position="t('round.notPositioned')"
      :not-time="t('round.notFinished')"
    />

    <HorseTable
      :title="t('lobby.horsesTitle')"
      :labels="{
        num: t('lobby.table.num'),
        name: t('lobby.table.name'),
        color: t('lobby.table.color'),
        baseSpeed: t('lobby.table.baseSpeed'),
        condition: t('lobby.table.condition'),
      }"
      :horses="race.horses"
      :condition-deltas="conditionDeltas"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import HorseTable from './HorseTable.vue';
import RaceProgressLine from './RaceProgressLine.vue';
import RoundScheduleGrid from './RoundScheduleGrid.vue';
import type { Race } from '@/types/race';

const props = withDefaults(
  defineProps<{
    race: Race;
    conditionDeltas: Record<string, number>;
    completedRounds: number;
    showProgressLine?: boolean;
    scheduleTitle: string;
  }>(),
  {
    showProgressLine: true,
  },
);

const { t } = useI18n();
const scheduleTitle = computed(() => props.scheduleTitle);

const horseMap = computed(() =>
  props.race.horses.reduce<Record<string, (typeof props.race.horses)[number]>>((accumulator, horse) => {
    accumulator[horse.id] = horse;
    return accumulator;
  }, {}),
);
</script>

<style scoped>
.lobby-page {
  width: min(1100px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
</style>
