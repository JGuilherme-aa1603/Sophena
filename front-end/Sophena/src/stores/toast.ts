import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ToastTone = 'success' | 'error' | 'warning'

export type ToastMessage = {
  id: number
  message: string
  tone: ToastTone
}

let nextToastId = 1
let activeTimeout: ReturnType<typeof setTimeout> | null = null

export const useToastStore = defineStore('toast', () => {
  const current = ref<ToastMessage | null>(null)

  function clearTimer() {
    if (!activeTimeout) {
      return
    }

    clearTimeout(activeTimeout)
    activeTimeout = null
  }

  function clear() {
    clearTimer()
    current.value = null
  }

  function show(message: string, tone: ToastTone, duration = 3200) {
    clearTimer()
    current.value = {
      id: nextToastId,
      message,
      tone,
    }
    nextToastId += 1

    if (duration > 0) {
      activeTimeout = setTimeout(() => {
        current.value = null
        activeTimeout = null
      }, duration)
    }
  }

  function showSuccess(message: string, duration?: number) {
    show(message, 'success', duration)
  }

  function showError(message: string, duration?: number) {
    show(message, 'error', duration)
  }

  function showWarning(message: string, duration?: number) {
    show(message, 'warning', duration)
  }

  return {
    current,
    clear,
    showSuccess,
    showError,
    showWarning,
  }
})
