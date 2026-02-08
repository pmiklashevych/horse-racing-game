<template>
  <LoadingSplash
    v-if="store.isPreparingData"
    :title="t('app.loadingRound')"
    :subtitle="t('app.loadingRoundSubtitle')"
  />

  <main v-else-if="race" class="race-shell">
    <header class="race-header">
      <div class="race-header-inner">
        <AppButton ref="backButtonRef" class="header-back-button" variant="light" @click="onBack">
          {{ backButtonLabel }}
        </AppButton>
        <h1 v-if="!isResultsMode" class="race-title">{{ raceScreenTitle }}</h1>
        <span class="race-status">{{ race.status === 'completed' ? t('lobby.completed') : '' }}</span>
      </div>
    </header>

    <section class="race-main">
      <RaceRound
        v-if="store.isRoundPhase && currentRound"
        :round="currentRound"
        :round-horses="currentRoundHorses"
        :elapsed-ms="race.runtime?.elapsedMs ?? 0"
        :finish-times="currentRoundFinishTimes"
      />

      <RaceLobby
        v-else
        :race="race"
        :condition-deltas="conditionDeltaMap"
        :completed-rounds="store.completedRoundsCount"
        :show-progress-line="!isResultsMode"
        :schedule-title="isResultsMode ? t('results.raceResultsTitle', { id: race.id }) : t('lobby.scheduleTitle')"
      />
    </section>

    <footer class="race-footer">
      <div class="race-footer-inner">
        <AppButton
          v-if="footerAction"
          ref="actionButtonRef"
          class="action-button"
          :variant="footerAction.variant"
          :disabled="footerAction.disabled"
          @click="onFooterAction"
        >
          {{ footerAction.label }}
        </AppButton>
      </div>
    </footer>
  </main>

  <main v-else class="page">
    <section class="panel empty-panel">
      <p>{{ t('lobby.noRace') }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import LoadingSplash from '@/components/common/LoadingSplash.vue';
import RaceLobby from '@/components/race/RaceLobby.vue';
import RaceRound from '@/components/race/RaceRound.vue';
import { useRaceStorage } from '@/composables/useRaceStorage';
import { MIN_LOADING_TIME_MS, SIMULATION_TIME_SCALE } from '@/constants/game'
import { useGameStore } from '@/stores/game-store';
import type { Horse } from '@/types/horse';
import { getRoundHorseTimeMap } from '@/utils/race-engine';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const store = useGameStore();
const { race, currentRound } = storeToRefs(store);
const raceStorage = useRaceStorage();

const loadedSource = ref<'active' | 'completed' | 'none'>('none');
const conditionDeltaMap = ref<Record<string, number>>({});
const isCompletedPersisted = ref(false);
const isResultsMode = computed(() => route.name === 'results-race');

interface AppButtonControl {
  focus: () => void;
}

type FooterActionId = 'start' | 'pause' | 'resume' | 'continue' | 'back-to-menu';
type FooterActionVariant = 'primary' | 'light';

interface FooterAction {
  id: FooterActionId;
  label: string;
  variant: FooterActionVariant;
  disabled: boolean;
}

let animationFrameId: number | null = null;
let lastFrameTimeMs: number | null = null;
let clearDeltaTimer: number | null = null;
let persistCompletedRaceTask: Promise<void> | null = null;
const actionButtonRef = ref<AppButtonControl | null>(null);
const backButtonRef = ref<AppButtonControl | null>(null);

const currentRoundHorses = computed<Horse[]>(() => {
  if (!race.value || !currentRound.value) {
    return [];
  }

  const selectedHorseIds = new Set(currentRound.value.horses);
  return race.value.horses.filter((horse) => selectedHorseIds.has(horse.id));
});

const currentRoundFinishTimes = computed<Record<string, number>>(() => {
  if (!race.value || !currentRound.value) {
    return {};
  }

  return getRoundHorseTimeMap(currentRound.value, race.value);
});

const showStartButton = computed(() => {
  if (!race.value) {
    return false;
  }

  return race.value.status === 'in_progress' && loadedSource.value !== 'completed' && store.hasRoundsToComplete;
});

const isRoundComplete = computed(() => race.value?.activeRoundStatus === 'completed');

const raceScreenTitle = computed(() => {
  if (!race.value) {
    return '';
  }

  if (!store.isRoundPhase || !currentRound.value) {
    return race.value.id;
  }

  const roundIndex = race.value.rounds.findIndex((round) => round.id === currentRound.value?.id);
  return t('lobby.roundCard.title', { index: roundIndex >= 0 ? roundIndex + 1 : 1 });
});

const backButtonLabel = computed(() => {
  return isResultsMode.value ? t('results.backToResults') : t('lobby.back');
});

const footerAction = computed<FooterAction | null>(() => {
  if (!race.value) {
    return null;
  }

  if (store.isRoundPhase && currentRound.value) {
    if (isRoundComplete.value) {
      return {
        id: 'continue',
        label: t('menu.continue'),
        variant: 'primary',
        disabled: false,
      };
    }

    return {
      id: store.isRoundPaused ? 'resume' : 'pause',
      label: store.isRoundPaused ? t('round.resume') : t('round.pause'),
      variant: 'light',
      disabled: false,
    };
  }

  if (showStartButton.value) {
    return {
      id: 'start',
      label: t('lobby.start'),
      variant: 'primary',
      disabled: !store.canStartRound,
    };
  }

  if (race.value.status === 'completed') {
    return {
      id: 'back-to-menu',
      label: isResultsMode.value ? t('results.backToResults') : t('results.back'),
      variant: 'primary',
      disabled: false,
    };
  }

  return null;
});

function stopRoundSimulation(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  lastFrameTimeMs = null;
}

function finalizeRacePersistenceIfNeeded(): Promise<void> {
  if (
    !race.value ||
    race.value.status !== 'completed' ||
    race.value.activeRoundId !== null
  ) {
    return Promise.resolve();
  }

  if (persistCompletedRaceTask) {
    return persistCompletedRaceTask;
  }

  if (isCompletedPersisted.value) {
    return Promise.resolve();
  }

  const completedRace = race.value as NonNullable<typeof race.value>;
  isCompletedPersisted.value = true;
  raceStorage.detachAutoSave();

  persistCompletedRaceTask = (async () => {
    try {
      // Keep active race snapshot in sync with completed state to avoid stale in-progress resume loops.
      await raceStorage.saveActiveRace(completedRace);
      await raceStorage.saveCompletedRace(completedRace);
      await raceStorage.clearActiveRace();
      loadedSource.value = 'completed';
    } catch (error) {
      isCompletedPersisted.value = false;
      if (import.meta.env.DEV) {
        console.error('[RaceView] Failed to persist completed race.', {
          raceId: completedRace.id,
          error,
        });
      }
    } finally {
      persistCompletedRaceTask = null;
    }
  })();

  return persistCompletedRaceTask;
}

function runRoundFrame(frameTimeMs: number): void {
  if (!race.value || !currentRound.value || race.value.activeRoundStatus !== 'in_progress') {
    stopRoundSimulation();
    return;
  }

  if (store.isRoundPaused) {
    stopRoundSimulation();
    return;
  }

  if (lastFrameTimeMs === null) {
    lastFrameTimeMs = frameTimeMs;
  }

  const deltaMs = frameTimeMs - lastFrameTimeMs;
  lastFrameTimeMs = frameTimeMs;

  const runtime = race.value.runtime;
  if (!runtime) {
    stopRoundSimulation();
    return;
  }

  const nextElapsedMs = runtime.elapsedMs + Math.max(deltaMs, 0) * SIMULATION_TIME_SCALE;
  store.setRoundElapsed(nextElapsedMs);

  for (const [horseId, finishTimeMs] of Object.entries(currentRoundFinishTimes.value)) {
    if (nextElapsedMs >= finishTimeMs) {
      store.recordHorseFinish(horseId, finishTimeMs);
    }
  }

  if (currentRound.value.results.length >= currentRound.value.horses.length) {
    store.finishCurrentRound();
    stopRoundSimulation();
    return;
  }

  animationFrameId = requestAnimationFrame(runRoundFrame);
}

function startRoundSimulationIfNeeded(): void {
  if (!race.value || !currentRound.value) {
    stopRoundSimulation();
    return;
  }

  if (race.value.activeRoundStatus !== 'in_progress' || store.isRoundPaused) {
    stopRoundSimulation();
    return;
  }

  if (animationFrameId !== null) {
    return;
  }

  animationFrameId = requestAnimationFrame(runRoundFrame);
}

async function loadRaceByRouteId(id: string): Promise<void> {
  store.setPreparingData(true);
  stopRoundSimulation();
  conditionDeltaMap.value = {};

  if (isResultsMode.value) {
    const completedRace = await raceStorage.getCompletedRaceById(id);

    if (completedRace) {
      store.hydrateLoadedRace(completedRace);
      loadedSource.value = 'completed';
    } else {
      loadedSource.value = 'none';
      store.setRace(null);
    }

    isCompletedPersisted.value = true;
    raceStorage.detachAutoSave();

    await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_TIME_MS));
    store.setPreparingData(false);
    return;
  }

  const result = await raceStorage.loadRaceById(id);
  loadedSource.value = result.source;

  if (result.race) {
    store.hydrateLoadedRace(result.race);
  } else {
    const createdRace = store.createRace(id);
    loadedSource.value = 'active';
    await raceStorage.saveActiveRace(createdRace);
  }

  isCompletedPersisted.value = race.value?.status === 'completed' || loadedSource.value === 'completed';

  if (race.value?.status === 'in_progress' && loadedSource.value !== 'completed') {
    raceStorage.attachAutoSave(race);
  } else {
    raceStorage.detachAutoSave();
  }

  await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_TIME_MS));
  store.setPreparingData(false);
  startRoundSimulationIfNeeded();
}

