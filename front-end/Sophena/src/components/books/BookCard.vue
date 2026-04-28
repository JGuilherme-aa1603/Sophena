<script setup lang="ts">
import { computed } from 'vue'

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

const resolvedCoverAlt = computed(() => props.coverAlt ?? `Capa do livro ${props.title}`)
</script>

<template>
  <article
    class="book-card"
    :class="{ 'book-card--with-position': showPosition }"
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

    <div v-if="$slots.actions" class="book-card-actions" data-testid="book-card-actions">
      <slot name="actions" />
    </div>
  </article>
</template>

<style scoped>
.book-card {
  display: grid;
  gap: 0.75rem;
  align-items: center;
  padding: 0.95rem 1rem;
  border: 1px solid #d7dfd4;
  border-radius: 1rem;
  background: #fffdf9;
}

.book-card--with-position {
  grid-template-columns: auto auto minmax(0, 1fr);
}

.book-card-position {
  width: 2.1rem;
  height: 2.1rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #e3ebdf;
  color: #244234;
  font-weight: 700;
}

.book-card-cover {
  width: 4rem;
  height: 5.75rem;
  border-radius: 0.85rem;
  overflow: hidden;
  background: #eef3ea;
  border: 1px solid #d6decf;
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
  padding: 0.5rem;
  text-align: center;
  color: #58715f;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.2;
}

.book-card-content {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
  color: #22332c;
}

.book-card-content strong,
.book-card-content span {
  overflow-wrap: anywhere;
}

.book-card-content span {
  color: #51665c;
}

.book-card-actions {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .book-card--with-position {
    grid-template-columns: auto 4rem 1fr;
  }
}
</style>
