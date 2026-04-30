<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { bookOutline, libraryOutline, settingsOutline } from 'ionicons/icons'

const props = defineProps<{
  activeRoute: string
  showAdmin: boolean
  userName: string
  userPictureUrl: string | null
}>()

const emit = defineEmits<{
  navigate: [target: 'app-home' | 'books' | 'admin-home']
  profile: []
}>()

const isListsActive = computed(() => props.activeRoute === 'app-home' || props.activeRoute === 'list-detail')
const isBooksActive = computed(() => props.activeRoute === 'books')
const isAdminActive = computed(() => props.activeRoute.startsWith('admin-'))
const isProfileActive = computed(() => props.activeRoute === 'profile')
const profileInitial = computed(() => props.userName.trim().slice(0, 1).toUpperCase() || 'U')

function clearPointerFocus(event: MouseEvent) {
  if (event.detail <= 0) {
    return
  }

  const target = event.currentTarget

  if (target instanceof HTMLButtonElement) {
    target.blur()
  }
}

function navigateFromDock(event: MouseEvent, target: 'app-home' | 'books' | 'admin-home') {
  clearPointerFocus(event)
  emit('navigate', target)
}

function openProfileFromDock(event: MouseEvent) {
  clearPointerFocus(event)
  emit('profile')
}

</script>

<template>
  <nav class="authenticated-dock" aria-label="Navegação principal" data-testid="authenticated-dock">
    <button
      type="button"
      class="dock-link"
      :class="{ 'dock-link--active': isListsActive }"
      :aria-current="isListsActive ? 'page' : undefined"
      data-testid="dock-link-lists"
      @click="navigateFromDock($event, 'app-home')"
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
      type="button"
      class="dock-link"
      :class="{ 'dock-link--active': isBooksActive }"
      :aria-current="isBooksActive ? 'page' : undefined"
      data-testid="dock-link-books"
      @click="navigateFromDock($event, 'books')"
    >
      <IonIcon
        class="dock-link-icon"
        :icon="bookOutline"
        aria-hidden="true"
        data-testid="dock-icon-books"
      />
      <span class="dock-link-label">Livros</span>
    </button>

    <button
      v-if="showAdmin"
      type="button"
      class="dock-link"
      :class="{ 'dock-link--active': isAdminActive }"
      :aria-current="isAdminActive ? 'page' : undefined"
      data-testid="dock-link-admin"
      @click="navigateFromDock($event, 'admin-home')"
    >
      <IonIcon
        class="dock-link-icon"
        :icon="settingsOutline"
        aria-hidden="true"
        data-testid="dock-icon-admin"
      />
      <span class="dock-link-label">Admin</span>
    </button>

    <button
      type="button"
      class="dock-link dock-link--profile"
      :class="{ 'dock-link--active': isProfileActive }"
      :aria-current="isProfileActive ? 'page' : undefined"
      data-testid="dock-action-profile"
      @click="openProfileFromDock"
    >
      <span
        class="dock-profile-avatar"
        :class="{ 'dock-profile-avatar--active': isProfileActive && !userPictureUrl }"
      >
        <img
          v-if="userPictureUrl"
          class="dock-profile-image"
          :src="userPictureUrl"
          :alt="`Foto de perfil de ${userName}`"
          data-testid="dock-profile-image"
        >
        <span
          v-else
          class="dock-profile-fallback"
          :class="{ 'dock-profile-fallback--active': isProfileActive }"
          data-testid="dock-profile-fallback"
        >
          {{ profileInitial }}
        </span>
      </span>
      <span class="dock-link-label">Perfil</span>
    </button>
  </nav>
</template>

<style scoped>
.authenticated-dock {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + var(--viewport-bottom-offset, 0px) + 16px);
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
  min-width: 4.35rem;
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
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-weight: 700;
  -webkit-tap-highlight-color: transparent;
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

.dock-link:focus-visible {
  outline: 3px solid rgba(53, 95, 74, 0.22);
  outline-offset: 2px;
}

.dock-link:active {
  background: rgba(53, 95, 74, 0.12);
}

.dock-link--active {
  background: var(--color-primary);
  color: #fff;
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.dock-link--profile {
  flex: 0.78;
  font-weight: 600;
}

.dock-profile-avatar {
  width: 1.45rem;
  height: 1.45rem;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(53, 95, 74, 0.18);
  border-radius: 999px;
  background: rgba(53, 95, 74, 0.1);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 800;
}

.dock-profile-avatar--active {
  border-color: rgba(255, 255, 255, 0.92);
  background: #fff;
}

.dock-profile-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.dock-profile-fallback {
  line-height: 1;
}

.dock-profile-fallback--active {
  color: var(--color-primary);
}

@media (hover: hover) and (pointer: fine) {
  .dock-link:hover {
    background: rgba(53, 95, 74, 0.08);
  }

  .dock-link--profile:hover {
    background: rgba(53, 95, 74, 0.08);
  }
}

@media (min-width: 768px) {
  .authenticated-dock {
    left: 50%;
    right: auto;
    min-width: 26rem;
    transform: translateX(-50%);
  }
}
</style>
