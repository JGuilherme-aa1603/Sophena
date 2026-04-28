import { test, expect } from '@playwright/test'

test('abre a tela de login em português', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  await expect(page.getByLabel('Usuário')).toBeVisible()
  await expect(page.getByLabel('Senha')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
})
