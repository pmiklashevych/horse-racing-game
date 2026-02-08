<template>
  <main class="page about-page">
    <section class="panel about-content">
      <header class="about-header">
        <h1 class="page-title">{{ t('about.title') }}</h1>
        <AppButton variant="light" @click="goHome">{{ t('about.back') }}</AppButton>
      </header>

      <p class="page-subtitle">{{ t('about.subtitle') }}</p>
      <p>{{ t('about.description') }}</p>

      <h2>{{ t('about.rulesTitle') }}</h2>
      <ul>
        <li v-for="(rule, index) in rules" :key="index">{{ rule }}</li>
      </ul>

      <h2>{{ t('about.authorTitle') }}</h2>
      <p>{{ t('about.author') }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';

const { t, tm } = useI18n();
const router = useRouter();

const rules = computed(() => tm('about.rules') as string[]);

function goHome(): void {
  void router.push({ name: 'home' });
}
</script>

<style scoped>
.about-page {
  justify-content: center;
}

.about-content {
  width: min(860px, 100%);
  padding: 20px;
}

.about-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

h2 {
  margin-top: 20px;
}

ul {
  margin: 0;
  padding-left: 22px;
  display: grid;
  gap: 7px;
}
</style>
