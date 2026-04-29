<script setup lang="ts">
import { reactive } from 'vue'
import { IonButton, IonCard, IonCardContent, IonSpinner } from '@ionic/vue'
import { useRouter } from 'vue-router'

import AuthenticatedScaffold from '@/components/layout/AuthenticatedScaffold.vue'
import { useAdminUsersStore } from '@/stores/admin-users'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const adminUsersStore = useAdminUsersStore()
const toastStore = useToastStore()

const form = reactive({
  user_name: '',
  password: '',
  is_admin: false,
})

async function submitForm() {
  try {
    await adminUsersStore.createUser({
      user_name: form.user_name,
      password: form.password,
      is_admin: form.is_admin,
    })

    form.user_name = ''
    form.password = ''
    form.is_admin = false
    toastStore.showSuccess('Usuário criado.')
  } catch {
    toastStore.showError(adminUsersStore.errorMessage || 'Não foi possível criar o usuário agora.')
  }
}

async function goBack() {
  await router.push('/app/admin')
}
</script>

<template>
  <AuthenticatedScaffold page-class="admin-users-page" shell-width="42rem">
    <header class="app-page-header">
      <div class="app-page-header__title">
        <p class="app-page-kicker">Sophena</p>
        <h1 class="app-page-title">Criar usuário</h1>
        <p class="app-page-subtitle">
          Cadastre uma nova pessoa e escolha se ela também poderá administrar o sistema.
        </p>
      </div>

      <IonButton
        class="back-button"
        fill="outline"
        data-testid="back-to-app"
        @click="goBack"
      >
        Voltar
      </IonButton>
    </header>

    <IonCard class="app-card admin-users-card">
      <IonCardContent class="admin-users-form-wrap">
        <div class="form-intro">
          <p class="form-kicker">Passo único</p>
          <h2>Preencha os dados principais</h2>
          <p>Use um nome fácil de reconhecer e uma senha com pelo menos 8 caracteres.</p>
        </div>

        <form class="admin-users-form" @submit.prevent="submitForm">
          <label class="app-field">
            <span>Usuário</span>
            <input
              name="admin-user-name"
              type="text"
              autocomplete="off"
              placeholder="Digite o nome de usuário"
              :disabled="adminUsersStore.isCreating"
              v-model="form.user_name"
            />
          </label>

          <label class="app-field">
            <span>Senha</span>
            <input
              name="admin-password"
              type="password"
              autocomplete="new-password"
              placeholder="Digite uma senha com pelo menos 8 caracteres"
              :disabled="adminUsersStore.isCreating"
              v-model="form.password"
            />
          </label>

          <div class="permission-field">
            <span class="permission-label">Tipo de acesso</span>
            <div class="permission-options" role="group" aria-label="Tipo de acesso do novo usuário">
              <button
                type="button"
                class="permission-option"
                :class="{ 'permission-option--active': !form.is_admin }"
                :aria-pressed="!form.is_admin"
                data-testid="admin-permission-reader"
                @click="form.is_admin = false"
              >
                Leitor comum
              </button>

              <button
                type="button"
                class="permission-option"
                :class="{ 'permission-option--active': form.is_admin }"
                :aria-pressed="form.is_admin"
                data-testid="admin-permission-admin"
                @click="form.is_admin = true"
              >
                Administrador
              </button>
            </div>
          </div>

          <p class="helper-text">
            Administradores podem criar novos usuários e acessar áreas reservadas.
          </p>

          <p
            v-if="adminUsersStore.errorMessage"
            class="app-feedback app-feedback--error"
            role="status"
            aria-live="polite"
          >
            {{ adminUsersStore.errorMessage }}
          </p>

          <p
            v-if="adminUsersStore.feedbackMessage"
            class="app-feedback app-feedback--success"
            role="status"
            aria-live="polite"
          >
            {{ adminUsersStore.feedbackMessage }}
          </p>

          <IonButton
            type="submit"
            class="submit-button"
            :disabled="adminUsersStore.isCreating"
          >
            <span v-if="!adminUsersStore.isCreating">Criar usuário</span>
            <IonSpinner v-else name="crescent" />
          </IonButton>
        </form>
      </IonCardContent>
    </IonCard>
  </AuthenticatedScaffold>
</template>

<style scoped>
.back-button {
  --color: var(--color-primary);
  --border-color: var(--color-primary);
  --border-radius: var(--radius-lg);
}

.admin-users-form-wrap,
.admin-users-form,
.form-intro {
  display: grid;
  gap: var(--space-md);
}

.form-kicker {
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.form-intro h2 {
  color: var(--color-heading);
  font-size: 22px;
  font-weight: 600;
}

.form-intro p,
.helper-text {
  color: var(--color-muted);
}

.permission-field {
  display: grid;
  gap: var(--space-sm);
}

.permission-label {
  color: var(--color-heading);
  font-weight: 700;
}

.permission-options {
  display: grid;
  gap: var(--space-sm);
  padding: var(--space-xs);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.92);
}

.permission-option {
  min-height: 3rem;
  padding: 0.8rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-heading);
  font: inherit;
  font-weight: 700;
}

.permission-option--active {
  border-color: rgba(53, 95, 74, 0.26);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.permission-option:focus-visible {
  outline: 3px solid rgba(53, 95, 74, 0.18);
  outline-offset: 2px;
}

.submit-button {
  --background: var(--color-primary);
  --background-hover: var(--color-primary-hover);
  --border-radius: var(--radius-lg);
  --box-shadow: var(--shadow-md);
  min-height: 3rem;
  font-weight: 700;
}

@media (min-width: 520px) {
  .permission-options {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
