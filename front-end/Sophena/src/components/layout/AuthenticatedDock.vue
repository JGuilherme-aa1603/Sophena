<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { bookOutline, libraryOutline, logOutOutline } from 'ionicons/icons'

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
      <IonIcon
        class="dock-link-icon"
        :icon="libraryOutline"
        aria-hidden="true"
        data-testid="dock-icon-lists"
      />
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
      <IonIcon
        class="dock-link-icon"
        :icon="bookOutline"
        aria-hidden="true"
        data-testid="dock-icon-admin"
      />
      <span class="dock-link-label">Admin</span>
    </button>

    <button
      type="button"
      class="dock-link dock-link--danger"
      data-testid="dock-action-logout"
      @click="emit('logout')"
    >
      <IonIcon
        class="dock-link-icon"
        :icon="logOutOutline"
        aria-hidden="true"
        data-testid="dock-icon-logout"
      />
      <span class="dock-link-label">Sair</span>
    </button>
  </nav>
</template>

<style scoped>
.authenticated-dock {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
  z-index: 30;
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  justify-content: space-around;
  padding: 10px;
  border: 1px solid rgba(226, 224, 219, 0.92);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 -4px 16px rgba(36, 51, 43, 0.04), var(--shadow-lg);
  backdrop-filter: blur(12px);
}

.dock-link {
  min-width: 5.25rem;
  min-height: 3rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
  align-items: center;
  justify-content: center;
  padding: 0.8rem 0.95rem;
  border: 0;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-weight: 700;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}

.dock-link-label {
  display: block;
  line-height: 1.1;
  text-align: center;
}

.dock-link-icon {
  width: 1.2rem;
  height: 1.2rem;
}

.dock-link:hover {
  background: rgba(53, 95, 74, 0.08);
}

.dock-link:focus-visible {
  outline: 3px solid rgba(53, 95, 74, 0.22);
  outline-offset: 2px;
}

.dock-link--active {
  background: var(--color-primary);
  color: #fff;
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.dock-link--danger {
  color: var(--color-danger);
  flex: 0.78;
  font-weight: 600;
}

.dock-link--danger:hover {
  background: rgba(217, 83, 79, 0.08);
}

@media (min-width: 768px) {
  .authenticated-dock {
    left: 50%;
    right: auto;
    min-width: 22rem;
    transform: translateX(-50%);
  }
}
</style>