function onStartRound(): void {
  const startedRound = store.startNextRound();
  if (!startedRound) {
    return;
  }

  conditionDeltaMap.value = {};
  if (race.value) {
    void raceStorage.saveActiveRace(race.value);
  }
  startRoundSimulationIfNeeded();
}

function onPauseRound(): void {
  store.pauseRound();
  if (race.value) {
    void raceStorage.saveActiveRace(race.value);
  }
  stopRoundSimulation();
}

function onResumeRound(): void {
  store.resumeRound();
  if (race.value) {
    void raceStorage.saveActiveRace(race.value);
  }
  startRoundSimulationIfNeeded();
}

function onBackToLobby(): void {
  const deltas = store.backToLobbyAndApplyCondition();
  conditionDeltaMap.value = deltas;

  if (clearDeltaTimer !== null) {
    clearTimeout(clearDeltaTimer);
  }
  clearDeltaTimer = window.setTimeout(() => {
    conditionDeltaMap.value = {};
  }, 1200);

  if (race.value?.status === 'in_progress') {
    void raceStorage.saveActiveRace(race.value);
  }
  void finalizeRacePersistenceIfNeeded();
}

async function onBack(): Promise<void> {
  if (isResultsMode.value) {
    stopRoundSimulation();
    raceStorage.detachAutoSave();
    await router.push({ name: 'results' });
    return;
  }

  if (!race.value) {
    await router.push({ name: 'home' });
    return;
  }

  if (store.isRoundPhase && race.value.activeRoundStatus === 'in_progress' && !store.isRoundPaused) {
    store.pauseRound();
  }

  stopRoundSimulation();
  await finalizeRacePersistenceIfNeeded();

  if (race.value.status === 'in_progress' && loadedSource.value !== 'completed') {
    void raceStorage.saveActiveRace(race.value);
  }

  await router.push({ name: 'home' });
}

