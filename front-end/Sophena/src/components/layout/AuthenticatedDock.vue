<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  activeRoute: string
  showAdmin: boolean
}>()

const emit = defineEmits<{
  navigate: [target: 'app-home' | 'admin-home']
  logout: []
}>()

const isListsActive = computed(() => props.activeRoute === 'app-home' || props.activeRoute === 'list-detail')
const isAdminActive = computed(() => props.activeRoute.startsWith('admin-'))
</script>

<template>
  <nav class="authenticated-dock" aria-label="Navegação principal" data-testid="authenticated-dock">
    <button
      type="button"
      class="dock-link"
      :class="{ 'dock-link--active': isListsActive }"
      :aria-current="isListsActive ? 'page' : undefined"
      data-testid="dock-link-lists"
      @click="emit('navigate', 'app-home')"
    >
      <span class="dock-link-label">Listas</span>
    </button>

    <button
      v-if="showAdmin"
      type="button"
      class="dock-link"
      :class="{ 'dock-link--active': isAdminActive }"
      :aria-current="isAdminActive ? 'page' : undefined"
      data-testid="dock-link-admin"
      @click="emit('navigate', 'admin-home')"
    >
      <span class="dock-link-label">Admin</span>
    </button>

    <button
      type="button"
      class="dock-link dock-link--danger"
      data-testid="dock-action-logout"
      @click="emit('logout')"
    >
      <span class="dock-link-label">Sair</span>
    </button>
  </nav>
</template>

<style scoped>
.authenticated-dock {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 0.75rem);
  z-index: 30;
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border: 1px solid rgba(215, 222, 207, 0.92);
  border-radius: 999px;
  background: rgba(255, 253, 249, 0.94);
  box-shadow: var(--shadow-lifted);
  backdrop-filter: blur(12px);
  transform: translateX(-50%);
}

.dock-link {
  min-width: 5.5rem;
  min-height: 3rem;
  padding: 0.8rem 1rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-heading);
  font: inherit;
  font-weight: 700;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    transform var(--transition-fast);
}

.dock-link-label {
  display: block;
  line-height: 1;
}

.dock-link:hover {
  background: rgba(51, 92, 71, 0.08);
}

.dock-link:focus-visible {
  outline: 3px solid rgba(78, 129, 102, 0.28);
  outline-offset: 2px;
}

.dock-link--active {
  background: var(--color-primary);
  color: #fffdf9;
}

.dock-link--danger {
  color: var(--color-danger);
}

.dock-link--danger:hover {
  background: rgba(157, 63, 52, 0.08);
}

@media (min-width: 768px) {
  .authenticated-dock {
    bottom: 1rem;
  }
}
</style>
