<script setup lang="ts">
import ResponsiveSheetModal from './ResponsiveSheetModal.vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  panelTestid?: string
}>(), {
  cancelLabel: 'Cancelar',
  tone: 'default',
  panelTestid: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

function close() {
  emit('update:modelValue', false)
}

function cancel() {
  emit('cancel')
  close()
}

function confirm() {
  emit('confirm')
}
</script>

<template>
  <ResponsiveSheetModal
    :model-value="props.modelValue"
    :title="props.title"
    :description="props.message"
    :panel-testid="props.panelTestid"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="confirm-sheet-actions">
      <button
        type="button"
        class="confirm-sheet-button confirm-sheet-button--cancel"
        data-testid="confirm-sheet-cancel"
        @click="cancel"
      >
        {{ props.cancelLabel }}
      </button>

      <button
        type="button"
        class="confirm-sheet-button"
        :class="{ 'confirm-sheet-button--danger': props.tone === 'danger' }"
        data-testid="confirm-sheet-confirm"
        @click="confirm"
      >
        {{ props.confirmLabel }}
      </button>
    </div>

    <div
      class="confirm-sheet-bottom-spacer"
      aria-hidden="true"
      data-testid="confirm-sheet-bottom-spacer"
    ></div>
  </ResponsiveSheetModal>
</template>

<style scoped>
.confirm-sheet-actions {
  display: grid;
  gap: var(--space-sm);
}

.confirm-sheet-bottom-spacer {
  min-height: var(--space-sm);
}

.confirm-sheet-button {
  min-height: 3.15rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 500;
  box-shadow: var(--shadow-md);
}

.confirm-sheet-button--cancel {
  border-color: var(--color-border);
  background: var(--color-surface);
  color: var(--color-heading);
  box-shadow: none;
}

.confirm-sheet-button--danger {
  border-color: var(--color-danger);
  background: var(--color-danger);
}

.confirm-sheet-button:focus-visible {
  outline: 3px solid var(--color-primary-focus);
  outline-offset: 2px;
}

@media (min-width: 520px) {
  .confirm-sheet-actions {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
