<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonButton, IonCard, IonCardContent, IonSpinner } from '@ionic/vue'

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
            <IonCardContent class="login-card-content">
              <div class="login-helper">
                <p class="helper-kicker">Acesso privado</p>
                <p>Entre com seu usuário e sua senha para continuar.</p>
              </div>

              <form class="login-form" @submit.prevent="submitLogin">
                <label class="app-field">
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

                <label class="app-field">
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
  padding: var(--space-lg) var(--space-md);
  background:
    radial-gradient(circle at top left, rgba(230, 239, 233, 0.94), transparent 36%),
    radial-gradient(circle at bottom right, rgba(234, 231, 223, 0.9), transparent 32%),
    var(--color-background-gradient);
}

.login-panel {
  width: min(100%, 30rem);
  margin: 0 auto;
  display: grid;
  gap: var(--space-lg);
}

.login-brand {
  color: var(--color-heading);
  text-align: left;
}

.login-kicker {
  margin-bottom: var(--space-sm);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.login-brand h1 {
  font-family: 'Atkinson Hyperlegible', 'Trebuchet MS', sans-serif;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
}

.login-subtitle {
  margin-top: var(--space-sm);
  color: var(--color-muted);
}

.login-card {
  margin: 0;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--shadow-md);
}

.login-card-content,
.login-form {
  display: grid;
  gap: var(--space-md);
}

.login-helper {
  display: grid;
  gap: var(--space-xs);
  padding: var(--space-md);
  border: 1px solid rgba(226, 224, 219, 0.96);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
  color: var(--color-muted);
}

.helper-kicker {
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.helper-message {
  min-height: 1.5rem;
  color: var(--color-muted);
}

.submit-button {
  --background: var(--color-primary);
  --background-hover: var(--color-primary-hover);
  --border-radius: var(--radius-lg);
  --box-shadow: var(--shadow-md);
  min-height: 3.2rem;
  font-weight: 700;
}

@media (min-width: 768px) {
  .login-page {
    padding: var(--space-xl);
  }

  .login-brand h1 {
    font-size: 32px;
  }
}
</style>
