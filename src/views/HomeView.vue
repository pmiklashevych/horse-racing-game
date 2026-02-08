<template>
  <LoadingSplash
    v-if="isBootLoading"
    :title="t('app.title')"
    :subtitle="t('app.loadingSubtitle')"
  />

  <main v-else class="screen-center">
    <MainMenu :title="t('app.title')" :items="menuItems" />

    <ConfirmDialog
      :open="showNewGameDialog"
      :title="t('menu.newGameWarningTitle')"
      :body="t('menu.newGameWarningBody')"
      :confirm-label="t('menu.yes')"
      :cancel-label="t('menu.no')"
      @confirm="confirmNewGame"
      @cancel="showNewGameDialog = false"
    />
  </main>
</template>

<script setup lang="ts">
import * as Sentry from '@sentry/vue';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import LoadingSplash from '@/components/common/LoadingSplash.vue';
import MainMenu, { type MenuItem } from '@/components/menu/MainMenu.vue';
import { useRaceStorage } from '@/composables/useRaceStorage';
import { MIN_LOADING_TIME_MS } from '@/constants/game';
import { formatRaceId } from '@/utils/time';

const router = useRouter();
const { t } = useI18n();
const raceStorage = useRaceStorage();

const isBootLoading = ref(true);
const activeRaceId = ref<string | null>(null);
const showNewGameDialog = ref(false);

const menuItems = computed<MenuItem[]>(() => [
  {
    id: 'new-game',
    label: t('menu.newGame'),
    disabled: false,
    onSelect: onNewGame,
  },
  {
    id: 'continue',
    label: t('menu.continue'),
    disabled: activeRaceId.value === null,
    onSelect: onContinue,
  },
  {
    id: 'results',
    label: t('menu.results'),
    disabled: false,
    onSelect: () => {
      void router.push({ name: 'results' });
    },
  },
  {
    id: 'about',
    label: t('menu.about'),
    disabled: false,
    onSelect: () => {
      void router.push({ name: 'about' });
    },
  },
]);

function onNewGame(): void {
  if (activeRaceId.value) {
    showNewGameDialog.value = true;
    return;
  }
  void startNewGame();
}

function onContinue(): void {
  if (!activeRaceId.value) {
    return;
  }

  void router.push({
    name: 'race',
    params: { id: activeRaceId.value },
  });
}

async function startNewGame(): Promise<void> {
  showNewGameDialog.value = false;
  await raceStorage.clearActiveRace();

  const raceId = formatRaceId();
  await router.push({
    name: 'race',
    params: { id: raceId },
  });
}

async function confirmNewGame(): Promise<void> {
  await startNewGame();
}

onMounted(async () => {
  isBootLoading.value = true;

  const [activeRace] = await Promise.all([
    raceStorage.getActiveRace(),
    new Promise((resolve) => setTimeout(resolve, MIN_LOADING_TIME_MS)),
  ]);

  activeRaceId.value = activeRace?.status === 'in_progress' ? activeRace.id : null;
  isBootLoading.value = false;

  Sentry.captureMessage('HomeView loaded - Sentry test message', 'info');
});
</script>
