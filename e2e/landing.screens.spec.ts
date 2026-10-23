// The landing page with everything on it: scroll through so every section
// animates in, then check each one is there.
import { test, expect } from '@playwright/test'
import { settle, expectNoSideScroll } from './support'

for (const width of [390, 820, 1366]) {
  test(`landing page sections at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await settle(page)
    for (let y = 0; y < 12000; y += 500) { await page.mouse.wheel(0, 500); await page.waitForTimeout(120) }
    await page.waitForTimeout(800)
    for (const id of ['features-section', 'contact']) await expect(page.locator(`#${id}`)).toBeAttached()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoSideScroll(page)
    await page.screenshot({ path: `e2e/.screens/landing_full_${width}.png`, fullPage: true })
  })
}
