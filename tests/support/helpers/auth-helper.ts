import { Page, BrowserContext } from '@playwright/test';

/**
 * Authentication Helper
 *
 * Pure functions for authentication flows.
 * Use API-first approach for speed when possible.
 */

type LoginParams = {
  page: Page;
  email: string;
  password: string;
};

type ApiLoginParams = {
  context: BrowserContext;
  email: string;
  password: string;
};

/**
 * Login via UI (slower, use for testing login flow itself)
 */
export async function loginViaUi({ page, email, password }: LoginParams): Promise<void> {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(/\/(dashboard|scan)/);
}

/**
 * Login via API and set session cookie (faster, use for test setup)
 */
export async function loginViaApi({ context, email, password }: ApiLoginParams): Promise<void> {
  const response = await context.request.post('/api/auth/login', {
    data: { email, password },
  });

  if (!response.ok()) {
    throw new Error(`API login failed: ${response.status()}`);
  }

  // Session cookie is automatically set by Supabase SSR
}

/**
 * Logout user
 */
export async function logout(page: Page): Promise<void> {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/');
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
