<script setup lang="ts">
const props = defineProps<{
  title: string
  description: string
  actionLabel?: string
  actionTestid?: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <section class="empty-state-card">
    <h2>{{ props.title }}</h2>
    <p>{{ props.description }}</p>

    <button
      v-if="props.actionLabel"
      type="button"
      class="empty-state-action"
      :data-testid="props.actionTestid"
      @click="emit('action')"
    >
      {{ props.actionLabel }}
    </button>
  </section>
</template>

<style scoped>
.empty-state-card {
  display: grid;
  gap: var(--space-sm);
  justify-items: start;
  padding: var(--space-lg);
  border: 1px dashed rgba(95, 111, 102, 0.28);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: var(--shadow-sm);
}

.empty-state-card h2 {
  color: var(--color-heading);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.empty-state-card p {
  color: var(--color-muted);
}

.empty-state-action {
  min-height: 3.1rem;
  padding: 0.9rem 1.15rem;
  border: 0;
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: #fff;
  font: inherit;
  font-weight: 700;
  box-shadow: var(--shadow-md);
  transition:
    transform var(--transition-fast),
    background var(--transition-fast),
    box-shadow var(--transition-fast);
}

.empty-state-action:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.empty-state-action:focus-visible {
  outline: 3px solid rgba(53, 95, 74, 0.22);
  outline-offset: 2px;
}
</style>
