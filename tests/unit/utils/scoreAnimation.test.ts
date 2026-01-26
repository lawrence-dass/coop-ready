import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useScoreAnimation } from '@/lib/utils/scoreAnimation';

describe('useScoreAnimation', () => {
  it('should start at 0', () => {
    const { result } = renderHook(() => useScoreAnimation(75));
    expect(result.current).toBe(0);
  });

  it('should eventually reach final score', async () => {
    const { result } = renderHook(() => useScoreAnimation(75));

    await waitFor(
      () => {
        expect(result.current).toBe(75);
      },
      { timeout: 2000 }
    );
  });

  it('should handle score of 0', async () => {
    const { result } = renderHook(() => useScoreAnimation(0));

    await waitFor(
      () => {
        expect(result.current).toBe(0);
      },
      { timeout: 2000 }
    );
  });

  it('should handle maximum score of 100', async () => {
    const { result } = renderHook(() => useScoreAnimation(100));

    await waitFor(
      () => {
        expect(result.current).toBe(100);
      },
      { timeout: 2000 }
    );
  });

  it('should progress through intermediate values', async () => {
    const { result } = renderHook(() => useScoreAnimation(100));

    // Should start at 0
    expect(result.current).toBe(0);

    // Should eventually show progress
    await waitFor(
      () => {
        expect(result.current).toBeGreaterThan(0);
        expect(result.current).toBeLessThanOrEqual(100);
      },
      { timeout: 1500 }
    );

    // Should eventually reach 100
    await waitFor(
      () => {
        expect(result.current).toBe(100);
      },
      { timeout: 2000 }
    );
  });

  it('should maintain final score on re-render', async () => {
    const { result, rerender } = renderHook(
      ({ score }) => useScoreAnimation(score),
      { initialProps: { score: 50 } }
    );

    await waitFor(
      () => {
        expect(result.current).toBe(50);
      },
      { timeout: 2000 }
    );

    // Rerender with same score
    rerender({ score: 50 });

    // Score should stay at 50
    expect(result.current).toBe(50);
  });

  it('should re-animate when score value changes', async () => {
    const { result, rerender } = renderHook(
      ({ score }) => useScoreAnimation(score),
      { initialProps: { score: 50 } }
    );

    // Wait for initial animation to complete
    await waitFor(
      () => {
        expect(result.current).toBe(50);
      },
      { timeout: 2000 }
    );

    // Change score to new value
    rerender({ score: 75 });

    // Score should animate to new value
    await waitFor(
      () => {
        expect(result.current).toBe(75);
      },
      { timeout: 2000 }
    );
  });
});
