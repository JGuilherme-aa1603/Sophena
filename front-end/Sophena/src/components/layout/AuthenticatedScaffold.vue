<script setup lang="ts">
import { computed } from 'vue'
import { IonContent, IonPage } from '@ionic/vue'
import { useRoute, useRouter } from 'vue-router'

import AppToast from '@/components/feedback/AppToast.vue'
import { useAuthStore } from '@/stores/auth'

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
const route = useRoute()
const router = useRouter()

const shellStyle = computed(() => ({ '--app-shell-width': props.shellWidth }))
const activeRoute = computed(() => String(route.name ?? ''))
const showAdmin = computed(() => Boolean(authStore.user?.is_admin))
const userName = computed(() => authStore.user?.user_name ?? '')
const userPictureUrl = computed(() => authStore.user?.user_picture_url ?? null)
const { viewportStyle } = useViewportBottomOffset()

async function navigateFromDock(target: 'app-home' | 'books' | 'admin-home') {
  if (activeRoute.value === target) {
    return
  }

  await router.push({ name: target })
}

async function openProfileFromDock() {
  if (activeRoute.value === 'profile') {
    return
  }

  await router.push({ name: 'profile' })
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

      <AuthenticatedDock
        :active-route="activeRoute"
        :show-admin="showAdmin"
        :user-name="userName"
        :user-picture-url="userPictureUrl"
        @navigate="navigateFromDock"
        @profile="openProfileFromDock"
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
