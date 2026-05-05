<script setup lang="ts">
import { computed } from 'vue'
import { useThemePreferencesStore } from '@/stores/theme-preferences'

withDefaults(defineProps<{
  size?: number
  showName?: boolean
}>(), {
  size: 32,
  showName: true,
})

const themePrefs = useThemePreferencesStore()

// green (sálvia) e purple (violeta) mantêm o logo original sem filtro
const isTinted = computed(() =>
  themePrefs.accentColor !== 'green' && themePrefs.accentColor !== 'purple',
)
</script>

<template>
  <div class="sophena-wordmark">
    <!-- Temas com filtro: máscara CSS preenche o logo com a cor primária do tema -->
    <div
      v-if="isTinted"
      class="sophena-wordmark__logo sophena-wordmark__logo--tinted"
      :style="{ width: `${size}px`, height: `${size}px` }"
      role="img"
      aria-label="Sophena"
    />
    <!-- Exceções (sálvia e violeta): logo original sem alteração -->
    <img
      v-else
      :width="size"
      :height="size"
      src="/sophena-logo.png"
      alt="Sophena"
      class="sophena-wordmark__logo"
    >
    <span v-if="showName" class="sophena-wordmark__name">Sophena</span>
  </div>
</template>

<style scoped>
.sophena-wordmark {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sophena-wordmark__logo {
  display: block;
  object-fit: contain;
  flex-shrink: 0;
}

.sophena-wordmark__logo--tinted {
  background-color: var(--color-primary-readable);
  -webkit-mask-image: url('/sophena-logo.png');
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
  mask-image: url('/sophena-logo.png');
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  transition: background-color 0.25s ease;
}

.sophena-wordmark__name {
  font-family: var(--font-serif);
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--color-heading);
  line-height: 1;
  font-size: calc(v-bind(size) * 0.65px);
}
</style>
