# CI/CD Setup Guide - Test Automation

**Date:** 2026-01-21
**Status:** Ready to Configure
**Workflows Created:** 2 (test-suite.yml, e2e-tests.yml)

---

## Overview

This guide explains how to set up GitHub Actions for automated test execution on every push and pull request. Two workflows are configured:

1. **test-suite.yml** - Complete test suite (integration + E2E, requires test user secrets)
2. **e2e-tests.yml** - E2E only (simpler, minimal configuration)

---

## Quick Setup (5 minutes)

### Step 1: Configure GitHub Secrets

1. Go to **Settings → Secrets and variables → Actions**
2. Click **"New repository secret"** and add:

**Secret 1: TEST_USER_EMAIL**
- Name: `TEST_USER_EMAIL`
- Value: `test-e2e@example.com`

**Secret 2: TEST_USER_PASSWORD**
- Name: `TEST_USER_PASSWORD`
- Value: `TestPassword123!@#` (or your secure test password)

**Secret 3 (Optional): SUPABASE_SERVICE_ROLE_KEY**
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: Your Supabase service role key (for direct DB access if needed)

### Step 2: Create Test User in Supabase

Before workflows can run, the test user must exist in your Supabase project:

1. Go to **https://app.supabase.com/project/nzuabdurdrxloczklcvm**
2. Navigate to **Authentication → Users**
3. Click **"Add User"**
4. Enter:
   - Email: `test-e2e@example.com`
   - Password: `TestPassword123!@#`
   - Auto-confirm: ✅ Yes
5. Click **"Create User"**

### Step 3: Enable Workflows

The workflows are automatically detected once you push to GitHub:

```bash
git add .github/workflows/
git commit -m "ci: Add complete test automation workflows"
git push origin main
```

Workflows will trigger on:
- Every push to `main` branch
- Every pull request to `main` branch
- Manual trigger (via Actions tab)

---

## Workflow Details

### test-suite.yml - Complete Test Automation

**File:** `.github/workflows/test-suite.yml`

**Jobs:**
1. **integration-tests** - Runs Phase 1 (87 tests)
   - Duration: ~2 seconds
   - Tests: API errors, database ops, content merging
   - Run: `npm test -- tests/integration`

2. **e2e-tests** - Runs Phase 2 (35 tests)
   - Duration: ~60 seconds
   - Tests: User workflows, UI interactions
   - Run: `npm run test:e2e`
   - Dependency: Requires integration tests to pass first

3. **test-summary** - Reports overall status
   - Duration: ~1 second
   - Shows combined test results in PR/commit

**Configuration:**

```yaml
# Triggers
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  workflow_dispatch:

# Environment setup
- Node.js 20
- npm dependencies (cached)
- Playwright browsers (chromium only for CI)

# Test execution
- Phase 1: npm test -- tests/integration
- Phase 2: npm run test:e2e
```

**Expected Results:**

```
Integration Tests:   ✅ 87/87 passing (~2s)
E2E Tests:          ✅ 35/35 passing (~60s)
Total Duration:     ~65 seconds
Status:             ✅ PASS
```

### e2e-tests.yml - E2E Only

**File:** `.github/workflows/e2e-tests.yml`

**Purpose:** Quick E2E validation without full integration suite

**Jobs:**
1. Run E2E tests (`npm run test:e2e`)
2. Upload Playwright report on failure
3. Upload test results on failure

**When to use:**
- Faster feedback (skip integration tests)
- Focused on UI changes
- Quick validation during development

---

## Uncommenting Secrets in Workflows

After creating GitHub secrets, uncomment these lines in the workflows:

### In test-suite.yml (line 51-53)

Find this section:
```yaml
# Uncomment lines below:
# TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
# TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

Uncomment to:
```yaml
TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

### In e2e-tests.yml (line 42-50)

Find this section:
```yaml
# GitHub Secrets Configuration (if needed):
# TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
# TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

Uncomment to:
```yaml
TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

---

## Monitoring Test Runs

### View Workflow Status

1. Go to repository **Actions** tab
2. Select workflow: **"Complete Test Suite"** or **"E2E Tests"**
3. Click latest run to view:
   - Job status (pending, running, passed, failed)
   - Step-by-step execution logs
   - Timing for each step
   - Download artifacts (test reports, screenshots, videos)

### Check PR Status

Pull requests show workflow status checks:
- ✅ All checks passed - Ready to merge
- ⏳ Checks running - Wait for completion
- ❌ Checks failed - Review logs and fix

### Download Test Reports

After a run completes:

1. Go to **Actions → [Workflow Run]**
2. Scroll to **Artifacts**
3. Download:
   - `playwright-report` - HTML test report with videos/screenshots
   - `test-results` - Raw test data
   - `coverage` - Code coverage (if codecov enabled)

---

## Troubleshooting

### Problem: Tests fail with "Login did not redirect"

**Cause:** Test user doesn't exist in Supabase

**Solution:**
1. Create test user manually in Supabase Dashboard
2. Email: `test-e2e@example.com`
3. Password: `TestPassword123!@#`
4. Auto-confirm: Yes

### Problem: Secret values not being used

**Cause:** Secrets not created or not uncommented in workflow

**Solution:**
1. Verify secrets exist in Settings → Secrets
2. Uncomment lines in workflow YAML file
3. Commit and push changes
4. Re-run workflow

