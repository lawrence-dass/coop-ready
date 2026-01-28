/**
 * Metrics API E2E Tests
 * Story 12.3 - AC 12.3-3: Metrics API endpoints follow ActionResponse pattern
 *
 * Tests the metrics query API endpoints using Playwright's request context to verify:
 * - /api/metrics/quality-summary returns aggregated daily and weekly metrics
 * - /api/health/quality-metrics returns health status with alerts
 * - Both endpoints follow ActionResponse pattern
 * - Cache-Control headers are present (private, max-age=300)
 *
 * NOTE: These are E2E API tests that make real HTTP requests to the running server.
 * They test the full stack including file system access and response formatting.
 */

import { test, expect } from '@playwright/test';

test.describe('[P1] Metrics API Endpoints', () => {
  test('[P1] /api/metrics/quality-summary should return valid ActionResponse structure', async ({
    request,
  }) => {
    // WHEN: GET /api/metrics/quality-summary
    const response = await request.get('/api/metrics/quality-summary');

    // THEN: Returns 200 status
    expect(response.status()).toBe(200);

    // AND: Response follows ActionResponse pattern
    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('error');

    // AND: Either returns data with metrics or error with null data
    if (body.error === null) {
      expect(body.data).toBeDefined();
      expect(body.data).toHaveProperty('metrics'); // actual structure
      expect(body.data).toHaveProperty('trend');
      expect(body.data).toHaveProperty('failure_patterns');
    } else {
      expect(body.data).toBeNull();
      expect(body.error).toHaveProperty('code');
      expect(body.error).toHaveProperty('message');
    }
  });

  test('[P1] /api/metrics/quality-summary should include Cache-Control headers', async ({
    request,
  }) => {
    // WHEN: GET /api/metrics/quality-summary
    const response = await request.get('/api/metrics/quality-summary');

    // THEN: Response includes Cache-Control header
    const cacheControl = response.headers()['cache-control'];
    expect(cacheControl).toContain('private');
    expect(cacheControl).toContain('max-age=300');
  });

  test('[P1] /api/metrics/quality-summary with period=weekly should return weekly metrics', async ({
    request,
  }) => {
    // WHEN: GET /api/metrics/quality-summary?period=weekly
    const response = await request.get('/api/metrics/quality-summary?period=weekly');

    // THEN: Returns 200 status
    expect(response.status()).toBe(200);

    // AND: Response follows ActionResponse pattern
    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('error');
  });

  test('[P1] /api/health/quality-metrics should return valid ActionResponse structure', async ({
    request,
  }) => {
    // WHEN: GET /api/health/quality-metrics
    const response = await request.get('/api/health/quality-metrics');

    // THEN: Returns 200 status
    expect(response.status()).toBe(200);

    // AND: Response follows ActionResponse pattern
    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('error');

    // AND: Either returns data with health status or error with null data
    if (body.error === null) {
      expect(body.data).toBeDefined();
      expect(body.data).toHaveProperty('status');
      expect(body.data).toHaveProperty('pass_rate');
      expect(body.data).toHaveProperty('avg_score');
      expect(body.data).toHaveProperty('alerts');
      expect(['healthy', 'warning', 'critical']).toContain(body.data.status);
    } else {
      expect(body.data).toBeNull();
      expect(body.error).toHaveProperty('code');
      expect(body.error).toHaveProperty('message');
    }
  });

  test('[P1] /api/health/quality-metrics should include Cache-Control headers', async ({
    request,
  }) => {
    // WHEN: GET /api/health/quality-metrics
    const response = await request.get('/api/health/quality-metrics');

    // THEN: Response includes Cache-Control header
    const cacheControl = response.headers()['cache-control'];
    expect(cacheControl).toContain('private');
    expect(cacheControl).toContain('max-age=300');
  });

  test('[P1] /api/health/quality-metrics should handle no data gracefully', async ({
    request,
  }) => {
    // WHEN: GET /api/health/quality-metrics (on fresh deployment with no data)
    const response = await request.get('/api/health/quality-metrics');

    const body = await response.json();

    // THEN: Returns 200 and healthy status with info message
    expect(response.status()).toBe(200);
    expect(body.error).toBeNull();
    expect(body.data).toBeDefined();

    // AND: Status is "healthy" (no data = no alerts, only info message)
    expect(body.data.status).toBe('healthy');
    expect(body.data.pass_rate).toBe(0);
    expect(body.data.avg_score).toBe(0);

    // Note: alerts may include ["No metrics data available"] info message
    expect(body.data.alerts).toBeDefined();
    expect(Array.isArray(body.data.alerts)).toBe(true);
  });

  test('[P1] Endpoints should not throw errors even on file system issues', async ({
    request,
  }) => {
    // GIVEN: APIs may encounter file system errors (missing dirs, permissions, etc.)
    // WHEN: Making requests to both endpoints
    const summaryResponse = await request.get('/api/metrics/quality-summary');
    const healthResponse = await request.get('/api/health/quality-metrics');

    // THEN: Both return valid responses (do not throw or return 500)
    expect(summaryResponse.status()).toBe(200);
    expect(healthResponse.status()).toBe(200);

    // AND: Both follow ActionResponse pattern
    const summaryBody = await summaryResponse.json();
    const healthBody = await healthResponse.json();

    expect(summaryBody).toHaveProperty('data');
    expect(summaryBody).toHaveProperty('error');
    expect(healthBody).toHaveProperty('data');
    expect(healthBody).toHaveProperty('error');
  });
});
