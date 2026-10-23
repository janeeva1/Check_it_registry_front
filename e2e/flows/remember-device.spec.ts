// "Remember me": tick it, enter the emailed code once, and the next sign-in
// on the same browser goes straight in. Admin accounts always get the code
// on an unknown browser, so they are used here.
import { test, expect, type Page } from '@playwright/test'
import { API, accounts } from '../support'

async function signInWithForm(page: Page, email: string, password: string, remember: boolean) {
  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  if (remember) await page.getByText('Remember me').click()
  await page.getByRole('button', { name: /sign in/i }).click()
}

async function enterCode(page: Page, userId: string) {
  let code = ''
  await expect.poll(async () => {
    const r = await page.request.get(`${API}/__e2e/otp?user=${userId}&type=device_login`)
    code = (await r.json()).otp || ''
    return code
  }, { timeout: 15_000 }).not.toBe('')
  await page.locator('input[maxlength="1"], input[inputmode="numeric"]').first().click()
  await page.keyboard.type(code)
}

test('a remembered browser skips the code next time, even after signing out', async ({ page }) => {
  const { admin } = await accounts()
  await signInWithForm(page, admin.email, admin.password, true)
  // the code screen opens with "remember this device" already ticked
  const remember = page.locator('#rememberDevice')
  await expect(remember).toBeVisible()
  await expect(remember).toBeChecked()
  await enterCode(page, admin.id)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 })

  // sign out, keeping the browser
  await page.evaluate(() => { localStorage.removeItem('auth_token'); localStorage.removeItem('user_data') })
  await signInWithForm(page, admin.email, admin.password, false)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 })
  await expect(page.locator('#rememberDevice')).toHaveCount(0)
})

test('a new browser still needs the code', async ({ browser }) => {
  const { admin } = await accounts()
  const fresh = await browser.newContext()
  const page = await fresh.newPage()
  await signInWithForm(page, admin.email, admin.password, false)
  await expect(page.locator('#rememberDevice')).toBeVisible()
  await expect(page.locator('#rememberDevice')).not.toBeChecked()
  await fresh.close()
})
