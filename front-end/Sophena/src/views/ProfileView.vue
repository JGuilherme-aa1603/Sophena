<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import {
  cameraOutline,
  colorPaletteOutline,
  logOutOutline,
  personCircleOutline,
  trashOutline,
} from 'ionicons/icons'
import { useRouter } from 'vue-router'

import AuthenticatedScaffold from '@/components/layout/AuthenticatedScaffold.vue'
import AppConfirmSheet from '@/components/overlay/AppConfirmSheet.vue'
import ResponsiveSheetModal from '@/components/overlay/ResponsiveSheetModal.vue'
import { useAuthStore } from '@/stores/auth'
import {
  useThemePreferencesStore,
  type AccentColor,
  type AppearanceMode,
} from '@/stores/theme-preferences'
import { useToastStore } from '@/stores/toast'

const authStore = useAuthStore()
const themePreferencesStore = useThemePreferencesStore()
const toastStore = useToastStore()
const router = useRouter()
const pictureFileInput = ref<HTMLInputElement | null>(null)
const isPictureOptionsOpen = ref(false)
const isThemeOptionsOpen = ref(false)
const isRemovePictureConfirmOpen = ref(false)
const isLogoutConfirmOpen = ref(false)
const isPictureZoomOpen = ref(false)

const userName = computed(() => authStore.user?.user_name ?? '')
const userPictureUrl = computed(() => authStore.user?.user_picture_url ?? null)
const profileInitial = computed(() => userName.value.trim().slice(0, 1).toUpperCase() || 'U')
const accountTypeLabel = computed(() => (authStore.user?.is_admin ? 'Administrador' : 'Usuário'))
const themeOptions = [
  {
    accentColor: 'green' as const,
    label: 'Clássico',
    description: 'Verde original do Sophena',
    testId: 'profile-theme-green',
  },
  {
    accentColor: 'purple' as const,
    label: 'Moderno',
    description: 'Roxo para destacar ações e atalhos',
    testId: 'profile-theme-purple',
  },
]
const appearanceOptions = [
  {
    appearance: 'light' as const,
    label: 'Claro',
    description: 'Fundo claro para usar durante o dia',
    testId: 'profile-appearance-light',
  },
  {
    appearance: 'dark' as const,
    label: 'Escuro',
    description: 'Tons escuros para reduzir o brilho da tela',
    testId: 'profile-appearance-dark',
  },
]

function requestPictureOptions() {
  isPictureOptionsOpen.value = true
}

function requestThemeOptions() {
  isThemeOptionsOpen.value = true
}

function selectAccentColor(accentColor: AccentColor) {
  themePreferencesStore.setAccentColor(accentColor)
}

function selectAppearance(appearance: AppearanceMode) {
  themePreferencesStore.setAppearance(appearance)
}

function openPictureZoom() {
  if (!userPictureUrl.value) {
    return
  }

  isPictureZoomOpen.value = true
}

function closePictureZoom() {
  isPictureZoomOpen.value = false
}

function requestPictureChange() {
  pictureFileInput.value?.click()
}

async function updateProfilePicture(event: Event) {
  const input = event.target

  if (!(input instanceof HTMLInputElement)) {
    return
  }

  const file = input.files?.[0]
  input.value = ''

  if (!file) {
    return
  }

  try {
    await authStore.updateUserPicture(file)
    isPictureOptionsOpen.value = false
    toastStore.showSuccess('Foto atualizada com sucesso.')
  } catch {
    toastStore.showError(authStore.errorMessage || 'Não foi possível alterar a foto agora.')
  }
}

function requestRemovePicture() {
  isPictureOptionsOpen.value = false
  isRemovePictureConfirmOpen.value = true
}

async function removeProfilePicture() {
  try {
    await authStore.removeUserPicture()
    isRemovePictureConfirmOpen.value = false
    toastStore.showSuccess('Foto removida com sucesso.')
  } catch {
    isRemovePictureConfirmOpen.value = false
    toastStore.showError(authStore.errorMessage || 'Não foi possível remover a foto agora.')
  }
}

function requestLogout() {
  isLogoutConfirmOpen.value = true
}

