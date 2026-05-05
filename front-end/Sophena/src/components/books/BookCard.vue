<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  author: string
  coverUrl: string | null
  position?: number
  showPosition?: boolean
  coverAlt?: string
  layout?: 'comfortable' | 'compact'
}>(), {
  position: undefined,
  showPosition: false,
  coverAlt: undefined,
  layout: 'comfortable',
})

const slots = useSlots()
const resolvedCoverAlt = computed(() => props.coverAlt ?? `${props.title}`)
const hasActions = computed(() => Boolean(slots.actions))
const useOverlayControls = computed(() => props.layout === 'compact')
</script>

<template>
  <article
    class="book-card"
    :class="{
      'book-card--comfortable': props.layout === 'comfortable',
      'book-card--compact': props.layout === 'compact',
      'book-card--with-actions': hasActions,
      'book-card--interactive': hasActions,
      'book-card--with-overlay-controls': useOverlayControls,
    }"
    data-testid="book-card"
  >
    <div class="book-card-main" data-testid="book-card-main">
      <div class="book-card-media" data-testid="book-card-media">
        <div
          v-if="showPosition"
          class="book-card-position"
          data-testid="book-card-position"
          :data-placement="useOverlayControls ? 'cover-overlay' : 'inline'"
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
            :class="{ 'book-card-cover-fallback--centered': props.layout === 'compact' }"
            data-testid="book-card-cover-fallback"
          >
            {{ title }}
          </div>
        </div>

        <div
          v-if="hasActions && useOverlayControls"
          class="book-card-actions"
          data-testid="book-card-actions"
          data-placement="cover-overlay"
        >
          <slot name="actions" />
        </div>
      </div>

      <div class="book-card-details" data-testid="book-card-details">
        <div class="book-card-content">
          <strong data-testid="book-card-title">{{ title }}</strong>
          <span data-testid="book-card-author">{{ author }}</span>
        </div>
      </div>

      <div
        v-if="hasActions && !useOverlayControls"
        class="book-card-actions"
        data-testid="book-card-actions"
        data-placement="inline"
      >
        <slot name="actions" />
      </div>
    </div>
  </article>
</template>

<style scoped>
.book-card {
  display: block;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-card);
  box-shadow: var(--shadow-sm);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    background-color 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease;
}

.book-card--compact {
  position: relative;
  padding: 0.9rem 0.75rem 0.85rem;
}

.book-card--interactive:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary-border);
  box-shadow: var(--shadow-md);
}

.book-card-main {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-md);
  align-items: center;
}

.book-card--with-actions .book-card-main {
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.book-card-media {
  position: relative;
  display: grid;
  grid-template-columns: auto auto;
  gap: 0.7rem;
  align-items: center;
  justify-content: start;
}

.book-card-position {
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: 1px solid var(--color-primary-border-soft);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 500;
  box-shadow: inset 0 1px 0 var(--color-inset-highlight);
}

.book-card-cover {
  width: 4.55rem;
  height: 6.65rem;
  display: grid;
  place-items: center;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background:
    linear-gradient(180deg, var(--color-cover-highlight), var(--color-primary-cover-gradient)),
    var(--color-surface-soft);
  border: 1px solid var(--color-primary-cover-border);
  box-shadow:
    inset 0 0 0 1px var(--color-cover-inner-border),
    0 10px 20px var(--color-shadow-accent-soft);
}

.book-card-cover-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.book-card-cover-fallback {
  --book-card-cover-fallback-font-size: clamp(0.56rem, 0.45rem + 0.6vw, 0.65rem);
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  padding: 0.85rem 0.7rem;
  text-align: center;
  color: var(--color-heading);
  font-size: var(--book-card-cover-fallback-font-size);
  font-weight: 700;
  line-height: 1.3;
  background:
    linear-gradient(180deg, var(--color-cover-fallback-start), var(--color-primary-cover-fallback));
}

.book-card--with-overlay-controls .book-card-cover-fallback {
  --book-card-cover-fallback-font-size: 0.58rem;
}

.book-card-cover-fallback--centered {
  justify-items: center;
  align-content: center;
}

.book-card-details {
  min-width: 0;
  align-self: center;
}

.book-card-content {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
  color: var(--color-heading);
  align-content: start;
}

.book-card-content strong,
.book-card-content span {
  overflow-wrap: anywhere;
}

.book-card-content strong {
  font-family: var(--font-serif);
  font-size: 1.08rem;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.book-card-content span {
  color: var(--color-muted);
  font-family: var(--font-serif);
  font-size: 0.92rem;
  font-style: italic;
  line-height: 1.4;
}

.book-card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  align-self: start;
}

.book-card--compact .book-card-main {
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-sm);
  justify-items: stretch;
}

.book-card--compact.book-card--with-actions .book-card-main {
  grid-template-columns: minmax(0, 1fr);
}

.book-card--compact .book-card-media {
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  justify-items: center;
  width: 100%;
  padding-top: 0.25rem;
}

.book-card--compact .book-card-position {
  position: absolute;
  top: 0.15rem;
  left: 0.15rem;
  z-index: 1;
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  padding: 0;
  font-size: 0.82rem;
  line-height: 1.2;
  box-shadow: 0 8px 18px var(--color-shadow-accent-medium);
}

.book-card--compact .book-card-cover {
  width: min(100%, 7rem);
  height: auto;
  aspect-ratio: 0.69;
}

.book-card--compact .book-card-details {
  text-align: center;
}

.book-card--compact .book-card-content {
  gap: 0.28rem;
}

.book-card--compact .book-card-content strong {
  font-size: 0.92rem;
  line-height: 1.3;
}

.book-card--compact .book-card-content span {
  font-size: 0.82rem;
  line-height: 1.35;
}

.book-card--compact .book-card-actions {
  position: absolute;
  top: 0.15rem;
  right: 0.15rem;
  z-index: 1;
  align-self: auto;
}

@media (min-width: 641px) {
  .book-card-cover {
    width: 4.85rem;
    height: 7rem;
  }

  .book-card-cover-fallback {
    --book-card-cover-fallback-font-size: clamp(0.58rem, 0.4rem + 0.45vw, 0.68rem);
  }

  .book-card--with-overlay-controls .book-card-cover-fallback {
    --book-card-cover-fallback-font-size: 0.54rem;
  }

  .book-card--compact .book-card-cover {
    width: min(100%, 7.4rem);
  }
}
</style>
