import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

import { createAppRouter } from '../index'
import { useAuthStore } from '@/stores/auth'

describe('auth router guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('redireciona usuário sem sessão para a tela de login', async () => {
    const router = createAppRouter(createMemoryHistory())
    const authStore = useAuthStore()
    const ensureSessionSpy = vi.spyOn(authStore, 'ensureSession').mockResolvedValue(false)

    await router.push('/app')

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/app')
    expect(ensureSessionSpy).toHaveBeenCalled()
  })

  it('redireciona usuário autenticado para a área principal ao abrir /login', async () => {
    const router = createAppRouter(createMemoryHistory())
    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-1',
      user_name: 'leitora',
      is_admin: false,
    }
    vi.spyOn(authStore, 'ensureSession').mockResolvedValue(true)

    await router.push('/login')

    expect(router.currentRoute.value.name).toBe('app-home')
  })

  it('mantém usuário autenticado na área principal', async () => {
    const router = createAppRouter(createMemoryHistory())
    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-2',
      user_name: 'admin',
      is_admin: true,
    }
    vi.spyOn(authStore, 'ensureSession').mockResolvedValue(true)

    await router.push('/app')

    expect(router.currentRoute.value.name).toBe('app-home')
  })

  it('restaura a sessão pelo refresh cookie e entra na área principal', async () => {
    const router = createAppRouter(createMemoryHistory())
    const authStore = useAuthStore()
    vi.spyOn(authStore, 'ensureSession').mockImplementation(async () => {
      authStore.setAccessToken('token-renovado')
      authStore.user = {
        id: 'user-5',
        user_name: 'leitora-persistida',
        is_admin: false,
      }

      return true
    })

    await router.push('/app')

    expect(router.currentRoute.value.name).toBe('app-home')
    expect(authStore.isAuthenticated).toBe(true)
  })

  it('bloqueia usuário não admin da rota de usuários', async () => {
    const router = createAppRouter(createMemoryHistory())
    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-10',
      user_name: 'leitora',
      is_admin: false,
    }
    vi.spyOn(authStore, 'ensureSession').mockResolvedValue(true)

    await router.push('/app/admin/users')

    expect(router.currentRoute.value.name).toBe('app-home')
  })

  it('bloqueia usuário não admin da área administrativa', async () => {
    const router = createAppRouter(createMemoryHistory())
    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-12',
      user_name: 'leitora',
      is_admin: false,
    }
    vi.spyOn(authStore, 'ensureSession').mockResolvedValue(true)

    await router.push('/app/admin')

    expect(router.currentRoute.value.name).toBe('app-home')
  })

  it('permite usuário admin na área administrativa', async () => {
    const router = createAppRouter(createMemoryHistory())
    const authStore = useAuthStore()
    authStore.setAccessToken('token-admin')
    authStore.user = {
      id: 'admin-12',
      user_name: 'admin',
      is_admin: true,
    }
    vi.spyOn(authStore, 'ensureSession').mockResolvedValue(true)

    await router.push('/app/admin')

    expect(router.currentRoute.value.name).toBe('admin-home')
  })

  it('permite usuário admin na rota de usuários', async () => {
    const router = createAppRouter(createMemoryHistory())
    const authStore = useAuthStore()
    authStore.setAccessToken('token-admin')
    authStore.user = {
      id: 'admin-10',
      user_name: 'admin',
      is_admin: true,
    }
    vi.spyOn(authStore, 'ensureSession').mockResolvedValue(true)

    await router.push('/app/admin/users')

    expect(router.currentRoute.value.name).toBe('admin-users')
  })

  it('bloqueia usuário não admin da rota de registros', async () => {
    const router = createAppRouter(createMemoryHistory())
    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-11',
      user_name: 'leitora',
      is_admin: false,
    }
    vi.spyOn(authStore, 'ensureSession').mockResolvedValue(true)

    await router.push('/app/admin/logs')

    expect(router.currentRoute.value.name).toBe('app-home')
  })

  it('permite usuário admin na rota de registros', async () => {
    const router = createAppRouter(createMemoryHistory())
    const authStore = useAuthStore()
    authStore.setAccessToken('token-admin')
    authStore.user = {
      id: 'admin-11',
      user_name: 'admin',
      is_admin: true,
    }
    vi.spyOn(authStore, 'ensureSession').mockResolvedValue(true)

    await router.push('/app/admin/logs')

    expect(router.currentRoute.value.name).toBe('admin-logs')
  })
})
