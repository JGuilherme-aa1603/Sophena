<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  description?: string
  panelTestid?: string
  closeTestid?: string
}>(), {
  description: '',
  panelTestid: undefined,
  closeTestid: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close() {
  emit('update:modelValue', false)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    window.addEventListener('keydown', handleKeydown)
    return
  }

  window.removeEventListener('keydown', handleKeydown)
}, { immediate: true })

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Transition name="sheet-fade">
    <div
      v-if="modelValue"
      class="sheet-overlay"
      @click.self="close"
    >
      <section
        class="sheet-panel"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        :data-testid="panelTestid"
      >
        <header class="sheet-header">
          <div class="sheet-title-group">
            <p class="sheet-kicker">Sophena</p>
            <h2>{{ title }}</h2>
            <p v-if="description" class="sheet-description">{{ description }}</p>
          </div>

          <button
            type="button"
            class="sheet-close"
            :data-testid="closeTestid"
            @click="close"
          >
            Fechar
          </button>
        </header>

        <div class="sheet-body">
          <slot />
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: var(--space-md);
  background: var(--color-overlay);
}

.sheet-panel {
  width: min(100%, 42rem);
  max-height: min(88vh, 48rem);
  overflow: auto;
  border: 1px solid rgba(226, 224, 219, 0.88);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: var(--shadow-lg);
}

.sheet-header {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-lg) var(--space-sm);
}

.sheet-title-group {
  display: grid;
  gap: var(--space-xs);
}

.sheet-kicker {
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sheet-title-group h2 {
  color: var(--color-heading);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}

.sheet-description {
  color: var(--color-muted);
}

.sheet-close {
  min-height: 2.75rem;
  padding: 0.75rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--color-heading);
  font: inherit;
  font-weight: 700;
}

.sheet-close:focus-visible {
  outline: 3px solid rgba(53, 95, 74, 0.22);
  outline-offset: 2px;
}

.sheet-body {
  padding: var(--space-sm) var(--space-lg) var(--space-lg);
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity var(--transition-soft);
}

.sheet-fade-enter-active .sheet-panel,
.sheet-fade-leave-active .sheet-panel {
  transition: transform var(--transition-soft);
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.sheet-fade-enter-from .sheet-panel,
.sheet-fade-leave-to .sheet-panel {
  transform: translateY(1.5rem);
}

@media (min-width: 768px) {
  .sheet-overlay {
    align-items: center;
  }

  .sheet-panel {
    border-radius: var(--radius-xl);
  }
}
</style>