function onFooterAction(): void {
  const action = footerAction.value;
  if (!action || action.disabled) {
    return;
  }

  if (action.id === 'start') {
    onStartRound();
    return;
  }

  if (action.id === 'pause') {
    onPauseRound();
    return;
  }

  if (action.id === 'resume') {
    onResumeRound();
    return;
  }

  if (action.id === 'back-to-menu') {
    void onBack();
    return;
  }

  onBackToLobby();
}

function onRaceKeydown(event: KeyboardEvent): void {
  if (!race.value) {
    return;
  }

  if (event.key === 'Escape') {
    if (store.isRoundPhase && !isRoundComplete.value) {
      event.preventDefault();
      if (!store.isRoundPaused) {
        onPauseRound();
      }
      return;
    }

    if (!store.isRoundPhase && race.value.status === 'completed') {
      event.preventDefault();
      void onBack();
    }
    return;
  }

  if (event.key !== 'Enter' || event.target instanceof HTMLButtonElement) {
    return;
  }

  const action = footerAction.value;
  if (!action || action.disabled) {
    return;
  }

  event.preventDefault();
  onFooterAction();
}

async function focusFooterAction(): Promise<void> {
  await nextTick();

  if (footerAction.value && !footerAction.value.disabled) {
    actionButtonRef.value?.focus();
    return;
  }

  backButtonRef.value?.focus();
}