async function logoutFromProfile() {
  try {
    await authStore.logout()
    isLogoutConfirmOpen.value = false
    await router.replace('/login')
  } catch {
    isLogoutConfirmOpen.value = false
    toastStore.showError(authStore.errorMessage || 'Não foi possível sair agora.')
  }
}
</script>

<template>
  <AuthenticatedScaffold page-class="profile-page">
    <header class="app-page-header">
      <div class="app-page-header__title">
        <p class="app-page-kicker">Sophena</p>
        <h1 class="app-page-title">Perfil</h1>
        <p class="app-page-subtitle">Confira seus dados de acesso.</p>
      </div>
    </header>

    <section class="profile-summary app-fade-in" data-testid="profile-summary">
      <button
        v-if="userPictureUrl"
        type="button"
        class="profile-avatar profile-avatar--button"
        :aria-label="`Ampliar foto de perfil de ${userName}`"
        data-testid="profile-picture-zoom-trigger"
        @click="openPictureZoom"
      >
        <img
          class="profile-avatar-image"
          :src="userPictureUrl"
          :alt="`Foto de perfil de ${userName}`"
          data-testid="profile-picture-image"
        >
      </button>

      <div v-else class="profile-avatar" data-testid="profile-avatar">
        <span
          class="profile-avatar-fallback"
          data-testid="profile-picture-fallback"
        >
          {{ profileInitial }}
        </span>
      </div>

      <div class="profile-summary-copy">
        <span class="profile-field-label">Usuário</span>
        <strong data-testid="profile-user-name">{{ userName }}</strong>
        <span class="profile-account-type" data-testid="profile-account-type">{{ accountTypeLabel }}</span>
      </div>
    </section>

    <div
      v-if="isPictureZoomOpen && userPictureUrl"
      class="profile-picture-zoom-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="`Foto de perfil de ${userName}`"
      data-testid="profile-picture-zoom-overlay"
      @click.self="closePictureZoom"
    >
      <img
        class="profile-picture-zoom-image"
        :src="userPictureUrl"
        :alt="`Foto de perfil de ${userName}`"
        data-testid="profile-picture-zoom-image"
        @click.stop
      >
    </div>

    <section class="profile-options app-fade-in" aria-label="Opções do perfil">
      <button
        type="button"
        class="profile-option"
        data-testid="profile-picture-option"
        @click="requestPictureOptions"
      >
        <span class="profile-option-icon">
          <IonIcon :icon="personCircleOutline" aria-hidden="true" />
        </span>
        <span class="profile-option-copy">
          <strong>Foto de perfil</strong>
          <span>{{ userPictureUrl ? 'Foto adicionada' : 'Sem foto' }}</span>
        </span>
      </button>

      <button
        type="button"
        class="profile-option"
        data-testid="profile-action-themes"
        @click="requestThemeOptions"
      >
        <span class="profile-option-icon">
          <IonIcon :icon="colorPaletteOutline" aria-hidden="true" />
        </span>
        <span class="profile-option-copy">
          <strong>Temas</strong>
          <span>Escolher cor e aparência</span>
        </span>
      </button>

      <button
        type="button"
        class="profile-option profile-option--danger"
        data-testid="profile-action-logout"
        @click="requestLogout"
      >
        <span class="profile-option-icon">
          <IonIcon :icon="logOutOutline" aria-hidden="true" />
        </span>
        <span class="profile-option-copy">
          <strong>Sair</strong>
          <span>Encerrar esta sessão</span>
        </span>
      </button>
    </section>

    <input
      ref="pictureFileInput"
      name="profile-picture-file"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="profile-file-input"
      data-testid="profile-picture-file"
      @change="updateProfilePicture"
    >

    <ResponsiveSheetModal
      v-model="isPictureOptionsOpen"
      title="Foto de perfil"
      panel-testid="profile-picture-options-sheet"
    >
      <div class="profile-picture-actions">
        <button
          type="button"
          class="profile-sheet-button"
          :disabled="authStore.isUpdatingPicture"
          data-testid="profile-action-change-picture"
          @click="requestPictureChange"
        >
          <IonIcon :icon="cameraOutline" aria-hidden="true" />
          Alterar foto
        </button>

        <button
          type="button"
          class="profile-sheet-button profile-sheet-button--danger"
          :disabled="authStore.isUpdatingPicture || !userPictureUrl"
          data-testid="profile-action-remove-picture"
          @click="requestRemovePicture"
        >
          <IonIcon :icon="trashOutline" aria-hidden="true" />
          Remover foto
        </button>
      </div>
    </ResponsiveSheetModal>

    <ResponsiveSheetModal
      v-model="isThemeOptionsOpen"
      title="Temas"
      description="Escolha a cor e a aparência do Sophena."
      panel-testid="profile-theme-options-sheet"
    >
      <div class="profile-theme-sections">
        <section class="profile-theme-section" aria-labelledby="profile-accent-title">
          <h3 id="profile-accent-title">Cor do tema</h3>

          <div class="profile-theme-options" role="group" aria-label="Cores do tema">
            <button
              v-for="themeOption in themeOptions"
              :key="themeOption.accentColor"
              type="button"
              class="profile-theme-option"
              :class="{ 'profile-theme-option--active': themePreferencesStore.accentColor === themeOption.accentColor }"
              :aria-pressed="themePreferencesStore.accentColor === themeOption.accentColor"
              :data-testid="themeOption.testId"
              @click="selectAccentColor(themeOption.accentColor)"
            >
              <span
                class="profile-theme-swatch"
                :class="`profile-theme-swatch--${themeOption.accentColor}`"
                aria-hidden="true"
              ></span>
              <span class="profile-theme-copy">
                <strong>{{ themeOption.label }}</strong>
                <span>{{ themeOption.description }}</span>
              </span>
            </button>
          </div>
        </section>

        <section class="profile-theme-section" aria-labelledby="profile-appearance-title">
          <h3 id="profile-appearance-title">Aparência</h3>

          <div class="profile-theme-options" role="group" aria-label="Aparências">
            <button
              v-for="appearanceOption in appearanceOptions"
              :key="appearanceOption.appearance"
              type="button"
              class="profile-theme-option"
              :class="{ 'profile-theme-option--active': themePreferencesStore.appearance === appearanceOption.appearance }"
              :aria-pressed="themePreferencesStore.appearance === appearanceOption.appearance"
              :data-testid="appearanceOption.testId"
              @click="selectAppearance(appearanceOption.appearance)"
            >
              <span
                class="profile-appearance-indicator"
                :class="`profile-appearance-indicator--${appearanceOption.appearance}`"
                aria-hidden="true"
              ></span>
              <span class="profile-theme-copy">
                <strong>{{ appearanceOption.label }}</strong>
                <span>{{ appearanceOption.description }}</span>
              </span>
            </button>
          </div>
        </section>
      </div>
    </ResponsiveSheetModal>

    <AppConfirmSheet
      v-model="isRemovePictureConfirmOpen"
      title="Remover foto?"
      message="Sua conta ficará sem foto de perfil."
      confirm-label="Remover foto"
      cancel-label="Manter foto"
      tone="danger"
      panel-testid="remove-picture-confirm-sheet"
      @confirm="removeProfilePicture"
    />

    <AppConfirmSheet
      v-model="isLogoutConfirmOpen"
      title="Sair da sessão?"
      message="Você precisará entrar novamente para usar o Sophena."
      confirm-label="Sair"
      cancel-label="Continuar aqui"
      tone="danger"
      panel-testid="logout-confirm-sheet"
      @confirm="logoutFromProfile"
    />
  </AuthenticatedScaffold>
