import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',

  /* Only match Playwright test files (*.spec.ts), NOT Vitest files (*.test.ts) */
  testMatch: /.*\.spec\.ts$/,

  /* Explicitly ignore Vitest test files to prevent conflicts */
  testIgnore: ['**/*.test.ts', '**/*.test.tsx'],

  /* Output directory for test artifacts (traces, screenshots, videos) */
  outputDir: 'playwright-artifacts',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
    ['list'],
  ],

  /* Timeouts */
  timeout: 60 * 1000, // Test timeout: 60 seconds
  expect: {
    timeout: 15 * 1000, // Assertion timeout: 15 seconds
  },

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Action timeout */
    actionTimeout: 15 * 1000, // 15 seconds

    /* Navigation timeout */
    navigationTimeout: 30 * 1000, // 30 seconds

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',

    /* Capture screenshot only on failure */
    screenshot: 'only-on-failure',

    /* Record video only when retrying */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  /* In CI, only use chromium for faster runs. Locally, test all browsers. */
  projects: process.env.CI
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
      ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
