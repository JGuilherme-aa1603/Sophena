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
  gap: 0.75rem;
  justify-items: start;
  padding: 1.25rem;
  border: 1px dashed rgba(88, 113, 95, 0.35);
  border-radius: var(--radius-card);
  background: rgba(255, 253, 249, 0.76);
}

.empty-state-card h2 {
  color: var(--color-heading);
  font-size: 1.1rem;
  font-weight: 700;
}

.empty-state-card p {
  color: var(--color-muted);
}

.empty-state-action {
  min-height: 3rem;
  padding: 0.85rem 1rem;
  border: 0;
  border-radius: 999px;
  background: var(--color-primary);
  color: #fffdf9;
  font: inherit;
  font-weight: 700;
  transition:
    transform var(--transition-fast),
    background var(--transition-fast);
}

.empty-state-action:hover {
  background: var(--color-primary-strong);
  transform: translateY(-1px);
}

.empty-state-action:focus-visible {
  outline: 3px solid rgba(78, 129, 102, 0.28);
  outline-offset: 2px;
}
</style>
