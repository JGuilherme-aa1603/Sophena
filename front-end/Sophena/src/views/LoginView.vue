<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonContent, IonPage, IonSpinner } from '@ionic/vue'

import { useAuthStore } from '@/stores/auth'
import SophenaWordmark from '@/components/SophenaWordmark.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({
  user_name: '',
  password: '',
})

const helperMessage = computed(() => authStore.errorMessage || null)

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
          <div class="login-header">
            <SophenaWordmark :size="36" />
          </div>

          <div class="login-brand">
            <p class="login-kicker">Capítulo 01 · Entrada</p>
            <h1 id="titulo-login" class="login-title">
              Volte para<br>
              <em class="login-accent">onde parou.</em>
            </h1>
            <p class="login-subtitle">Suas listas estão te esperando.</p>
          </div>

          <form class="login-form" @submit.prevent="submitLogin">
            <label class="app-field">
              <span>Usuário</span>
              <input
                name="user_name"
                type="text"
                autocomplete="username"
                inputmode="text"
                placeholder="seu_nome"
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
                placeholder="••••••••"
                :disabled="authStore.isLoading"
                v-model="form.password"
              />
            </label>

            <div
              v-if="helperMessage"
              role="alert"
              class="login-error"
            >
              {{ helperMessage }}
            </div>

            <button
              type="submit"
              class="login-submit"
              :disabled="authStore.isLoading"
            >
              <IonSpinner v-if="authStore.isLoading" name="crescent" class="login-spinner" />
              <span v-else>Entrar</span>
            </button>

            <p class="login-hint">
              Sem conta? Peça a um administrador.
            </p>
          </form>
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
  background: var(--color-background-gradient);
}

.login-panel {
  width: min(100%, 28rem);
  margin: 0 auto;
  display: grid;
  gap: var(--space-lg);
}

.login-header {
  padding-bottom: var(--space-sm);
}

.login-brand {
  display: grid;
  gap: var(--space-sm);
}

.login-kicker {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.login-title {
  font-family: var(--font-serif);
  font-size: 38px;
  font-weight: 400;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--color-heading);
}

.login-accent {
  font-style: italic;
  color: var(--color-primary);
}

.login-subtitle {
  color: var(--color-text-soft);
  font-size: 15px;
  line-height: 1.55;
}

.login-form {
  display: grid;
  gap: var(--space-md);
}

.login-error {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: rgba(217, 83, 79, 0.1);
  border: 1px solid rgba(217, 83, 79, 0.22);
  color: var(--color-danger-text);
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 13.5px;
}

.login-submit {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 22px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-family: var(--font-serif);
  font-size: 17px;
  font-style: italic;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 12px 24px var(--color-shadow-accent-medium);
  transition:
    background var(--transition-fast),
    box-shadow var(--transition-fast),
    opacity var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-submit:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-lg);
}

.login-submit:disabled {
  opacity: 0.7;
  cursor: wait;
}

.login-spinner {
  --color: var(--color-on-primary);
  width: 22px;
  height: 22px;
}

.login-hint {
  text-align: center;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 13px;
  color: var(--color-text-muted);
}

@media (min-width: 768px) {
  .login-page {
    padding: var(--space-xl);
  }

  .login-title {
    font-size: 44px;
  }
}
</style>
