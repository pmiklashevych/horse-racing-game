<template>
  <main class="page results-page">
    <section class="panel content">
      <header class="header">
        <h1 class="page-title">{{ t('results.title') }}</h1>
        <AppButton variant="light" @click="goHome">
          {{ t('results.back') }}
        </AppButton>
      </header>

      <p v-if="isLoading" class="empty">{{ t('app.loading') }}</p>
      <p v-else-if="results.length === 0" class="empty">{{ t('results.empty') }}</p>

      <div v-else v-bind="containerProps" class="results-viewport" :style="{ height: `${ROW_HEIGHT_PX * VISIBLE_ROWS}px` }">
        <ul v-bind="wrapperProps" class="results-list">
          <li v-for="{ data } in virtualRows" :key="data.id" class="result-row">
            <AppButton class="result-item" block @click="openRace(data.id)">
              {{ data.id }}
            </AppButton>
          </li>
        </ul>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useVirtualList } from '@vueuse/core';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import { useRaceStorage } from '@/composables/useRaceStorage';
import type { RaceSummary } from '@/types/race';

const { t } = useI18n();
const router = useRouter();
const raceStorage = useRaceStorage();

const isLoading = ref(true);
const results = ref<RaceSummary[]>([]);

const VISIBLE_ROWS = 5;
const OVERSCAN_ROWS = 3;
const ROW_HEIGHT_PX = 56;

const { containerProps, list: virtualRows, scrollTo, wrapperProps } = useVirtualList(results, {
  itemHeight: ROW_HEIGHT_PX,
  overscan: OVERSCAN_ROWS,
});

function goHome(): void {
  void router.push({ name: 'home' });
}

function openRace(id: string): void {
  void router.push({ name: 'results-race', params: { id } });
}

onMounted(async () => {
  isLoading.value = true;
  results.value = await raceStorage.listCompletedRaces();
  scrollTo(0);
  isLoading.value = false;
});
</script>

<style scoped>
.results-page {
  justify-content: center;
}

.content {
  width: min(400px, 100%);
  padding: 18px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.empty {
  color: var(--text-soft);
}

.results-viewport {
  overflow-y: auto;
  overscroll-behavior: contain;
}

.results-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.result-row {
  height: 56px;
}

.result-item {
  font-family: 'Roboto Mono', monospace;
  font-style: normal;
  font-weight: 400;
  justify-content: center;
  min-height: 50px;
  height: 50px;
  margin-top: 3px;
  text-align: left;
  padding: 0 14px;
}
</style>