### Problem: "Connection refused" errors

**Cause:** Dev server not starting or taking too long

**Solution:**
1. Check `playwright.config.ts` has `webServer` configured
2. Increase timeout: Add to workflow step:
   ```yaml
   timeout-minutes: 20  # Increased from 15
   ```
3. Check server logs in workflow step output

### Problem: Tests timeout after 30 seconds

**Cause:** Server is slow or unresponsive

**Solution:**
1. Increase timeout in `playwright.config.ts`:
   ```typescript
   timeout: 60000  // 60 seconds instead of 30
   ```
2. Increase job timeout:
   ```yaml
   timeout-minutes: 20
   ```

### Problem: "Element not found" errors in E2E tests

**Cause:** UI structure changed or test selectors outdated

**Solution:**
1. Run test locally with UI: `npx playwright test --ui`
2. Inspect page to find correct selectors
3. Update test files with new selectors
4. Re-run workflow

---

## Best Practices

### 1. Secure Test Credentials

✅ **DO:**
- Store passwords in GitHub Secrets
- Use test-specific email domain (e.g., `test-@example.com`)
- Rotate passwords periodically
- Never commit credentials to git

❌ **DON'T:**
- Put passwords in .env files that are committed
- Use production user credentials
- Share secrets in PRs or issues

### 2. Test Reliability

✅ **DO:**
- Make tests deterministic (no timing/randomness)
- Wait for elements explicitly (not arbitrary delays)
- Isolate test data (fresh data per test)
- Use meaningful test IDs (data-testid)

❌ **DON'T:**
- Use hard-coded delays (setTimeout)
- Depend on test execution order
- Share state between tests
- Use flaky selectors (xpath, :hover states)

### 3. Workflow Optimization

✅ **DO:**
- Cache dependencies (`cache: npm`)
- Run jobs in parallel when possible
- Only upload artifacts on failure (saves storage)
- Use matrix strategy for multiple browsers

❌ **DON'T:**
- Run unnecessary steps
- Re-install dependencies each time
- Upload large artifacts always
- Run slow tests on every minor change

### 4. Monitoring & Alerts

✅ **DO:**
- Review test reports after failures
- Set up branch protection rules
- Require passing checks before merge
- Monitor test timing trends

❌ **DON'T:**
- Ignore failing workflows
- Merge with failing tests
- Allow flaky tests to exist
- Accumulate slow tests

---

## Advanced Configuration

### Parallel Browser Testing

To test on multiple browsers (Chromium, Firefox, Safari):

```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]

steps:
  - run: npx playwright install --with-deps ${{ matrix.browser }}
  - run: npx playwright test --project=${{ matrix.browser }}
```

### Scheduled Nightly Tests

To run tests on a schedule (e.g., nightly):

```yaml
on:
  schedule:
    # Every day at 2 AM UTC
    - cron: '0 2 * * *'
```

### Slack Notifications

To notify Slack on test failures:

```yaml
- name: Slack Notification
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Tests failed on ${{ github.ref }}"
      }
```

### Code Coverage Tracking

To track coverage over time:

```yaml
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
    fail_ci_if_error: true
```

---

## Integration with Branch Protection

### Set Up Protection Rules

1. Go to **Settings → Branches → Branch protection rules**
2. Click **"Add rule"**
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
5. Select status checks:
   - ✅ Complete Test Suite / integration-tests
   - ✅ Complete Test Suite / e2e-tests
   - ✅ Complete Test Suite / test-summary

Now all PRs must pass tests before merging!

---

## NPM Scripts Reference

Ensure these scripts exist in `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:integration": "jest tests/integration",
    "test:e2e": "playwright test tests/e2e",
    "test:e2e:ui": "playwright test tests/e2e --ui",
    "test:e2e:debug": "playwright test tests/e2e --debug",
    "test:coverage": "jest --coverage"
  }
}
```

If missing, add to package.json and commit.

---

## Next Steps

### Immediate (Today)

1. ✅ Create test user in Supabase (5 minutes)
2. ✅ Add GitHub secrets (2 minutes)
3. ✅ Uncomment secret lines in workflows (1 minute)
4. ✅ Push changes to trigger workflow (instant)
5. ✅ Monitor Actions tab for results (1-2 minutes)

### Follow-up (This Week)

1. Review first test run results
2. Fix any issues (usually environment-related)
3. Set up branch protection rules
4. Document any customizations needed

### Future (Next Sprint)

1. Add visual regression testing baselines
2. Expand to other epics
3. Add performance benchmarks
4. Consider load testing

---

## Summary

**CI/CD Setup provides:**
✅ Automated test execution on every push/PR
✅ 122 tests (87 integration + 35 E2E) validation
✅ ~65 second feedback loop
✅ Artifact reports with videos/screenshots
✅ PR status checks preventing broken merges

**5-Minute Setup:**
1. Create test user in Supabase
2. Add GitHub secrets (TEST_USER_EMAIL, TEST_USER_PASSWORD)
3. Uncomment secret references in workflow files
4. Push to main branch
5. Monitor Actions tab

**Status:** Ready to implement - all files created, awaiting test user setup to activate workflows.

---

Generated: 2026-01-21
Epic 5 Test Automation
Phase: CI/CD Integration Ready
