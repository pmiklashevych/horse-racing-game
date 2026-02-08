<template>
  <section class="panel progress-panel">
    <h2 class="panel-title">{{ title }}</h2>
    <div class="line" role="progressbar" :aria-valuemin="0" :aria-valuemax="total" :aria-valuenow="completed">
      <div
        v-for="point in total"
        :key="point"
        class="point"
        :class="{
          completed: point <= completed,
          next: point === completed + 1,
        }"
      >
        {{ point }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  completed: number;
  total: number;
}>();
</script>

<style scoped>
.progress-panel {
  padding: 14px;
}

.panel-title {
  margin: 0 0 10px;
  font-size: 1.15rem;
}

.line {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.point {
  position: relative;
  overflow: hidden;
  cursor: default;
  user-select: none;
  -webkit-user-select: none;
  height: 42px;
  border-radius: 999px;
  border: 1px solid rgba(33, 45, 58, 0.26);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.12) 38%, rgba(0, 0, 0, 0.16) 100%),
    var(--progress-pending-bg);
  color: var(--progress-pending-text);
  display: grid;
  place-items: center;
  font-weight: 700;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 -2px 0 rgba(0, 0, 0, 0.18),
    0 2px 4px rgba(0, 0, 0, 0.16);
}

.point::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 10px;
  right: 10px;
  height: 42%;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.point.next {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0.08) 38%, rgba(0, 0, 0, 0.22) 100%),
    var(--progress-next-bg);
  color: var(--progress-next-text);
  border-color: rgba(16, 33, 63, 0.68);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.34),
    inset 0 -2px 0 rgba(0, 0, 0, 0.26),
    0 2px 5px rgba(17, 35, 68, 0.36);
  animation: next-point-pulse 1s ease-in-out infinite;
}

.point.completed {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.33) 0%, rgba(255, 255, 255, 0.1) 38%, rgba(0, 0, 0, 0.2) 100%),
    var(--progress-completed-bg);
  color: var(--progress-completed-text);
  border-color: rgba(25, 95, 58, 0.66);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.36),
    inset 0 -2px 0 rgba(0, 0, 0, 0.24),
    0 2px 5px rgba(17, 74, 45, 0.3);
}

@keyframes next-point-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.06);
    opacity: 0.86;
  }
}

@media (prefers-reduced-motion: reduce) {
  .point.next {
    animation: none;
  }
}
</style>
