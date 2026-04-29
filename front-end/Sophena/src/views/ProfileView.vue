<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { cameraOutline, logOutOutline, personCircleOutline, trashOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'

import AuthenticatedScaffold from '@/components/layout/AuthenticatedScaffold.vue'
import AppConfirmSheet from '@/components/overlay/AppConfirmSheet.vue'
import ResponsiveSheetModal from '@/components/overlay/ResponsiveSheetModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const authStore = useAuthStore()
const toastStore = useToastStore()
const router = useRouter()
const pictureFileInput = ref<HTMLInputElement | null>(null)
const isPictureOptionsOpen = ref(false)
const isRemovePictureConfirmOpen = ref(false)
const isLogoutConfirmOpen = ref(false)

const userName = computed(() => authStore.user?.user_name ?? '')
const userPictureUrl = computed(() => authStore.user?.user_picture_url ?? null)
const profileInitial = computed(() => userName.value.trim().slice(0, 1).toUpperCase() || 'U')
const accountTypeLabel = computed(() => (authStore.user?.is_admin ? 'Administrador' : 'Usuário'))

function requestPictureOptions() {
  isPictureOptionsOpen.value = true
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
      <div class="profile-avatar" data-testid="profile-avatar">
        <img
          v-if="userPictureUrl"
          class="profile-avatar-image"
          :src="userPictureUrl"
          :alt="`Foto de perfil de ${userName}`"
          data-testid="profile-picture-image"
        >
        <span
          v-else
          class="profile-avatar-fallback"
          data-testid="profile-picture-fallback"
        >
          {{ profileInitial }}
        </span>
      </div>

      <div class="profile-summary-copy">
        <span class="profile-field-label">Usuário</span>
        <strong data-testid="profile-user-name">{{ userName }}</strong>
        <span data-testid="profile-account-type">{{ accountTypeLabel }}</span>
      </div>
    </section>

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
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-sm);
}

.profile-avatar {
  width: 4rem;
  height: 4rem;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(53, 95, 74, 0.18);
  border-radius: 999px;
  background: rgba(53, 95, 74, 0.1);
  color: var(--color-primary);
  font-size: 1.55rem;
  font-weight: 800;
}

.profile-avatar-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
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
  background: rgba(255, 255, 255, 0.92);
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
  background: rgba(53, 95, 74, 0.1);
  color: var(--color-primary);
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
  color: #fff;
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
.profile-sheet-button:focus-visible {
  outline: 3px solid rgba(53, 95, 74, 0.22);
  outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
  .profile-option:hover {
    border-color: rgba(53, 95, 74, 0.28);
  }
}
</style>
