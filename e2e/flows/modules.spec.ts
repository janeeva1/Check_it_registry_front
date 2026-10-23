// The admin switch for parts of the app, and the escrow provider choice.
// With the marketplace off, customers see "coming soon" and no marketplace
// links; admins still see it, with a note.
import { test, expect } from '@playwright/test'
import { apiAs, signIn } from '../support'

async function setMarketplace(on: boolean) {
  const admin = await apiAs('admin')
  const r = await admin.put('/api/modules/admin/marketplace', { data: { on } })
  expect(r.ok()).toBeTruthy()
  await admin.dispose()
}

test.afterEach(async () => { await setMarketplace(true) })

test('with the marketplace off, customers see "coming soon" and no marketplace links', async ({ page }) => {
  await setMarketplace(false)
  await signIn(page, 'user')
  await page.goto('/marketplace')
  await expect(page.getByTestId('module-off')).toContainText(/coming soon/i)
  await page.goto('/cart')
  await expect(page.getByTestId('module-off')).toBeVisible()
  await page.goto('/dashboard')
  await expect(page.locator('a[href^="/marketplace"]:visible')).toHaveCount(0)
  // The API refuses too
  const api = await apiAs('user')
  const r = await api.get('/api/marketplace')
  expect(r.status()).toBe(503)
  expect((await r.json()).moduleOff).toBeTruthy()
  await api.dispose()
})

test('with the marketplace off, admins still see it with a note', async ({ page }) => {
  await setMarketplace(false)
  await signIn(page, 'admin')
  await page.goto('/marketplace')
  await expect(page.getByText(/switched off for customers/i)).toBeVisible()
  await expect(page.getByTestId('module-off')).toHaveCount(0)
})

test('the Modules & payments page switches the marketplace and lists the escrow providers', async ({ page }) => {
  await signIn(page, 'admin')
  await page.goto('/admin/modules')
  const mods = page.getByTestId('modules')
  await mods.getByRole('button', { name: /switch off marketplace/i }).click()
  await expect(mods.getByRole('button', { name: /switch on marketplace/i })).toBeVisible()
  await mods.getByRole('button', { name: /switch on marketplace/i }).click()
  await expect(mods.getByRole('button', { name: /switch off marketplace/i })).toBeVisible()

  const provs = page.getByTestId('escrow-providers')
  for (const name of [/monnify/i, /flutterwave/i, /vesicash/i, /paystack/i]) await expect(provs).toContainText(name)
  await expect(provs.getByRole('button', { name: /use vesicash/i })).toBeDisabled()
  await expect(provs).toContainText(/always use paystack/i)
})

test('admins find "Modules & payments" in the menu and on the dashboard', async ({ page }) => {
  await signIn(page, 'admin')
  await page.goto('/admin')
  await page.getByRole('link', { name: /modules & payments/i }).first().click()
  await expect(page).toHaveURL(/\/admin\/modules/)
  // On the modules page the menu opens the "Payments" group
  await page.getByRole('button', { name: /open menu|menu/i }).first().click().catch(() => {})
  const menu = page.locator('aside.sidebar')
  await expect(menu.getByRole('button', { name: /^payments$/i })).toBeVisible()
  await expect(menu.getByRole('link', { name: /modules & payments/i })).toBeVisible()
  for (const g of [/to review/i, /recovery/i, /people & items/i, /reports & logs/i, /site settings/i]) await expect(menu.getByRole('button', { name: g })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screens/admin_sidebar.png' })
})
