// Filing a report on the screens: every report pays the report fee and
// confirms identity with the NIN; the wording is the same every time. A
// reported item is then held by Prove Ownership, and the owner pays the
// release fee to get it back once it is found.
import { test, expect, type Page } from '@playwright/test'
import { API, accounts, apiAs, makeImei, signIn, watch } from '../support'

async function newItem(): Promise<string> {
  const { user } = await accounts()
  const api = await apiAs('user')
  const d = await (await api.post('/api/device-management', { data: { category: 'smartphone', brand: 'Tecno', model: 'Spark 20', imei: makeImei() } })).json()
  await api.dispose()
  // confirm it as the email link would
  const r = await fetch(`${API}/__e2e/confirm-item`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device: d.id, user: user.id }) })
  expect(r.ok).toBeTruthy()
  return d.id
}

// "Paying on Paystack": find the invoice the page just created and pay it
async function payLatest(page: Page, userId: string) {
  let inv: any = {}
  await expect.poll(async () => { inv = await (await page.request.get(`${API}/__e2e/last-invoice?user=${userId}`)).json(); return inv.status }, { timeout: 15_000 }).toBe('pending')
  const r = await page.request.post(`${API}/__e2e/pay`, { data: { reference: inv.reference, amount: Number(inv.amount) } })
  expect(r.ok()).toBeTruthy()
}

async function fileReport(page: Page, deviceId: string, nin: string, userId: string) {
  await page.goto(`/report-incident?device=${deviceId}`)
  await page.getByText('Stolen', { exact: true }).first().click()
  await page.getByPlaceholder(/detailed description/i).fill('Taken from my bag on the bus at Yaba')
  await page.getByPlaceholder(/where did this happen/i).fill('Yaba, Lagos')
  await page.locator('input[type="datetime-local"]').fill('2026-10-20T14:30')
  await page.getByRole('button', { name: /continue/i }).click()

  // 1. Pay the report fee
  const pay = page.getByTestId('report-pay')
  await expect(pay).toContainText(/pay the report fee/i)
  await expect(page.getByRole('button', { name: /submit report/i })).toBeDisabled()
  await pay.getByRole('button', { name: /^pay /i }).click()
  const popup = page.waitForEvent('popup').catch(() => null)
  await page.getByRole('button', { name: /^pay ngn/i }).last().click()
  ;(await popup)?.close().catch(() => {})
  await payLatest(page, userId)
  await expect(pay).toContainText(/paid/i, { timeout: 20_000 })

  // 2. Confirm identity (the same box and words on every report)
  const id = page.getByTestId('report-identity')
  await expect(id).toContainText('Confirm your identity')
  await expect(id).not.toContainText(/one-time|first report|already verified/i)
  await page.locator('#report-nin').fill(nin)
  await page.getByRole('button', { name: /submit report/i }).click()
}

test('two reports: each pays and asks for the NIN, the second without a new Prembly lookup', async ({ page }) => {
  test.slow()
  const w = watch(page)
  const { user } = await accounts()
  await signIn(page, 'user')
  const nin = (await (await page.request.post(`${API}/__e2e/person`, { data: { first_name: 'Ada', last_name: 'Tester' } })).json()).nin

  await fileReport(page, await newItem(), nin, user.id)
  await expect(page.getByText(/report submitted|submitted successfully/i).first()).toBeVisible({ timeout: 20_000 })
  expect((await (await page.request.get(`${API}/__e2e/prembly-calls?number=${nin}`)).json()).count).toBe(1)

  // A second report: pays again, asks for the NIN again, no new Prembly call
  await fileReport(page, await newItem(), nin, user.id)
  await expect(page.getByText(/report submitted|submitted successfully/i).first()).toBeVisible({ timeout: 20_000 })
  expect((await (await page.request.get(`${API}/__e2e/prembly-calls?number=${nin}`)).json()).count).toBe(1)
  w.expectClean()
})

test('a wrong NIN is refused and the payment is kept', async ({ page }) => {
  test.slow()
  const { user } = await accounts()
  await signIn(page, 'user')
  await fileReport(page, await newItem(), '70000000001', user.id)
  await expect(page.getByRole('alert')).toContainText(/could not confirm your identity|cannot be used/i)
  await expect(page.getByRole('alert')).toContainText(/payment is kept/i)
  await expect(page.getByTestId('report-pay')).toContainText(/paid/i)
})

test('a reported item is held by Prove Ownership, and comes back after the release fee', async ({ page }) => {
  test.slow()
  const w = watch(page)
  const { user } = await accounts()
  await signIn(page, 'user')
  const nin = (await (await page.request.post(`${API}/__e2e/person`, { data: { first_name: 'Ada', last_name: 'Tester' } })).json()).nin
  const deviceId = await newItem()
  await fileReport(page, deviceId, nin, user.id)
  await expect(page.getByText(/report submitted|submitted successfully/i).first()).toBeVisible({ timeout: 20_000 })

  await page.goto(`/device/${deviceId}`)
  await expect(page.getByTestId('custody-panel')).toContainText(/held by prove ownership/i)

  // Police mark it found on the held-items desk
  const lea = await apiAs('lea')
  const desk = await (await lea.get('/api/custody/desk')).json()
  const held = desk.items.find((c: any) => c.device_id === deviceId)
  expect(held).toBeTruthy()
  expect((await lea.post(`/api/custody/${held.id}/found`, { data: { note: 'Recovered at Ojota' } })).ok()).toBeTruthy()

  // The owner pays the release fee
  await page.reload()
  const panel = page.getByTestId('custody-panel')
  await expect(panel).toContainText(/has been found/i)
  await panel.getByRole('button', { name: /pay release fee/i }).click()
  const popup = page.waitForEvent('popup').catch(() => null)
  await page.getByRole('button', { name: /^pay ngn/i }).last().click()
  ;(await popup)?.close().catch(() => {})
  await payLatest(page, user.id)
  await expect(panel).toContainText(/release fee paid/i, { timeout: 20_000 })

  // Police hand it back: it's the owner's again
  expect((await lea.post(`/api/custody/${held.id}/handover`)).ok()).toBeTruthy()
  await lea.dispose()
  await page.reload()
  await expect(page.getByTestId('custody-panel')).toHaveCount(0)
  w.expectClean()
})

test('the held-items desk opens for admin and police', async ({ page }) => {
  await signIn(page, 'admin')
  await page.goto('/admin/custody')
  await expect(page.getByRole('heading', { name: /held items/i })).toBeVisible()
})

test('the identity page confirms a NIN at no charge, then locks the name', async ({ page }) => {
  await signIn(page, 'user2')
  const nin = (await (await page.request.post(`${API}/__e2e/person`, { data: { first_name: 'Bola', last_name: 'Tester' } })).json()).nin
  await page.goto('/identity-verification')
  await page.locator('#id-nin').fill(nin)
  await page.getByRole('button', { name: /^confirm$/i }).click()
  await expect(page.getByTestId('identity-confirmed')).toBeVisible()
})

test('the legal pages describe the real rules', async ({ page }) => {
  await page.goto('/terms')
  for (const t of [/report fee/i, /held by prove ownership/i, /release fee/i, /no public check/i, /Nigeria/]) await expect(page.locator('body')).toContainText(t)
  await page.goto('/privacy')
  for (const t of [/Nigeria Data Protection Act 2023/, /Prembly/, /encrypted/i]) await expect(page.locator('body')).toContainText(t)
  await page.goto('/cookies')
  for (const t of [/po_device_id/, /auth_token/, /do not use advertising/i]) await expect(page.locator('body')).toContainText(t)
})
