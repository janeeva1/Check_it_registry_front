// Shared helpers for the browser tests.
import { expect, type Page, type APIRequestContext, request as pwRequest } from '@playwright/test'

export const API = `http://localhost:${process.env.E2E_API_PORT || '5055'}`
export type Role = 'user' | 'user2' | 'business' | 'admin' | 'lea'
export type Account = { id: string; email: string; password: string; role: string; token: string }

let cached: Record<Role, Account> | null = null
export async function accounts(): Promise<Record<Role, Account>> {
  if (cached) return cached
  const ctx = await pwRequest.newContext()
  const r = await ctx.get(`${API}/__e2e/state`)
  cached = (await r.json()).users
  await ctx.dispose()
  return cached!
}

export async function apiAs(role: Role): Promise<APIRequestContext> {
  const a = (await accounts())[role]
  return pwRequest.newContext({ baseURL: API, extraHTTPHeaders: { Authorization: `Bearer ${a.token}` } })
}

// Signs the browser in as a role without typing (the sign-in form itself is
// tested separately in flows/accounts.spec.ts).
export async function signIn(page: Page, role: Role) {
  const a = (await accounts())[role]
  const ctx = await apiAs(role)
  const me = await (await ctx.get('/api/auth/me')).json()
  await ctx.dispose()
  await page.addInitScript(([token, user]) => {
    try { localStorage.setItem('auth_token', token); localStorage.setItem('user_data', user) } catch { /* ignore */ }
  }, [a.token, JSON.stringify(me.user || me)])
}

// Collects things that mean a screen is broken: script errors, failed API
// calls (404 = "endpoint not found", 5xx = server error) and React crashes.
export function watch(page: Page) {
  const problems: string[] = []
  page.on('pageerror', (e) => problems.push(`script error: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const t = m.text()
    // Browsers log every non-2xx response; those are judged below instead
    if (/Failed to load resource|status of 4\d\d/.test(t)) return
    // A request cut off because the test moved on to the next page. Real
    // server failures are still caught below from the responses themselves.
    if (/Network error - unable to connect|Failed to fetch|AbortError/.test(t)) return
    problems.push(`console error: ${t.slice(0, 300)}`)
  })
  page.on('response', (r) => {
    const u = new URL(r.url())
    if (!u.pathname.startsWith('/api/')) return
    if (r.status() === 404 || r.status() >= 500) problems.push(`${r.request().method()} ${u.pathname} -> ${r.status()}`)
  })
  return {
    problems,
    expectClean: () => { if (problems.length) throw new Error(problems.join('; ')) },
  }
}

export async function settle(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page.waitForTimeout(200)
}

export async function expectNoSideScroll(page: Page) {
  const over = await page.evaluate(() => {
    const w = document.documentElement.clientWidth
    // Inside a box that clips or scrolls sideways, wide content is fine
    const clipped = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX
        if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') return true
      }
      return false
    }
    const wide = [...document.querySelectorAll('body *')]
      .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > w + 2 && getComputedStyle(el).position !== 'fixed' && !clipped(el) })
      .slice(0, 4).map((el) => `${el.tagName.toLowerCase()}.${String((el as HTMLElement).className?.baseVal ?? (el as HTMLElement).className).split(' ').slice(0, 3).join('.')} (${Math.round(el.getBoundingClientRect().right)}px)`)
    return { scroll: document.documentElement.scrollWidth - w, wide }
  })
  expect(over.scroll, `page is wider than the screen by ${over.scroll}px; widest parts: ${over.wide.join(', ')}`).toBeLessThanOrEqual(2)
}

export async function expectNotBroken(page: Page) {
  await expect(page.getByText('Something went wrong', { exact: false })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /page not found/i })).toHaveCount(0)
}

// A valid 15-digit IMEI with its check digit
export function makeImei() {
  const d = ('35' + String(Date.now()).slice(-9) + String(Math.floor(100 + Math.random() * 899))).slice(0, 14).split('').map(Number)
  let sum = 0
  for (let i = 0; i < 14; i++) { let x = d[i]; if (i % 2 === 1) { x *= 2; if (x > 9) x -= 9 } sum += x }
  return d.join('') + ((10 - (sum % 10)) % 10)
}
export const uniq = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
