<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonContent, IonPage } from '@ionic/vue'
import { useRoute, useRouter } from 'vue-router'

import AppToast from '@/components/feedback/AppToast.vue'
import AppConfirmSheet from '@/components/overlay/AppConfirmSheet.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

import AuthenticatedDock from './AuthenticatedDock.vue'
import { useViewportBottomOffset } from './viewport-bottom-offset'

const props = withDefaults(defineProps<{
  pageClass?: string
  shellWidth?: string
}>(), {
  pageClass: '',
  shellWidth: '46rem',
})

const authStore = useAuthStore()
const toastStore = useToastStore()
const route = useRoute()
const router = useRouter()
const isLogoutConfirmOpen = ref(false)

const shellStyle = computed(() => ({ '--app-shell-width': props.shellWidth }))
const activeRoute = computed(() => String(route.name ?? ''))
const showAdmin = computed(() => Boolean(authStore.user?.is_admin))
const { viewportStyle } = useViewportBottomOffset()

async function navigateFromDock(target: 'app-home' | 'books' | 'admin-home') {
  if (activeRoute.value === target) {
    return
  }

  await router.push({ name: target })
}

function requestLogoutFromDock() {
  isLogoutConfirmOpen.value = true
}

async function logoutFromDock() {
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
  <IonPage>
    <IonContent :fullscreen="true" :style="viewportStyle">
      <main class="authenticated-page" :class="pageClass">
        <section class="authenticated-shell" :style="shellStyle">
          <slot />
        </section>
      </main>

      <AppToast />

      <AppConfirmSheet
        v-model="isLogoutConfirmOpen"
        title="Sair da sessão?"
        message="Você precisará entrar novamente para usar o Sophena."
        confirm-label="Sair"
        cancel-label="Continuar aqui"
        tone="danger"
        panel-testid="logout-confirm-sheet"
        @confirm="logoutFromDock"
      />

      <AuthenticatedDock
        :active-route="activeRoute"
        :show-admin="showAdmin"
        @navigate="navigateFromDock"
        @logout="requestLogoutFromDock"
      />
    </IonContent>
  </IonPage>
</template>

<style scoped>
.authenticated-page {
  min-height: 100%;
  padding: var(--space-lg) var(--space-md);
  padding-bottom: calc(var(--dock-height) + var(--space-xl) + var(--viewport-bottom-offset, 0px));
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

</style>
