import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const MOBILE_MAX_WIDTH = 767
const MOBILE_MINIMUM_BOTTOM_OFFSET = 64

export function getViewportBottomOffset() {
  if (window.innerWidth > MOBILE_MAX_WIDTH) {
    return 0
  }

  if (!window.visualViewport) {
    return MOBILE_MINIMUM_BOTTOM_OFFSET
  }

  const viewportBottom = window.visualViewport.height + window.visualViewport.offsetTop
  const dynamicOffset = Math.max(0, Math.round(window.innerHeight - viewportBottom))

  return Math.max(MOBILE_MINIMUM_BOTTOM_OFFSET, dynamicOffset)
}

export function useViewportBottomOffset() {
  const offset = ref(0)

  function updateOffset() {
    offset.value = getViewportBottomOffset()
  }

  onMounted(() => {
    updateOffset()

    window.addEventListener('resize', updateOffset)
    window.visualViewport?.addEventListener('resize', updateOffset)
    window.visualViewport?.addEventListener('scroll', updateOffset)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateOffset)
    window.visualViewport?.removeEventListener('resize', updateOffset)
    window.visualViewport?.removeEventListener('scroll', updateOffset)
  })

  const viewportStyle = computed(() => ({
    '--viewport-bottom-offset': `${offset.value}px`,
  }))

  return {
    offset,
    viewportStyle,
  }
}
