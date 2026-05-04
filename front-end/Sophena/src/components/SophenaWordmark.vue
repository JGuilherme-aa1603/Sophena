<script setup lang="ts">
withDefaults(defineProps<{
  size?: number
  showName?: boolean
}>(), {
  size: 32,
  showName: true,
})
</script>

<template>
  <div class="sophena-wordmark">
    <img
      :width="size"
      :height="size"
      src="/sophena-logo.png"
      alt="Sophena"
      class="sophena-wordmark__logo"
    >
    <span v-if="showName" class="sophena-wordmark__name">Sophena</span>
  </div>
</template>

<style scoped>
.sophena-wordmark {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sophena-wordmark__logo {
  display: block;
  object-fit: contain;
  flex-shrink: 0;
}

.sophena-wordmark__name {
  font-family: var(--font-serif);
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--color-heading);
  line-height: 1;
  font-size: calc(v-bind(size) * 0.65px);
}
</style>
