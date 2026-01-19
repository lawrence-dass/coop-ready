# Epic 8: Test Infrastructure

## Epic Overview

**Epic ID**: E8
**Epic Title**: Test Infrastructure
**Priority**: High (enables quality gates for all other epics)
**Status**: Backlog

## Business Value

Establish a production-ready E2E testing framework that:
- Catches regressions before they reach users
- Enables confident refactoring and feature development
- Provides documentation through executable specifications
- Supports CI/CD quality gates

## Dependencies

- **Requires**: Epic 1 (Project Foundation) - Need basic app structure
- **Enables**: All future epics benefit from test coverage

---

## Stories

### Story 8.1: Initialize Playwright Test Framework

**Story ID**: 8-1-initialize-playwright-framework
**Title**: Initialize Playwright Test Framework
**Status**: Backlog
**Story Points**: 3

#### User Story

As a **developer**, I want a **production-ready Playwright test framework** so that **I can write reliable E2E tests with proper fixtures and data factories**.

#### Acceptance Criteria

- [ ] Playwright installed and configured with TypeScript
- [ ] Directory structure: `tests/e2e/`, `tests/support/fixtures/`, `tests/support/helpers/`
- [ ] Fixture architecture with auto-cleanup pattern
- [ ] Data factories for User, Resume, Scan entities
- [ ] Sample test demonstrating patterns
- [ ] `npm run test:e2e` script works
- [ ] Documentation in `tests/README.md`

#### Technical Notes

- Use TEA [TF] workflow to scaffold
- Follow knowledge base patterns: fixture-architecture.md, data-factories.md
- Configure for failure-only artifact capture
- Support multi-browser (Chromium, Firefox, WebKit)

---

### Story 8.2: CI/CD Test Pipeline

**Story ID**: 8-2-ci-cd-test-pipeline
**Title**: CI/CD Test Pipeline
**Status**: Backlog
**Story Points**: 2

#### User Story

As a **developer**, I want **automated test execution in CI/CD** so that **tests run on every PR and block merges if tests fail**.

#### Acceptance Criteria

- [ ] GitHub Actions workflow for E2E tests
- [ ] Tests run on PR creation and push
- [ ] Test artifacts (traces, screenshots) uploaded on failure
- [ ] PR status check blocks merge on test failure
- [ ] Test report accessible from PR

#### Technical Notes

- Use TEA [CI] workflow to scaffold
- Single worker in CI for stability
- 2 retries for flaky recovery

---

### Story 8.3: Test API Endpoints for Factories

**Story ID**: 8-3-test-api-endpoints
**Title**: Test API Endpoints for Factories
**Status**: Backlog
**Story Points**: 2

#### User Story

As a **test author**, I want **test-only API endpoints** so that **data factories can seed and cleanup test data via API**.

#### Acceptance Criteria

- [ ] `POST /api/test/users` - Create test user
- [ ] `DELETE /api/test/users/:id` - Delete test user
- [ ] `POST /api/test/resumes` - Create test resume
- [ ] `DELETE /api/test/resumes/:id` - Delete test resume
- [ ] `POST /api/test/scans` - Create test scan
- [ ] `DELETE /api/test/scans/:id` - Delete test scan
- [ ] Endpoints only available in test/development environments
- [ ] Proper authentication/authorization for test endpoints

#### Technical Notes

- Gate endpoints with `process.env.NODE_ENV !== 'production'`
- Consider using Supabase service role for direct DB access
- Follow project-context.md ActionResponse pattern

---

## Completion Criteria

- [ ] All stories completed and verified
- [ ] Test framework documented
- [ ] CI pipeline running on PRs
- [ ] At least one real E2E test covering a user flow

---

_Created: 2026-01-18_
_Epic Owner: TEA (Test Architect)_
