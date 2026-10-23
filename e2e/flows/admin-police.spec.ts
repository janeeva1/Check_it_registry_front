// Admin and police screens: the proof-of-ownership review and the portals.
import { test, expect } from '@playwright/test'
import { API, apiAs, accounts, makeImei, signIn, watch } from '../support'

// A 1x1 PNG, enough for an uploaded proof
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')

test('an admin approves a proof and the owner becomes a verified owner', async ({ page }) => {
  const w = watch(page)
  const user = await apiAs('user')
  const d = await (await user.post('/api/device-management', { data: { category: 'smartphone', brand: 'Infinix', model: 'Note 40', imei: makeImei() } })).json()
  const sent = await user.post(`/api/ownership/device/${d.id}/proof`, { multipart: { proof_type: 'receipt', proof_document: { name: 'receipt.png', mimeType: 'image/png', buffer: PNG } } })
  expect(sent.status()).toBe(201)

  await signIn(page, 'admin')
  await page.goto('/admin/ownership-review')
  const card = page.locator('article, li, .po-card').filter({ hasText: 'Infinix' }).first()
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: /approve owner/i }).click()
  await expect.poll(async () => (await (await user.get(`/api/ownership/device/${d.id}`)).json()).level, { timeout: 15_000 }).toBe('verified_owner')
  await user.dispose()
  w.expectClean()
})

test('the admin dashboard shows numbers and its pages open', async ({ page }) => {
  const w = watch(page)
  await signIn(page, 'admin')
  await page.goto('/admin')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('main')).toContainText(/\d/)
  await page.goto('/admin/marketplace')
  await expect(page.locator('main')).toContainText(/iphone|dell|corolla/i)
  w.expectClean()
})

test('police can open their portal and search for an item', async ({ page }) => {
  const w = watch(page)
  const seller = await apiAs('user2')
  const phone = (await (await seller.get('/api/user-portal/devices')).json()).data.devices.find((x: any) => x.imei)
  await seller.dispose()
  await signIn(page, 'lea')
  await page.goto('/lea')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.goto('/lea/device-search')
  const box = page.getByRole('textbox').first()
  await box.fill(phone.imei)
  await box.press('Enter')
  await expect(page.locator('main')).toContainText(/apple|iphone/i, { timeout: 15_000 })
  w.expectClean()
})

test('the test server is the throw-away one', async ({ request }) => {
  // Guard: these tests must never run against real data
  const state = await (await request.get(`${API}/__e2e/state`)).json()
  expect(Object.keys(state.users)).toEqual(expect.arrayContaining(['user', 'admin', 'lea']))
  expect((await accounts()).user.email).toMatch(/@test\.proveownership\.local$/)
})
