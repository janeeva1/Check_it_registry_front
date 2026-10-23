// Every screen, for every kind of account, on a phone, a tablet and a
// laptop: it opens, nothing crashes, no API call is "not found" or a server
// error, and nothing spills off the side of the screen. A screenshot of each
// is saved in e2e/.screens for a quick visual check.
import { test } from '@playwright/test'
import { apiAs, signIn, watch, settle, expectNoSideScroll, expectNotBroken, type Role } from './support'

const WIDTHS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'laptop', width: 1366, height: 860 },
]

const PUBLIC = ['/', '/login', '/register', '/forgot-password', '/business-register', '/marketplace', '/help', '/terms', '/privacy', '/cookies', '/verify-device', '/this-page-does-not-exist']
const USER = ['/dashboard', '/my-devices', '/register-device', '/device-check', '/reports', '/report-incident', '/report-missing', '/claim', '/transfer',
  '/marketplace', '/marketplace/create-listing', '/marketplace-inbox', '/cart', '/orders', '/notifications', '/profile', '/settings',
  '/identity-verification', '/verification-status', '/payments/transactions', '/device-recovery', '/found-device', '/bulk-register', '/seller/orders']
const BUSINESS = ['/business', '/business/my-listings', '/business/onboard', '/business/onboardings', '/business/payouts', '/business/payout-settings', '/business-verification']
const ADMIN = ['/admin', '/admin/alerts', '/admin/device-management', '/admin/lea-management', '/admin/report-management', '/admin/system-settings',
  '/admin/transfers', '/admin/verification-queue', '/admin/archive', '/admin/ownership-review', '/admin/device-categories', '/admin/landing-content',
  '/admin/marketplace', '/admin/revenue', '/admin/fraud-alerts', '/admin/recovery', '/user-management', '/analytics', '/audit-trail', '/admin/custody']
const LEA = ['/lea', '/lea/alerts', '/lea/cases', '/lea/communication', '/lea/device-search', '/lea/recovery', '/lea/settings', '/lea/transfers', '/lea/custody']

async function dynamicPages(): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = { user: [], admin: [] }
  const user = await apiAs('user')
  const devices = await (await user.get('/api/user-portal/devices')).json()
  const firstDevice = devices?.data?.devices?.[0]?.id
  if (firstDevice) out.user.push(`/device/${firstDevice}`)
  const listings = await (await user.get('/api/marketplace')).json()
  const firstListing = (Array.isArray(listings) ? listings : listings?.listings || [])[0]?.id
  if (firstListing) out.user.push(`/marketplace/listing/${firstListing}`, `/checkout?listing=${firstListing}`, `/marketplace-inbox/${firstListing}`)
  await user.dispose()
  if (firstDevice) out.admin.push(`/admin/devices/${firstDevice}`)
  return out
}

const groups: Array<[Role | 'guest', string[]]> = [['guest', PUBLIC], ['user', USER], ['business', BUSINESS], ['admin', ADMIN], ['lea', LEA]]

for (const size of WIDTHS) {
  test.describe(`${size.name} (${size.width}px)`, () => {
    test.use({ viewport: { width: size.width, height: size.height } })
    for (const [role, pages] of groups) {
      test(`${role} screens`, async ({ page }, info) => {
        test.slow()
        if (role !== 'guest') await signIn(page, role)
        const extra = role === 'user' || role === 'admin' ? (await dynamicPages())[role] : []
        const failures: string[] = []
        for (const path of [...pages, ...extra]) {
          const w = watch(page)
          await page.goto(path)
          await settle(page)
          try {
            if (path !== '/this-page-does-not-exist') await expectNotBroken(page)
            await expectNoSideScroll(page)
            w.expectClean()
          } catch (e: any) {
            failures.push(`${path}: ${String(e.message).replace(/\u001b\[\d+m/g, '').split('\n').filter(Boolean).slice(0, 2).join(' | ')}`)
          }
          const file = `${role}_${path.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home'}_${size.width}.png`
          await page.screenshot({ path: `e2e/.screens/${file}`, fullPage: true }).catch(() => {})
          page.removeAllListeners('response'); page.removeAllListeners('console'); page.removeAllListeners('pageerror')
        }
        if (failures.length) info.annotations.push({ type: 'failures', description: failures.join('\n') })
        if (failures.length) throw new Error(`${failures.length} screen(s) have problems:\n${failures.join('\n')}`)
      })
    }
  })
}
