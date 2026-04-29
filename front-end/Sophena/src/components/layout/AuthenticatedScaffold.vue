<script setup lang="ts">
import { computed } from 'vue'
import { IonContent, IonPage } from '@ionic/vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

import AuthenticatedDock from './AuthenticatedDock.vue'

const props = withDefaults(defineProps<{
  pageClass?: string
  shellWidth?: string
}>(), {
  pageClass: '',
  shellWidth: '46rem',
})

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const shellStyle = computed(() => ({ '--app-shell-width': props.shellWidth }))
const activeRoute = computed(() => String(route.name ?? ''))
const showAdmin = computed(() => Boolean(authStore.user?.is_admin))

async function navigateFromDock(target: 'app-home' | 'admin-home') {
  if (activeRoute.value === target) {
    return
  }

  await router.push({ name: target })
}

async function logoutFromDock() {
  try {
    await authStore.logout()
    await router.replace('/login')
  } catch {
    // A mensagem amigável já é definida no store.
  }
}
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <main class="authenticated-page" :class="pageClass">
        <section class="authenticated-shell" :style="shellStyle">
          <slot />
        </section>
      </main>

      <div
        v-if="authStore.errorMessage"
        class="auth-feedback-banner"
        role="status"
        aria-live="polite"
      >
        {{ authStore.errorMessage }}
      </div>

      <AuthenticatedDock
        :active-route="activeRoute"
        :show-admin="showAdmin"
        @navigate="navigateFromDock"
        @logout="logoutFromDock"
      />
    </IonContent>
  </IonPage>
</template>

<style scoped>
.authenticated-page {
  min-height: 100%;
  padding: var(--space-lg) var(--space-md);
  padding-bottom: calc(var(--dock-height) + var(--space-xl));
  background:
    radial-gradient(circle at top left, rgba(230, 239, 233, 0.92), transparent 30%),
    radial-gradient(circle at bottom right, rgba(234, 231, 223, 0.92), transparent 32%),
    var(--color-background-gradient);
}

.authenticated-shell {
  width: min(100%, var(--app-shell-width));
  margin: 0 auto;
  display: grid;
  gap: var(--space-lg);
}

.auth-feedback-banner {
  position: fixed;
  left: 50%;
  bottom: calc(var(--dock-height) + var(--space-md));
  z-index: 25;
  width: min(calc(100% - 2rem), 36rem);
  padding: 0.85rem 1rem;
  border: 1px solid rgba(217, 83, 79, 0.2);
  border-radius: var(--radius-md);
  background: rgba(255, 250, 249, 0.96);
  color: #8f4541;
  box-shadow: var(--shadow-md);
  transform: translateX(-50%);
}
</style>
