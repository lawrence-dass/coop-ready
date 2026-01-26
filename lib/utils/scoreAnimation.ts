import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for animating score count-up from 0 to final value
 * Uses requestAnimationFrame for smooth 60fps animation
 * Applies ease-out cubic easing for natural feel
 * Re-animates when the score value changes (not on simple re-renders)
 *
 * @param finalScore - Target score value (0-100)
 * @param duration - Animation duration in milliseconds (default: 1000ms)
 * @returns Current animated score value
 */
export function useScoreAnimation(
  finalScore: number,
  duration: number = 1000
): number {
  const [displayScore, setDisplayScore] = useState(0);
  const lastAnimatedScore = useRef<number | null>(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    // Skip if we've already animated to this exact score value
    if (lastAnimatedScore.current === finalScore) return;

    // Capture start value before animation begins
    const startFrom = lastAnimatedScore.current === null ? 0 : startValueRef.current;
    startValueRef.current = displayScore;

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: fast start, slow end
      const eased = 1 - Math.pow(1 - progress, 3);
      // Animate from start position to final score
      const currentScore = Math.round(startFrom + eased * (finalScore - startFrom));

      setDisplayScore(currentScore);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        lastAnimatedScore.current = finalScore;
        startValueRef.current = finalScore;
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
    // displayScore intentionally excluded to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalScore, duration]);

  return displayScore;
}
