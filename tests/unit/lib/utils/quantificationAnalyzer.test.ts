import {
  analyzeBulletQuantification,
  calculateDensity,
  getDensityCategory,
} from '@/lib/utils/quantificationAnalyzer';

describe('analyzeBulletQuantification', () => {
  it('should detect numbers in bullets', () => {
    const bullets = [
      'Increased sales by 150 units',
      'Managed 5 team members',
      'No metrics here',
    ];

    const result = analyzeBulletQuantification(bullets);

    expect(result[0].hasMetrics).toBe(true);
    expect(result[0].metrics.numbers).toContain('150');

    expect(result[1].hasMetrics).toBe(true);
    expect(result[1].metrics.numbers).toContain('5');

    expect(result[2].hasMetrics).toBe(false);
    expect(result[2].metrics.numbers).toHaveLength(0);
  });

  it('should detect percentages', () => {
    const bullets = [
      'Improved efficiency by 25%',
      'Achieved 100% completion rate',
      'Ranked in top 5% of team',
    ];

    const result = analyzeBulletQuantification(bullets);

    expect(result[0].hasMetrics).toBe(true);
    expect(result[0].metrics.percentages).toContain('25%');

    expect(result[1].hasMetrics).toBe(true);
    expect(result[1].metrics.percentages).toContain('100%');

    expect(result[2].hasMetrics).toBe(true);
    expect(result[2].metrics.percentages).toContain('5%');
  });

  it('should detect currency amounts', () => {
    const bullets = [
      'Generated $500,000 in revenue',
      'Saved £25,000 annually',
      'Managed €1.5M budget',
    ];

    const result = analyzeBulletQuantification(bullets);

    expect(result[0].hasMetrics).toBe(true);
    expect(result[0].metrics.currency).toContain('$500,000');

    expect(result[1].hasMetrics).toBe(true);
    expect(result[1].metrics.currency).toContain('£25,000');

    expect(result[2].hasMetrics).toBe(true);
    expect(result[2].metrics.currency.some(c => c.includes('€1.5'))).toBe(true);
  });

  it('should detect time units', () => {
    const bullets = [
      'Completed project in 3 months',
      'Reduced processing time by 5 days',
      'Worked 40 hours per week',
      'Delivered in 2 years',
    ];

    const result = analyzeBulletQuantification(bullets);

    expect(result[0].hasMetrics).toBe(true);
    expect(result[0].metrics.timeUnits).toContain('3 months');

    expect(result[1].hasMetrics).toBe(true);
    expect(result[1].metrics.timeUnits).toContain('5 days');

    expect(result[2].hasMetrics).toBe(true);
    expect(result[2].metrics.timeUnits).toContain('40 hours');

    expect(result[3].hasMetrics).toBe(true);
    expect(result[3].metrics.timeUnits).toContain('2 years');
  });

  it('should handle edge cases', () => {
    const bullets = [
      'Saved $50k in costs',
      'Managed 500M+ records',
      'Ranked in top 5% globally',
      'Experience: 3-5 years',
      'Grew revenue by $1.5M',
    ];

    const result = analyzeBulletQuantification(bullets);

    // $50k
    expect(result[0].hasMetrics).toBe(true);
    expect(result[0].metrics.currency.some(c => c.includes('$50'))).toBe(true);

    // 500M+
    expect(result[1].hasMetrics).toBe(true);
    expect(result[1].metrics.numbers.some(n => n.includes('500'))).toBe(true);

    // top 5%
    expect(result[2].hasMetrics).toBe(true);
    expect(result[2].metrics.percentages).toContain('5%');

    // 3-5 years - contains time units
    expect(result[3].hasMetrics).toBe(true);
    expect(result[3].metrics.timeUnits.some(t => t.includes('years'))).toBe(true);

    // $1.5M
    expect(result[4].hasMetrics).toBe(true);
    expect(result[4].metrics.currency.some(c => c.includes('$1.5'))).toBe(true);
  });

  it('should return all metrics found in metricsFound array', () => {
    const bullets = ['Increased revenue by $100k and improved efficiency by 25% in 6 months'];

    const result = analyzeBulletQuantification(bullets);

    expect(result[0].hasMetrics).toBe(true);
    expect(result[0].metricsFound.length).toBeGreaterThan(0);
    expect(result[0].metrics.currency.length).toBeGreaterThan(0);
    expect(result[0].metrics.percentages.length).toBeGreaterThan(0);
    expect(result[0].metrics.timeUnits.length).toBeGreaterThan(0);
  });
});

describe('calculateDensity', () => {
  it('should return 0% density when no metrics present', () => {
    const bullets = [
      'Worked on various projects',
      'Collaborated with team members',
      'Developed software solutions',
    ];

    const result = calculateDensity(bullets);

    expect(result.totalBullets).toBe(3);
    expect(result.bulletsWithMetrics).toBe(0);
    expect(result.density).toBe(0);
  });

  it('should return 100% density when all bullets have metrics', () => {
    const bullets = [
      'Increased sales by 50%',
      'Managed team of 10 people',
      'Saved $25,000 annually',
    ];

    const result = calculateDensity(bullets);

    expect(result.totalBullets).toBe(3);
    expect(result.bulletsWithMetrics).toBe(3);
    expect(result.density).toBe(100);
  });

  it('should calculate correct percentage for mixed bullets (AC2 test case)', () => {
    const bullets = [
      'Increased revenue by $100k',
      'Managed team of 5',
      'Improved efficiency by 25%',
      'Led project implementation', // No metrics
      'Reduced costs by $50k',
      'Completed in 6 months', // Has metrics (timeUnits)
      'Achieved 95% customer satisfaction',
      'Streamlined processes by 30%',
      'No metrics here', // No metrics
      'Handled 200 customer requests', // Has metrics
    ];

    const result = calculateDensity(bullets);

    expect(result.totalBullets).toBe(10);
    expect(result.bulletsWithMetrics).toBe(8);
    expect(result.density).toBe(80);
  });

  it('should categorize metrics by type', () => {
    const bullets = [
      'Saved $100k',
      'Improved by 25%',
      'Managed 10 people',
      'Completed in 3 months',
    ];

    const result = calculateDensity(bullets);

    expect(result.byCategory.currency).toBe(1);
    expect(result.byCategory.percentages).toBe(1);
    expect(result.byCategory.numbers).toBe(1); // "10 people" - "3 months" is in timeUnits
    expect(result.byCategory.timeUnits).toBe(1);
  });

  it('should handle empty array', () => {
    const result = calculateDensity([]);

    expect(result.totalBullets).toBe(0);
    expect(result.bulletsWithMetrics).toBe(0);
    expect(result.density).toBe(0);
  });
});

describe('getDensityCategory', () => {
  it('should return "low" for density below 50%', () => {
    expect(getDensityCategory(0)).toBe('low');
    expect(getDensityCategory(30)).toBe('low');
    expect(getDensityCategory(49)).toBe('low');
  });

  it('should return "moderate" for density between 50% and 79%', () => {
    expect(getDensityCategory(50)).toBe('moderate');
    expect(getDensityCategory(65)).toBe('moderate');
    expect(getDensityCategory(79)).toBe('moderate');
  });

  it('should return "strong" for density 80% and above', () => {
    expect(getDensityCategory(80)).toBe('strong');
    expect(getDensityCategory(90)).toBe('strong');
    expect(getDensityCategory(100)).toBe('strong');
  });
});
