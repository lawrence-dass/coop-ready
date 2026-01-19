import { test as base, expect } from '@playwright/test';
import { UserFactory } from './factories/user-factory';
import { ResumeFactory } from './factories/resume-factory';
import { ScanFactory } from './factories/scan-factory';

/**
 * CoopReady Test Fixtures
 *
 * Extends Playwright's base test with CoopReady-specific fixtures.
 * Uses pure function -> fixture -> mergeTests pattern.
 *
 * @see _bmad/bmm/testarch/knowledge/fixture-architecture.md
 */

type TestFixtures = {
  userFactory: UserFactory;
  resumeFactory: ResumeFactory;
  scanFactory: ScanFactory;
};

export const test = base.extend<TestFixtures>({
  userFactory: async ({ request }, use) => {
    const factory = new UserFactory(request);
    await use(factory);
    await factory.cleanup();
  },

  resumeFactory: async ({ request }, use) => {
    const factory = new ResumeFactory(request);
    await use(factory);
    await factory.cleanup();
  },

  scanFactory: async ({ request }, use) => {
    const factory = new ScanFactory(request);
    await use(factory);
    await factory.cleanup();
  },
});

export { expect };
