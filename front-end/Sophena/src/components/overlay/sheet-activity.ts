import { computed, ref } from 'vue'

const activeSheetCount = ref(0)

export const hasActiveSheet = computed(() => activeSheetCount.value > 0)

export function registerActiveSheet() {
  activeSheetCount.value += 1
}

export function unregisterActiveSheet() {
  activeSheetCount.value = Math.max(0, activeSheetCount.value - 1)
}
