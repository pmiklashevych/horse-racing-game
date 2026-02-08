<template>
  <section class="screen-center splash">
    <div class="content panel">
      <svg ref="svgRef" class="logo" viewBox="0 0 320 120" aria-hidden="true">
        <path
          ref="trackPathRef"
          d="M22 70C22 41 45 20 74 20H246C275 20 298 41 298 70C298 99 275 110 246 110H74C45 110 22 99 22 70Z"
          fill="none"
          stroke="#f5d18a"
          stroke-width="5"
          stroke-linecap="round"
        />
        <foreignObject ref="horseMarkerRef" x="41" y="53" width="34" height="34">
          <div class="horse-marker-content">
            <HorseIcon background-color="#d08f2f" color="#fff4de" />
          </div>
        </foreignObject>
      </svg>
      <h1 ref="titleRef" class="title">{{ title }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { animate } from 'animejs';
import { onMounted, ref } from 'vue';
import HorseIcon from './HorseIcon.vue';

defineProps<{
  title: string;
  subtitle: string;
}>();

const trackPathRef = ref<SVGPathElement | null>(null);
const horseMarkerRef = ref<SVGForeignObjectElement | null>(null);
const titleRef = ref<HTMLElement | null>(null);
const svgRef = ref<SVGElement | null>(null);

onMounted(() => {
  if (!trackPathRef.value || !horseMarkerRef.value || !titleRef.value || !svgRef.value) {
    return;
  }

  const pathLength = trackPathRef.value.getTotalLength();

  trackPathRef.value.style.strokeDasharray = `${pathLength}`;
  trackPathRef.value.style.strokeDashoffset = `${pathLength}`;

  animate(trackPathRef.value, {
    strokeDashoffset: [pathLength, 0],
    duration: 1500,
    ease: 'inOutSine',
    loop: true,
    alternate: true,
  });

  animate(horseMarkerRef.value, {
    x: [41, 245],
    duration: 1700,
    ease: 'inOutQuad',
    loop: true,
    alternate: true,
  });

  animate(titleRef.value, {
    opacity: [0, 1],
    translateY: [16, 0],
    duration: 800,
    ease: 'outCubic',
  });

  animate(svgRef.value, {
    opacity: [0, 1],
    scale: [0.95, 1],
    duration: 900,
    ease: 'outQuart',
  });
});
</script>

<style scoped>
.splash {
  position: relative;
  background-size: cover;
  background-position: center;
}

.content {
  position: relative;
  z-index: 1;
  width: min(620px, 100%);
  text-align: center;
  padding: 24px;
  background: rgba(17, 32, 44, 0.72);
  border: 1px solid rgba(244, 214, 160, 0.4);
  color: #f4e6cf;
}

.logo {
  width: min(300px, 80%);
  margin: 0 auto 10px;
  display: block;
  opacity: 0;
}

.horse-marker-content {
  width: 34px;
  height: 34px;
}

.title {
  margin: 8px 0 0;
  font-size: clamp(1.6rem, 7vw, 2.8rem);
  letter-spacing: 0.08em;
  opacity: 0;
}

.subtitle {
  margin: 10px 0 0;
  color: rgba(250, 238, 212, 0.88);
}
</style>
