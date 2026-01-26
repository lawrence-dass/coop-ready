'use client';

import { useMemo } from 'react';
import { useScoreAnimation } from '@/lib/utils/scoreAnimation';

export interface ScoreCircleProps {
  score: number; // 0-100
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  loading?: boolean;
  label?: string;
  className?: string;
}

const SIZE_CONFIG = {
  small: {
    width: 48,
    height: 48,
    radius: 18,
    strokeWidth: 4,
    fontSize: 16,
    labelFontSize: 8,
  },
  medium: {
    width: 100,
    height: 100,
    radius: 40,
    strokeWidth: 8,
    fontSize: 32,
    labelFontSize: 12,
  },
  large: {
    width: 160,
    height: 160,
    radius: 70,
    strokeWidth: 12,
    fontSize: 48,
    labelFontSize: 14,
  },
} as const;

function getScoreColor(score: number): string {
  if (score < 40) return '#EF4444'; // danger (red)
  if (score < 70) return '#F59E0B'; // warning (amber)
  return '#10B981'; // success (green)
}

export function ScoreCircle({
  score,
  size = 'large',
  animated = true,
  loading = false,
  label = 'ATS Match',
  className = '',
}: ScoreCircleProps) {
  const config = SIZE_CONFIG[size];
  const center = config.width / 2;

  // Use animated score if animation is enabled, otherwise use static score
  const animatedScore = useScoreAnimation(score);
  const displayScore = animated ? animatedScore : score;

  const { circumference, offset } = useMemo(() => {
    const circ = 2 * Math.PI * config.radius;
    const off = circ - (displayScore / 100) * circ;
    return { circumference: circ, offset: off };
  }, [config.radius, displayScore]);

  const scoreColor = getScoreColor(displayScore);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: config.width, height: config.height }}
      >
        <div
          className="animate-spin rounded-full border-4 border-gray-200"
          style={{
            width: config.radius * 2,
            height: config.radius * 2,
            borderTopColor: scoreColor,
          }}
        />
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={displayScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label} score: ${displayScore} percent`}
      className={className}
    >
      <svg width={config.width} height={config.height}>
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={config.radius}
          stroke="#E5E7EB"
          strokeWidth={config.strokeWidth}
          fill="none"
        />

        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={config.radius}
          stroke={scoreColor}
          strokeWidth={config.strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={
            animated
              ? { transition: 'stroke-dashoffset 1s ease-out' }
              : undefined
          }
        />

        {/* Center score text */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dy="0.1em"
          fontSize={config.fontSize}
          fontWeight="bold"
          fill="currentColor"
        >
          {displayScore}
        </text>

        {/* Label text */}
        <text
          x={center}
          y={center + config.fontSize / 2 + 8}
          textAnchor="middle"
          fontSize={config.labelFontSize}
          fill="#6B7280"
        >
          {label}
        </text>
      </svg>

      {/* Screen reader text */}
      <span className="sr-only">{displayScore} percent</span>
    </div>
  );
}
