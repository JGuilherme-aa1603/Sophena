<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  author: string
  coverUrl: string | null
  position?: number
  showPosition?: boolean
  coverAlt?: string
}>(), {
  position: undefined,
  showPosition: false,
  coverAlt: undefined,
})

const slots = useSlots()
const resolvedCoverAlt = computed(() => props.coverAlt ?? `Capa do livro ${props.title}`)
const hasActions = computed(() => Boolean(slots.actions))
</script>

<template>
  <article
    class="book-card"
    :class="{
      'book-card--with-position': showPosition,
      'book-card--interactive': hasActions,
    }"
    data-testid="book-card"
  >
    <div
      v-if="showPosition"
      class="book-card-position"
      data-testid="book-card-position"
      aria-hidden="true"
    >
      {{ position }}
    </div>

    <div class="book-card-cover">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        :alt="resolvedCoverAlt"
        class="book-card-cover-image"
        data-testid="book-card-cover-image"
      />

      <div
        v-else
        class="book-card-cover-fallback"
        data-testid="book-card-cover-fallback"
      >
        Sem capa
      </div>
    </div>

    <div class="book-card-content">
      <strong data-testid="book-card-title">{{ title }}</strong>
      <span>{{ author }}</span>
    </div>

    <div v-if="hasActions" class="book-card-actions" data-testid="book-card-actions">
      <slot name="actions" />
    </div>
  </article>
</template>

<style scoped>
.book-card {
  display: grid;
  gap: var(--space-md);
  align-items: center;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-sm);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    border-color var(--transition-fast);
}

.book-card--with-position {
  grid-template-columns: auto auto minmax(0, 1fr);
}

.book-card--interactive:hover {
  transform: translateY(-2px);
  border-color: rgba(53, 95, 74, 0.2);
  box-shadow: var(--shadow-md);
}

.book-card-position {
  width: 2.1rem;
  height: 2.1rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
}

.book-card-cover {
  width: 4.85rem;
  height: 7rem;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(233, 238, 230, 0.84)),
    var(--color-surface-soft);
  border: 1px solid rgba(173, 184, 165, 0.82);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.42),
    0 10px 20px rgba(36, 51, 43, 0.08);
}

.book-card-cover-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.book-card-cover-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  padding: 0.85rem 0.7rem;
  text-align: center;
  color: var(--color-heading);
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.3;
  background:
    linear-gradient(180deg, rgba(248, 246, 240, 0.98), rgba(233, 238, 230, 0.9));
}

.book-card-content {
  display: grid;
  gap: var(--space-xs);
  min-width: 0;
  color: var(--color-heading);
}

.book-card-content strong,
.book-card-content span {
  overflow-wrap: anywhere;
}

.book-card-content span {
  color: var(--color-muted);
}

.book-card-actions {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .book-card--with-position {
    grid-template-columns: auto 4.85rem 1fr;
  }
}
</style>
