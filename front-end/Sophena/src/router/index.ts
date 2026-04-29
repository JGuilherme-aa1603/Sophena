import {
  createRouter,
  createWebHistory,
} from '@ionic/vue-router'
import type { RouteLocationNormalized, RouterHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

import AdminHomeView from '../views/AdminHomeView.vue'
import AdminBooksView from '../views/AdminBooksView.vue'
import AdminLogsView from '../views/AdminLogsView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'
import BooksView from '../views/BooksView.vue'
import ListsView from '../views/ListsView.vue'
import ListDetailView from '../views/ListDetailView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'

function isGuestOnlyRoute(route: RouteLocationNormalized) {
  return route.matched.some((record) => record.meta.guestOnly === true)
}

function requiresAuthentication(route: RouteLocationNormalized) {
  return route.matched.some((record) => record.meta.requiresAuth === true)
}

function requiresAdmin(route: RouteLocationNormalized) {
  return route.matched.some((record) => record.meta.requiresAdmin === true)
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
        component: ListsView,
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/app/lists/:listId',
        name: 'list-detail',
        component: ListDetailView,
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/app/books',
        name: 'books',
        component: BooksView,
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/app/profile',
        name: 'profile',
        component: ProfileView,
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/app/admin',
        name: 'admin-home',
        component: AdminHomeView,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: '/app/admin/books',
        name: 'admin-books',
        component: AdminBooksView,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: '/app/admin/users',
        name: 'admin-users',
        component: AdminUsersView,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: '/app/admin/logs',
        name: 'admin-logs',
        component: AdminLogsView,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
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

    if (!hasSession) {
      return {
        name: 'login',
        query: {
          redirect: to.fullPath,
        },
      }
    }

    if (requiresAdmin(to) && !authStore.user?.is_admin) {
      return { name: 'app-home' }
    }

    return true
  })

  return router
}

const router = createAppRouter(createWebHistory(import.meta.env.BASE_URL))

export default router
