import {
  createRouter,
  createWebHistory,
} from '@ionic/vue-router'
import type { RouteLocationNormalized, RouterHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

import AppHomeView from '../views/AppHomeView.vue'
import LoginView from '../views/LoginView.vue'

function isGuestOnlyRoute(route: RouteLocationNormalized) {
  return route.matched.some((record) => record.meta.guestOnly === true)
}

function requiresAuthentication(route: RouteLocationNormalized) {
  return route.matched.some((record) => record.meta.requiresAuth === true)
}

export function createAppRouter(history: RouterHistory) {
  const router = createRouter({
    history,
    routes: [
      {
        path: '/',
        redirect: '/app',
      },
      {
        path: '/login',
        name: 'login',
        component: LoginView,
        meta: {
          guestOnly: true,
        },
      },
      {
        path: '/app',
        name: 'app-home',
        component: AppHomeView,
        meta: {
          requiresAuth: true,
        },
      },
    ],
  })

  router.beforeEach(async (to) => {
    const authStore = useAuthStore()

    if (isGuestOnlyRoute(to)) {
      if (authStore.isAuthenticated) {
        return { name: 'app-home' }
      }

      await authStore.ensureSession()

      if (authStore.isAuthenticated) {
        return { name: 'app-home' }
      }

      return true
    }

    if (!requiresAuthentication(to)) {
      return true
    }

    const hasSession = await authStore.ensureSession()

    if (hasSession) {
      return true
    }

    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  })

  return router
}

const router = createAppRouter(createWebHistory(import.meta.env.BASE_URL))

export default router
