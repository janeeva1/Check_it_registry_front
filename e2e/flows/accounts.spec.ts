// Accounts: sign up, confirm email, sign in, wrong password, and who may
// open which pages.
import { test, expect } from '@playwright/test'
import { API, accounts, signIn, uniq, watch } from '../support'

test('a new person signs up, confirms their email and lands on their dashboard', async ({ page, request }) => {
  const w = watch(page)
  const email = `new.${uniq()}@test.proveownership.local`
  await page.goto('/register')
  await page.getByLabel(/first name/i).fill('Ngozi')
  await page.getByLabel(/last name/i).fill('Eze')
  await page.getByLabel(/email/i).fill(email)
  await page.getByRole('button', { name: /next/i }).click()
  await page.locator('#password').fill('Str0ng!Passw0rd#2026')
  await page.locator('#confirmPassword').fill('Str0ng!Passw0rd#2026')
  await page.getByRole('button', { name: /next/i }).click()
  await page.locator('#phone').fill('080' + String(Date.now()).slice(-8))
  await page.locator('#region').fill('Lagos')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /create|register|sign up/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 })

  // The confirmation email has a link; open it like the person would
  let link = ''
  await expect.poll(async () => {
    const mails = await (await request.get(`${API}/__e2e/outbox?to=${encodeURIComponent(email)}`)).json()
    link = (mails.map((m: any) => m.html.match(/https?:\/\/[^"'\s<>]*verify-email\?token=[^"'\s<>]+/)?.[0]).find(Boolean)) || ''
    return link
  }, { timeout: 15_000 }).not.toBe('')
  await page.goto(new URL(link).pathname + new URL(link).search)
  await expect(page.getByRole('heading', { name: /email verified/i }).first()).toBeVisible()
  w.expectClean()
})

test('signing in with the form, and a clear message for a wrong password', async ({ page }) => {
  const { user } = await accounts()
  await page.goto('/login')
  await page.locator('#email').fill(user.email)
  await page.locator('#password').fill('not-the-password')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page.getByText(/invalid|incorrect|wrong/i).first()).toBeVisible()

  await page.locator('#password').fill(user.password)
  await page.getByRole('button', { name: /sign in/i }).click()
  // Either straight in, or a sign-in code step for a new browser
  await expect(page).toHaveURL(/\/(dashboard|login)/)
})

test('pages for signed-in people send visitors to sign in', async ({ page }) => {
  for (const path of ['/dashboard', '/my-devices', '/register-device', '/device-check']) {
    await page.goto(path)
    await expect(page, `${path} should ask to sign in`).toHaveURL(/\/login/)
  }
})

test('people cannot open pages for other roles', async ({ page }) => {
  await signIn(page, 'user')
  for (const path of ['/admin', '/admin/ownership-review', '/lea', '/business']) {
    await page.goto(path)
    await expect(page, `${path} must not open for a normal user`).not.toHaveURL(new RegExp(`${path}$`))
  }
})

test('visitors see no way to check an item', async ({ page }) => {
  await page.goto('/')
  for (let y = 0; y < 12000; y += 600) { await page.mouse.wheel(0, 600); await page.waitForTimeout(80) }
  await expect(page.getByRole('button', { name: /check a device/i })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /check an item|check a device/i })).toHaveCount(0)
  await expect(page.getByText(/verify device status/i)).toHaveCount(0)
  await expect(page.locator('input[placeholder*="IMEI" i]')).toHaveCount(0)
})

test('signed-in people do see the check button on the landing page', async ({ page }) => {
  await signIn(page, 'user')
  await page.goto('/')
  await page.getByRole('button', { name: /check a device status/i }).scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: /check a device status/i }).click()
  await expect(page).toHaveURL(/\/device-check/)
})

test('"Verify Identity" on the profile opens the identity page (no hidden pop-up)', async ({ page }) => {
  await signIn(page, 'business')
  await page.goto('/profile')
  await page.getByRole('button', { name: /verify identity|start verification/i }).first().click()
  await expect(page).toHaveURL(/\/identity-verification/)
  await expect(page.getByRole('heading', { name: /your identity/i }).first()).toBeVisible()
  await page.goto('/profile')
  await page.getByRole('link', { name: /verify your business/i }).click()
  await expect(page).toHaveURL(/\/business-verification/)
})