</template>

<style scoped>
.profile-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-md);
  align-items: center;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-card);
  box-shadow: var(--shadow-sm);
}

.profile-avatar {
  width: 4rem;
  height: 4rem;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--color-primary-border);
  border-radius: 999px;
  background: var(--color-primary-surface);
  color: var(--color-primary-readable);
  font-size: 1.55rem;
  font-weight: 800;
}

.profile-avatar--button {
  padding: 0;
  appearance: none;
  -webkit-appearance: none;
  cursor: zoom-in;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}

.profile-avatar--button:focus-visible {
  outline: 3px solid var(--color-primary-focus);
  outline-offset: 3px;
}

.profile-avatar-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.profile-picture-zoom-overlay {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: grid;
  place-items: center;
  padding: var(--space-lg);
  background: var(--color-image-overlay);
}

.profile-picture-zoom-image {
  width: min(82vw, 72vh, 28rem);
  height: min(82vw, 72vh, 28rem);
  display: block;
  object-fit: cover;
  border: 3px solid var(--color-on-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.profile-summary-copy,
.profile-option-copy {
  min-width: 0;
  display: grid;
  gap: var(--space-xs);
}

.profile-field-label,
.profile-option-copy span {
  color: var(--color-muted);
  font-size: 14px;
}

.profile-summary-copy strong {
  color: var(--color-heading);
  font-size: 22px;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.profile-account-type {
  color: var(--color-heading);
  font-weight: 550;
  line-height: 1.2;
}

.profile-options {
  display: grid;
  gap: var(--space-sm);
}

.profile-option {
  min-height: 4.5rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-md);
  align-items: center;
  width: 100%;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-card);
  color: var(--color-text);
  font: inherit;
  text-align: left;
  box-shadow: var(--shadow-sm);
}

.profile-option-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-primary-surface);
  color: var(--color-primary-readable);
}

