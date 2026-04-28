<script setup lang="ts">
import { reactive } from 'vue'
import { IonButton, IonCard, IonCardContent, IonSpinner } from '@ionic/vue'
import { useRouter } from 'vue-router'

import AuthenticatedScaffold from '@/components/layout/AuthenticatedScaffold.vue'
import { useAdminUsersStore } from '@/stores/admin-users'

const router = useRouter()
const adminUsersStore = useAdminUsersStore()

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
  } catch {
    // A mensagem amigável já é definida no store.
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

          <label class="checkbox-field">
            <input
              class="admin-checkbox"
              name="admin-is-admin"
              type="checkbox"
              :checked="form.is_admin"
              @change="form.is_admin = ($event.target as HTMLInputElement).checked"
            />
            <span>Esse novo usuário também será administrador</span>
          </label>

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
  --border-radius: 999px;
}

.admin-users-form-wrap,
.admin-users-form,
.form-intro {
  display: grid;
  gap: 1rem;
}

.form-kicker {
  color: #58715f;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.form-intro h2 {
  color: var(--color-heading);
  font-size: 1.25rem;
  font-weight: 700;
}

.form-intro p,
.helper-text {
  color: var(--color-muted);
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border: 1px solid #c7d1c2;
  border-radius: 1rem;
  background: #fffdf9;
  color: #22332c;
}

.checkbox-field:focus-within {
  outline: 3px solid rgba(78, 129, 102, 0.2);
  border-color: #4e8166;
}

.admin-checkbox {
  width: 1.1rem;
  height: 1.1rem;
  accent-color: var(--color-primary);
}

.submit-button {
  --background: var(--color-primary);
  --background-hover: var(--color-primary-strong);
  --border-radius: 999px;
  min-height: 3rem;
  font-weight: 700;
}
</style>
