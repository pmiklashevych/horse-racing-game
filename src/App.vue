<template>
  <div class="app-shell">
    <RouterView />
  </div>
  <SpeedInsights />
</template>

<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue';
</script>
