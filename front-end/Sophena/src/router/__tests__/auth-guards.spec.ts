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
})
