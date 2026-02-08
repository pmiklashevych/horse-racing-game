<template>
  <section class="round-page">
    <Transition name="round-phase-swap" mode="out-in">
      <RaceTrackAnimation
        v-if="!isReadyToShowResults"
        key="track"
        :elapsed-label="t('round.elapsed')"
        :track-label="t('round.trackLength', { distance: round.track.distance })"
        :elapsed-ms="elapsedMs"
        :track-distance="round.track.distance"
        :horses="roundHorses"
        :finish-times="finishTimes"
      />

      <RoundResultsTable
        v-else
        key="results"
        :title="t('round.resultsTitle')"
        :labels="{
          position: t('round.resultTable.position'),
          horse: t('round.resultTable.horse'),
          time: t('round.resultTable.time'),
        }"
        :entries="round.results"
        :horse-ids="round.horses"
        :horse-map="horseMap"
        :not-position="t('round.notPositioned')"
        :not-time="t('round.notFinished')"
      />
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import RaceTrackAnimation from './RaceTrackAnimation.vue';
import RoundResultsTable from './RoundResultsTable.vue';
import type { Horse } from '@/types/horse';
import type { Round } from '@/types/round';

const props = defineProps<{
  round: Round;
  roundHorses: Horse[];
  elapsedMs: number;
  finishTimes: Record<string, number>;
}>();

const { t } = useI18n();

const horseMap = computed(() =>
  props.roundHorses.reduce<Record<string, Horse>>((accumulator, horse) => {
    accumulator[horse.id] = horse;
    return accumulator;
  }, {}),
);

const isReadyToShowResults = computed(() => props.round.status === 'completed');
</script>

<style scoped>
.round-page {
  width: min(1100px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.round-phase-swap-enter-active,
.round-phase-swap-leave-active {
  transition:
    opacity 260ms ease,
    transform 260ms ease;
}

.round-phase-swap-enter-from,
.round-phase-swap-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