.profile-option-icon ion-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.profile-option-copy strong {
  color: var(--color-heading);
  font-weight: 700;
}

.profile-option--danger .profile-option-icon {
  background: rgba(217, 83, 79, 0.1);
  color: var(--color-danger);
}

.profile-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.profile-picture-actions {
  display: grid;
  gap: var(--space-sm);
}

.profile-theme-sections,
.profile-theme-section,
.profile-theme-options {
  display: grid;
  gap: var(--space-sm);
}

.profile-theme-section h3 {
  color: var(--color-heading);
  font-size: 1rem;
  font-weight: 700;
}

.profile-theme-option {
  min-height: 4rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-md);
  align-items: center;
  width: 100%;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  text-align: left;
  box-shadow: var(--shadow-sm);
  transition:
    background-color 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease;
}

.profile-theme-option--active {
  border-color: var(--color-primary-border-strong);
  background: var(--color-selected-bg);
}

.profile-theme-swatch {
  width: 2.35rem;
  height: 2.35rem;
  border: 2px solid var(--color-surface);
  border-radius: 999px;
  box-shadow: 0 0 0 1px var(--color-border);
}

.profile-theme-swatch--green {
  background: #355f4a;
}

.profile-theme-swatch--purple {
  background: #7c3aed;
}

.profile-appearance-indicator {
  width: 2.35rem;
  height: 2.35rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  box-shadow: var(--shadow-sm);
}

.profile-appearance-indicator--light {
  background:
    linear-gradient(135deg, #ffffff 0 50%, #f3f2ef 50% 100%);
}

.profile-appearance-indicator--dark {
  background:
    linear-gradient(135deg, #0f172a 0 50%, #1f2937 50% 100%);
}

.profile-theme-copy {
  min-width: 0;
  display: grid;
  gap: var(--space-xs);
}

.profile-theme-copy strong {
  color: var(--color-heading);
  font-weight: 700;
}

.profile-theme-copy span {
  color: var(--color-muted);
  font-size: 14px;
}

.profile-sheet-button {
  min-height: 3.15rem;
  display: inline-flex;
  gap: var(--space-sm);
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font: inherit;
  font-weight: 700;
  box-shadow: var(--shadow-md);
}

.profile-sheet-button ion-icon {
  width: 1.15rem;
  height: 1.15rem;
}

.profile-sheet-button--danger {
  border-color: var(--color-danger);
  background: var(--color-danger);
}

.profile-sheet-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.profile-option:focus-visible,
.profile-theme-option:focus-visible,
.profile-sheet-button:focus-visible {
  outline: 3px solid var(--color-primary-focus);
  outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
  .profile-avatar--button:hover {
    border-color: var(--color-primary-border-stronger);
    transform: scale(1.02);
    box-shadow: var(--shadow-sm);
  }

  .profile-option:hover {
    border-color: var(--color-primary-border-strong);
  }

  .profile-theme-option:hover {
    border-color: var(--color-primary-border-strong);
  }
}
</style>