watch(
  () => `${String(route.name ?? '')}|${String(route.params.id ?? '')}`,
  () => {
    const id = route.params.id;
    if (typeof id !== 'string' || id.length === 0) {
      return;
    }
    void loadRaceByRouteId(id);
  },
  { immediate: true },
);

watch(
  () => `${race.value?.activeRoundId ?? ''}|${race.value?.activeRoundStatus ?? ''}|${store.isRoundPaused}`,
  () => {
    startRoundSimulationIfNeeded();
  },
);

watch(
  () => race.value?.status,
  () => {
    void finalizeRacePersistenceIfNeeded();
  },
);

watch(
  () => `${footerAction.value?.id ?? 'none'}|${footerAction.value?.disabled ?? true}`,
  () => {
    void focusFooterAction();
  },
);

onMounted(() => {
  window.addEventListener('keydown', onRaceKeydown);
  startRoundSimulationIfNeeded();
  void focusFooterAction();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onRaceKeydown);
  raceStorage.detachAutoSave();
  stopRoundSimulation();
  if (clearDeltaTimer !== null) {
    clearTimeout(clearDeltaTimer);
  }
});
</script>

<style scoped>
.race-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.race-header {
  position: sticky;
  top: 0;
  z-index: 12;
  backdrop-filter: blur(8px);
  background: linear-gradient(180deg, rgba(24, 24, 26, 0.95), rgba(24, 24, 26, 0.75));
  border-bottom: 1px solid rgba(239, 235, 228, 0.14);
}

.race-header-inner {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 12px 16px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
}

.header-back-button {
  justify-self: start;
}

.race-title {
  margin: 0;
  text-align: center;
  color: #efebe4;
  font-size: clamp(1.25rem, 4vw, 2rem);
  line-height: 1.1;
}

.race-status {
  grid-column: 3;
  min-height: 1.25rem;
  color: #7de8a7;
  font-weight: 700;
  justify-self: end;
}

.race-main {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 16px 96px;
}

.race-footer {
  position: sticky;
  bottom: 0;
  z-index: 12;
  background: linear-gradient(180deg, rgba(24, 24, 26, 0), rgba(24, 24, 26, 0.8) 40%, rgba(24, 24, 26, 0.8));
}

.race-footer-inner {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 50px 16px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.action-button {
  width: min(420px, 100%);
}

.empty-panel {
  padding: 20px;
}

@media (min-width: 768px) {
  .race-header-inner,
  .race-main,
  .race-footer-inner {
    padding-left: 24px;
    padding-right: 24px;
  }

  .race-main {
    padding-bottom: 54px;
  }
}
</style>
