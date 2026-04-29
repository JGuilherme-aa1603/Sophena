<script setup lang="ts">
import { computed } from 'vue'

import { useToastStore, type ToastTone } from '@/stores/toast'

const toastStore = useToastStore()

const currentToast = computed(() => toastStore.current)
const toastRole = computed(() => currentToast.value?.tone === 'error' ? 'alert' : 'status')
const toastLabel = computed(() => {
  const tone = currentToast.value?.tone

  if (tone === 'success') return 'Tudo certo'
  if (tone === 'warning') return 'Atenção'
  return 'Aviso'
})

function toneClass(tone: ToastTone) {
  return `app-toast--${tone}`
}
</script>

<template>
  <Transition name="app-toast-fade">
    <div
      v-if="currentToast"
      class="app-toast"
      :class="toneClass(currentToast.tone)"
      :role="toastRole"
      aria-live="polite"
      data-testid="app-toast"
    >
      <div class="app-toast-copy">
        <strong>{{ toastLabel }}</strong>
        <span>{{ currentToast.message }}</span>
      </div>

      <button
        type="button"
        class="app-toast-close"
        aria-label="Fechar aviso"
        data-testid="close-app-toast"
        @click="toastStore.clear"
      >
        Fechar
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.app-toast {
  position: fixed;
  left: 50%;
  bottom: calc(var(--dock-height) + env(safe-area-inset-bottom, 0px) + var(--space-lg));
  z-index: 35;
  width: min(calc(100% - 2rem), 34rem);
  display: flex;
  gap: var(--space-md);
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 0.9rem 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.98);
  color: var(--color-heading);
  box-shadow: var(--shadow-lg);
  transform: translateX(-50%);
}

.app-toast::before {
  content: '';
  width: 0.45rem;
  align-self: stretch;
  border-radius: 999px;
  background: var(--color-primary);
}

.app-toast--success::before {
  background: var(--color-success);
}

.app-toast--error::before {
  background: var(--color-danger);
}

.app-toast--warning::before {
  background: var(--color-warning);
}

.app-toast-copy {
  min-width: 0;
  display: grid;
  gap: 0.1rem;
  flex: 1;
}

.app-toast-copy strong {
  color: var(--color-heading);
  font-size: 0.9rem;
  font-weight: 700;
}

.app-toast-copy span {
  color: var(--color-muted);
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.app-toast-close {
  min-height: 2.4rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-heading);
  font: inherit;
  font-weight: 700;
}

.app-toast-close:focus-visible {
  outline: 3px solid rgba(53, 95, 74, 0.22);
  outline-offset: 2px;
}

.app-toast-fade-enter-active,
.app-toast-fade-leave-active {
  transition:
    opacity var(--transition-soft),
    transform var(--transition-soft);
}

.app-toast-fade-enter-from,
.app-toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 0.6rem);
}

@media (max-width: 420px) {
  .app-toast {
    align-items: stretch;
  }

  .app-toast-close {
    align-self: center;
  }
}
</style>
