<script setup lang="ts">
import { reactive } from 'vue'
import { IonButton, IonCard, IonCardContent, IonContent, IonPage, IonSpinner } from '@ionic/vue'
import { useRouter } from 'vue-router'

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
  <IonPage>
    <IonContent :fullscreen="true">
      <main class="admin-users-page">
        <section class="admin-users-shell">
          <header class="admin-users-header">
            <div>
              <p class="admin-users-kicker">Sophena</p>
              <h1>Criar usuário</h1>
              <p class="admin-users-subtitle">Cadastre uma nova pessoa e escolha se ela também poderá administrar o sistema.</p>
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

          <IonCard class="admin-users-card">
            <IonCardContent>
              <form class="admin-users-form" @submit.prevent="submitForm">
                <label class="field">
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

                <label class="field">
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
                  class="feedback-message error-message"
                  role="status"
                  aria-live="polite"
                >
                  {{ adminUsersStore.errorMessage }}
                </p>

                <p
                  v-if="adminUsersStore.feedbackMessage"
                  class="feedback-message success-message"
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
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.admin-users-page {
  min-height: 100%;
  padding: 1.25rem;
  background:
    radial-gradient(circle at top left, rgba(223, 236, 221, 0.9), transparent 28%),
    radial-gradient(circle at bottom right, rgba(239, 229, 198, 0.8), transparent 28%),
    linear-gradient(180deg, #f6f2e8 0%, #fcfbf7 100%);
}

.admin-users-shell {
  width: min(100%, 42rem);
  margin: 0 auto;
  display: grid;
  gap: 1rem;
}

.admin-users-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
}

.admin-users-kicker {
  margin-bottom: 0.45rem;
  color: #58715f;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-users-header h1 {
  color: #20332b;
  font-family: 'Atkinson Hyperlegible', 'Trebuchet MS', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
}

.admin-users-subtitle {
  margin-top: 0.65rem;
  color: #476055;
}

.admin-users-card {
  margin: 0;
  border-radius: 1.25rem;
  box-shadow: 0 18px 50px rgba(58, 71, 53, 0.1);
}

.admin-users-form {
  display: grid;
  gap: 0.9rem;
}

.field {
  display: grid;
  gap: 0.45rem;
  color: #22332c;
}

.field span {
  font-weight: 700;
}

.field input {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid #c7d1c2;
  border-radius: 0.9rem;
  background: #fffdf9;
  font: inherit;
  color: #1c2b25;
}

.field input:focus,
.checkbox-field:focus-within {
  outline: 3px solid rgba(78, 129, 102, 0.2);
  border-color: #4e8166;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid #c7d1c2;
  border-radius: 0.9rem;
  color: #22332c;
  background: #fffdf9;
}

.admin-checkbox {
  width: 1.1rem;
  height: 1.1rem;
  accent-color: #335c47;
}

.helper-text {
  color: #51665c;
}

.feedback-message {
  margin: 0;
}

.error-message {
  color: #7c3b33;
}

.success-message {
  color: #2f5d42;
}

.submit-button {
  --background: #335c47;
  --background-hover: #284b3a;
  --border-radius: 0.95rem;
  min-height: 3rem;
  font-weight: 700;
}

.back-button {
  --color: #335c47;
  --border-color: #335c47;
  --border-radius: 0.95rem;
}

@media (max-width: 640px) {
  .admin-users-header {
    flex-direction: column;
  }
}
</style>
