<template>
  <section class="panel horses-panel">
    <h2 class="panel-title">{{ title }}</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{{ labels.num }}</th>
            <th>{{ labels.name }}</th>
            <th>{{ labels.color }}</th>
            <th>{{ labels.baseSpeed }}</th>
            <th>{{ labels.condition }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(horse, index) in horses" :key="horse.id">
            <td>{{ index + 1 }}</td>
            <td>{{ horse.name }}</td>
            <td>
              <span class="swatch" :style="{ backgroundColor: horse.color.value }"></span>
              {{ horse.color.name }}
            </td>
            <td>{{ horse.breed.baseSpeed.toFixed(1) }} m/s</td>
            <td class="condition-cell">
              <span>{{ horse.condition }}</span>
              <span
                v-if="conditionDeltas[horse.id]"
                class="delta"
                :class="conditionDeltas[horse.id] > 0 ? 'positive' : 'negative'"
              >
                {{ conditionDeltas[horse.id] > 0 ? '+' : '' }}{{ conditionDeltas[horse.id] }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Horse } from '@/types/horse';

defineProps<{
  title: string;
  labels: {
    num: string;
    name: string;
    color: string;
    baseSpeed: string;
    condition: string;
  };
  horses: Horse[];
  conditionDeltas: Record<string, number>;
}>();
</script>

<style scoped>
.horses-panel {
  padding: 14px;
}

.panel-title {
  margin: 0 0 8px;
  font-size: 1.15rem;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 680px;
}

th,
td {
  padding: 9px 10px;
  border-bottom: 1px solid rgba(24, 34, 40, 0.12);
  text-align: left;
}

th {
  color: var(--text-soft);
  font-weight: 700;
}

.swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(24, 34, 40, 0.35);
  display: inline-block;
  margin-right: 6px;
  vertical-align: middle;
}

.condition-cell {
  position: relative;
}

.delta {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-weight: 700;
  animation: pop 1500ms ease forwards;
}

.delta.positive {
  color: var(--success);
}

.delta.negative {
  color: var(--danger);
}

@keyframes pop {
  from {
    transform: translateY(8px) scale(0.8);
    opacity: 0;
  }

  25% {
    transform: translateY(-7px) scale(1.08);
    opacity: 1;
  }

  to {
    transform: translateY(-18px) scale(1);
    opacity: 0;
  }
}
</style>
