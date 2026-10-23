// Browser tests for the whole system: real pages, real API, throw-away
// database. `npm run test:e2e` starts both servers for you:
//   - the API test server (../Check_it_registry_back/tests/e2e/server.js) on 5055
//   - this app, built and served on 4300, talking to that API
// Needs MySQL/MariaDB running with the credentials in the backend .env
// (or TEST_DB_HOST / TEST_DB_USER / TEST_DB_PASSWORD).
import { defineConfig, devices } from '@playwright/test'

const API_PORT = process.env.E2E_API_PORT || '5055'
const WEB_PORT = process.env.E2E_WEB_PORT || '4300'
const WEB_URL = `http://localhost:${WEB_PORT}`
// Use a Chromium that is already installed (CI images), else Playwright's own
const executablePath = process.env.PW_CHROMIUM_PATH || undefined

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'e2e/.report', open: 'never' }]],
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath, args: executablePath ? ['--no-sandbox'] : [] },
  },
  projects: [
    { name: 'flows', testMatch: /flows\/.*\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 860 } } },
    { name: 'flows-phone', testMatch: /flows\/(marketplace|checks)\.spec\.ts/, use: { ...devices['Pixel 7'] } },
    { name: 'screens', testMatch: /screens\.spec\.ts/ },
  ],
  webServer: [
    {
      command: 'node ../Check_it_registry_back/tests/e2e/server.js',
      url: `http://localhost:${API_PORT}/__e2e/state`,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
      env: { E2E_API_PORT: API_PORT, E2E_FRONTEND_URL: WEB_URL },
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: process.env.E2E_SKIP_BUILD ? `npx vite preview --port ${WEB_PORT} --strictPort` : `npx vite build && npx vite preview --port ${WEB_PORT} --strictPort`,
      url: WEB_URL,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
      env: { BACKEND_PORT: API_PORT },
    },
  ],
})
