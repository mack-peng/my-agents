# Playwright Test Framework Reference

不常用的 Playwright Test 概念，需要时查阅。

## CLI Commands

```
npx playwright test [options] [test-filter...]
npx playwright test --headed
npx playwright test --project=chromium
npx playwright test --ui
npx playwright test --debug
npx playwright test --workers=1
npx playwright test -g "test title"
npx playwright test --last-failed
npx playwright test --shard=1/3
```

## Configuration (`playwright.config.ts`)

```ts
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Core API

**Locators:**
- `page.getByRole('button', { name: 'Submit' })`
- `page.getByText('Hello')` / `page.getByLabel('Email')` / `page.getByPlaceholder('Enter name')`
- `page.getByTestId('login-button')` / `page.getByTitle('Close')` / `page.getByAltText('logo')`
- `page.locator('.class')` / `page.locator('#id')`
- `locator.filter({ hasText: '...' })` / `locator.first()` / `locator.nth(n)`
- `page.frameLocator('#frame').getByRole('...')`

**Actions:**
```ts
await locator.click() / .fill('text') / .type('text') / .check() / .uncheck()
await locator.selectOption('value') / .hover() / .dragTo(target) / .focus()
await locator.press('Enter') / .setInputFiles('file.txt')
```

**Assertions:**
```ts
await expect(locator).toBeVisible() / .toBeHidden() / .toBeChecked()
await expect(locator).toHaveText('text') / .toContainText('partial') / .toHaveValue('value')
await expect(page).toHaveTitle(/Playwright/) / .toHaveURL('**/login')
```

**Annotations:**
```ts
test.skip('reason') / test.fail() / test.fixme() / test.slow() / test.only()
test.describe('group', () => {})
test('login @fast', async () => {})  // Tags: @fast, @slow
```
