<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonButton, IonCard, IonCardContent, IonContent, IonPage, IonSpinner } from '@ionic/vue'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({
  user_name: '',
  password: '',
})

const helperMessage = computed(() => authStore.errorMessage || 'Entre com seus dados para continuar.')

async function submitLogin() {
  try {
    await authStore.login({
      user_name: form.user_name,
      password: form.password,
    })

    const redirectTarget = typeof route.query.redirect === 'string' ? route.query.redirect : '/app'
    await router.replace(redirectTarget)
  } catch {
    // A mensagem amigável já é definida no store.
  }
}
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <main class="login-page">
        <section class="login-panel" aria-labelledby="titulo-login">
          <div class="login-brand">
            <p class="login-kicker">Sophena</p>
            <h1 id="titulo-login">Seja bem-vindo</h1>
            <p class="login-subtitle">
              Organize suas leituras com calma, em um lugar simples e fácil de usar.
            </p>
          </div>

          <IonCard class="login-card">
            <IonCardContent>
              <form class="login-form" @submit.prevent="submitLogin">
                <label class="field">
                  <span>Usuário</span>
                  <input
                    name="user_name"
                    type="text"
                    autocomplete="username"
                    inputmode="text"
                    placeholder="Digite seu usuário"
                    :disabled="authStore.isLoading"
                    v-model="form.user_name"
                  />
                </label>

                <label class="field">
                  <span>Senha</span>
                  <input
                    name="password"
                    type="password"
                    autocomplete="current-password"
                    placeholder="Digite sua senha"
                    :disabled="authStore.isLoading"
                    v-model="form.password"
                  />
                </label>

                <p class="helper-message" role="status" aria-live="polite">
                  {{ helperMessage }}
                </p>

                <IonButton class="submit-button" type="submit" expand="block" :disabled="authStore.isLoading">
                  <span v-if="!authStore.isLoading">Entrar</span>
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
.login-page {
  min-height: 100%;
  display: grid;
  align-items: center;
  padding: 1.5rem;
  background:
    radial-gradient(circle at top left, rgba(204, 233, 214, 0.9), transparent 35%),
    radial-gradient(circle at bottom right, rgba(238, 224, 190, 0.75), transparent 30%),
    linear-gradient(180deg, #f7f2e7 0%, #fdfbf7 100%);
}

.login-panel {
  width: min(100%, 28rem);
  margin: 0 auto;
  display: grid;
  gap: 1.25rem;
}

.login-brand {
  color: #21352d;
  text-align: left;
}

.login-kicker {
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #567367;
}

.login-brand h1 {
  font-family: 'Atkinson Hyperlegible', 'Trebuchet MS', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
}

.login-subtitle {
  margin-top: 0.75rem;
  font-size: 1rem;
  color: #385144;
}

.login-card {
  margin: 0;
  border-radius: 1.25rem;
  box-shadow: 0 18px 48px rgba(62, 70, 52, 0.12);
}

.login-form {
  display: grid;
  gap: 1rem;
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

.field input:focus {
  outline: 3px solid rgba(78, 129, 102, 0.2);
  border-color: #4e8166;
}

.helper-message {
  min-height: 1.5rem;
  color: #44584d;
}

.submit-button {
  --background: #335c47;
  --background-hover: #284b3a;
  --border-radius: 0.95rem;
  min-height: 3.2rem;
  font-weight: 700;
}

@media (min-width: 768px) {
  .login-page {
    padding: 2.5rem;
  }

  .login-panel {
    width: min(100%, 31rem);
  }

  .login-brand h1 {
    font-size: 2.5rem;
  }
}
</style>
