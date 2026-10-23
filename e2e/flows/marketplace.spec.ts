// Marketplace: browse, filter, search, open a listing, buy, message,
// report — as a visitor, a buyer and the seller.
import { test, expect } from '@playwright/test'
import { signIn, watch } from '../support'

test('visitors can browse, filter and search', async ({ page }) => {
  const w = watch(page)
  await page.goto('/marketplace')
  await expect(page.getByRole('heading', { name: /buy with confidence/i })).toBeVisible()
  const cards = page.getByTestId('listing-grid').locator('a.po-listing')
  await expect(cards.first()).toBeVisible()
  expect(await cards.count()).toBeGreaterThanOrEqual(3)
  // every card shows a photo, a price and the verified-owner mark
  for (const card of await cards.all()) {
    await expect(card.locator('img')).toBeVisible()
    await expect(card.locator('.po-listing-price')).toContainText('₦')
    await expect(card.getByText(/verified owner/i)).toBeVisible()
  }

  await page.getByRole('tab', { name: /vehicles/i }).click()
  await expect(cards).toHaveCount(1)
  await expect(cards.first()).toContainText(/corolla/i)
  await page.getByRole('tab', { name: /everything/i }).click()

  await page.getByLabel('Search listings').fill('Dell')
  await expect(cards).toHaveCount(1)
  await expect(cards.first()).toContainText(/dell/i)
  await page.getByLabel('Search listings').fill('nothing-like-this-exists')
  await expect(page.getByText(/nothing for sale here yet/i)).toBeVisible()
  w.expectClean()
})

test('price sorting puts the cheapest first', async ({ page }) => {
  await page.goto('/marketplace')
  await page.getByLabel('Sort').selectOption('low')
  const prices = await page.locator('.po-listing-price').allTextContents()
  const nums = prices.map((p) => Number(p.replace(/[^\d]/g, '')))
  expect(nums).toEqual([...nums].sort((a, b) => a - b))
})

test('a visitor opening a listing is asked to sign in to buy', async ({ page }) => {
  await page.goto('/marketplace')
  await page.locator('a.po-listing').first().click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText(/why this is safe/i)).toBeVisible()
  await page.getByRole('button', { name: /buy now/i }).click()
  await expect(page).toHaveURL(/\/login/)
})

test('a buyer can open the photos, buy, message the seller and report a listing', async ({ page }) => {
  const w = watch(page)
  await signIn(page, 'user')
  await page.goto('/marketplace')
  await page.locator('a.po-listing', { hasText: /iphone/i }).click()
  await expect(page.locator('.po-mk-photo img')).toBeVisible()
  await page.getByRole('button', { name: /next photo/i }).click()
  await expect(page.locator('.po-listing-count')).toHaveText('2 / 2')
  const url = page.url()

  await page.getByRole('button', { name: /report this listing/i }).click()
  await page.getByLabel(/what's wrong/i).selectOption('wrong')
  await page.getByRole('button', { name: /send report/i }).click()
  await expect(page.getByText(/we will review this listing/i).first()).toBeVisible()

  await page.getByRole('button', { name: /message seller/i }).click()
  await expect(page).toHaveURL(/\/marketplace-inbox\//)
  await page.goto(url)

  await page.getByRole('button', { name: /buy now/i }).click()
  await expect(page).toHaveURL(/\/checkout\?listing=/)
  await expect(page.getByText(/iphone 14 pro/i).first()).toBeVisible()
  w.expectClean()
})

test('the seller sees their own listing as theirs, without a buy button', async ({ page }) => {
  await signIn(page, 'user2')
  await page.goto('/marketplace')
  await page.locator('a.po-listing').first().click()
  await expect(page.getByRole('link', { name: /this is your listing/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /buy now/i })).toHaveCount(0)
})
