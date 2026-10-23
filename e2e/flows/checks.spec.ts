// Checking an item before buying it. Checks need the checker's location
// (kept on purpose), so the browser is given one in Lagos.
import { test, expect } from '@playwright/test'
import { apiAs, makeImei, signIn, watch } from '../support'

test.use({ geolocation: { latitude: 6.5244, longitude: 3.3792 }, permissions: ['geolocation'] })
test.beforeEach(async ({ page }) => { await signIn(page, 'user') })

test('a registered, verified item shows as safe', async ({ page }) => {
  const w = watch(page)
  const seller = await apiAs('user2')
  const list = await (await seller.get('/api/user-portal/devices')).json()
  const phone = list.data.devices.find((d: any) => d.imei)
  await seller.dispose()
  await page.goto('/device-check')
  await page.locator('#check-id').fill(phone.imei)
  await page.getByRole('button', { name: /^check$/i }).click()
  await expect(page.getByRole('heading', { name: /no theft reports/i })).toBeVisible({ timeout: 20_000 })
  w.expectClean()
})

test('an unknown number says it is not registered', async ({ page }) => {
  await page.goto('/device-check')
  await page.locator('#check-id').fill(makeImei())
  await page.getByRole('button', { name: /^check$/i }).click()
  await expect(page.getByRole('heading', { name: /not registered/i }).first()).toBeVisible({ timeout: 20_000 })
})

test('my checks appear in my check history, and open a full report', async ({ page }) => {
  await page.goto('/device-check')
  await page.locator('#check-id').fill(makeImei())
  await page.getByRole('button', { name: /^check$/i }).click()
  await expect(page.getByRole('heading', { name: /not registered/i }).first()).toBeVisible({ timeout: 20_000 })
  await page.goto('/device-check-report')
  await expect(page.getByRole('heading', { name: /check history/i })).toBeVisible()
  const rows = page.getByTestId('my-checks').locator('button')
  await expect(rows.first()).toBeVisible()
  await rows.first().click()
  await expect(page).toHaveURL(/checkId=/)
})

test('the owner sees who checked their item', async ({ page, context }) => {
  // Ada (user) checks the seller's iPhone, then the seller looks at their tracker
  const seller = await apiAs('user2')
  const phone = (await (await seller.get('/api/user-portal/devices')).json()).data.devices.find((d: any) => d.imei)
  await seller.dispose()
  await page.goto('/device-check')
  await page.locator('#check-id').fill(phone.imei)
  await page.getByRole('button', { name: /^check$/i }).click()
  await expect(page.getByRole('heading', { name: /no theft reports/i }).first()).toBeVisible({ timeout: 20_000 })

  await context.clearCookies()
  const owner = await context.newPage()
  await signIn(owner, 'user2')
  await owner.goto(`/device/${phone.id}`)
  await owner.getByRole('link', { name: /who checked this item/i }).click()
  await expect(owner.getByRole('heading', { name: /who checked this item/i })).toBeVisible()
  await expect(owner.getByTestId('item-checks')).toContainText(/ada/i)
})

test('when the free checks are used up, the check asks for payment', async ({ page }) => {
  const admin = await apiAs('admin')
  await admin.put('/api/revenue-admin/fees/device_check_free_tier', { data: { value: 0 } })
  try {
    await page.goto('/device-check')
    await page.locator('#check-id').fill(makeImei())
    await page.getByRole('button', { name: /^check$/i }).click()
    await expect(page.getByText(/payment required/i)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /pay ngn/i })).toBeVisible()
  } finally {
    await admin.put('/api/revenue-admin/fees/device_check_free_tier', { data: { value: 100000 } })
    await admin.dispose()
  }
})
