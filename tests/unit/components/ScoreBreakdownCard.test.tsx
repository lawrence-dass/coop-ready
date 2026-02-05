import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScoreBreakdownCard } from '@/components/shared/ScoreBreakdownCard';
import type { ScoreBreakdown } from '@/types/analysis';
import type { ATSScoreV21 } from '@/lib/scoring/types';

describe('ScoreBreakdownCard Component', () => {
  const mockBreakdown: ScoreBreakdown = {
    keywordScore: 85,
    sectionCoverageScore: 67,
    contentQualityScore: 71,
  };

  describe('Rendering', () => {
    it('should render all three score categories', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(screen.getByText('Keyword Alignment')).toBeInTheDocument();
      expect(screen.getByText('Section Coverage')).toBeInTheDocument();
      expect(screen.getByText('Content Quality')).toBeInTheDocument();
    });

    it('should display correct score values', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('67')).toBeInTheDocument();
      expect(screen.getByText('71')).toBeInTheDocument();
    });

    it('should show weight percentages', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(screen.getByText('50% weight')).toBeInTheDocument();
      expect(screen.getAllByText('25% weight')).toHaveLength(2);
    });

    it('should render within a Card component', () => {
      const { container } = render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      // shadcn/ui Card adds data-slot="card"
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Progress Bars', () => {
    it('should render progress bar for each category', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      // Progress component from shadcn/ui
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(3);
    });

    it('should have aria labels for progress bars', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(screen.getByLabelText(/Keyword Alignment score: 85 percent/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Section Coverage score: 67 percent/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Content Quality score: 71 percent/i)).toBeInTheDocument();
    });
  });

  describe('Category Descriptions', () => {
    it('should show description for Keyword Alignment', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(
        screen.getByText(/keyword match between resume and job description/i)
      ).toBeInTheDocument();
    });

    it('should show description for Section Coverage', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(
        screen.getByText(/essential sections.*summary.*skills.*experience/i)
      ).toBeInTheDocument();
    });

    it('should show description for Content Quality', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(
        screen.getByText(/how relevant.*clear.*impactful/i)
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle score of 0', () => {
      const zeroBreakdown: ScoreBreakdown = {
        keywordScore: 0,
        sectionCoverageScore: 0,
        contentQualityScore: 0,
      };

      render(<ScoreBreakdownCard breakdown={zeroBreakdown} />);

      // Should show 0 three times (one for each category)
      expect(screen.getAllByText('0')).toHaveLength(3);
    });

    it('should handle score of 100', () => {
      const perfectBreakdown: ScoreBreakdown = {
        keywordScore: 100,
        sectionCoverageScore: 100,
        contentQualityScore: 100,
      };

      render(<ScoreBreakdownCard breakdown={perfectBreakdown} />);

      expect(screen.getAllByText('100')).toHaveLength(3);
    });

    it('should handle mixed score ranges', () => {
      const mixedBreakdown: ScoreBreakdown = {
        keywordScore: 25, // Low
        sectionCoverageScore: 55, // Medium
        contentQualityScore: 95, // High
      };

      render(<ScoreBreakdownCard breakdown={mixedBreakdown} />);

      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('55')).toBeInTheDocument();
      expect(screen.getByText('95')).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('should apply red color for scores below 40', () => {
      const lowBreakdown: ScoreBreakdown = {
        keywordScore: 25,
        sectionCoverageScore: 39,
        contentQualityScore: 0,
      };

      const { container } = render(<ScoreBreakdownCard breakdown={lowBreakdown} />);

      // Check that progress bars use red color class
      const redBars = container.querySelectorAll('.bg-red-500');
      expect(redBars).toHaveLength(3);
    });

    it('should apply amber color for scores between 40-69', () => {
      const midBreakdown: ScoreBreakdown = {
        keywordScore: 40,
        sectionCoverageScore: 55,
        contentQualityScore: 69,
      };

      const { container } = render(<ScoreBreakdownCard breakdown={midBreakdown} />);

      // Check that progress bars use amber color class
      const amberBars = container.querySelectorAll('.bg-amber-500');
      expect(amberBars).toHaveLength(3);
    });

    it('should apply green color for scores 70 and above', () => {
      const highBreakdown: ScoreBreakdown = {
        keywordScore: 70,
        sectionCoverageScore: 85,
        contentQualityScore: 100,
      };

      const { container } = render(<ScoreBreakdownCard breakdown={highBreakdown} />);

      // Check that progress bars use green color class
      const greenBars = container.querySelectorAll('.bg-green-500');
      expect(greenBars).toHaveLength(3);
    });

    it('should apply mixed colors for different score ranges', () => {
      const mixedBreakdown: ScoreBreakdown = {
        keywordScore: 25,  // Red
        sectionCoverageScore: 55,  // Amber
        contentQualityScore: 85,  // Green
      };

      const { container } = render(<ScoreBreakdownCard breakdown={mixedBreakdown} />);

      expect(container.querySelectorAll('.bg-red-500')).toHaveLength(1);
      expect(container.querySelectorAll('.bg-amber-500')).toHaveLength(1);
      expect(container.querySelectorAll('.bg-green-500')).toHaveLength(1);
    });
  });

  describe('Responsive Layout', () => {
    it('should render with proper spacing', () => {
      const { container } = render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      // Check for space-y class (vertical spacing)
      const categoryContainer = container.querySelector('.space-y-4');
      expect(categoryContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      // Category names should be properly labeled
      expect(screen.getByText('Keyword Alignment')).toBeInTheDocument();
      expect(screen.getByText('Section Coverage')).toBeInTheDocument();
      expect(screen.getByText('Content Quality')).toBeInTheDocument();
    });

    it('should include accessible labels for all categories', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      // Progress bars should have descriptive aria-labels
      expect(screen.getByLabelText(/Keyword Alignment score/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Section Coverage score/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Content Quality score/i)).toBeInTheDocument();
    });

    it('should have info button with accessible label', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(screen.getByLabelText('More info about Keyword Alignment')).toBeInTheDocument();
      expect(screen.getByLabelText('More info about Section Coverage')).toBeInTheDocument();
      expect(screen.getByLabelText('More info about Content Quality')).toBeInTheDocument();
    });
  });
});

describe('ScoreBreakdownCard V2.1 Component', () => {
  const mockScoreV21: ATSScoreV21 = {
    overall: 72,
    tier: 'strong',
    breakdown: {
      keywordScore: 75,
      sectionCoverageScore: 80,
      contentQualityScore: 70,
    },
    calculatedAt: new Date().toISOString(),
    breakdownV21: {
      keywords: {
        score: 65,
        weight: 0.4,
        weighted: 26,
        details: {
          score: 65,
          breakdown: {
            requiredScore: 0.6,
            preferredBonus: 0.1,
            penaltyMultiplier: 0.85,
            missingRequiredCount: 2,
            missingPreferredCount: 3,
          },
          details: {
            matchedRequired: [],
            matchedPreferred: [],
            missingRequired: ['Python', 'TypeScript'],
            missingPreferred: ['AWS', 'Docker', 'Kubernetes'],
          },
        },
      },
      qualificationFit: {
        score: 80,
        weight: 0.15,
        weighted: 12,
        details: {
          score: 80,
          breakdown: {
            degreeScore: 100,
            experienceScore: 60,
            certificationScore: 80,
          },
          details: {
            degreeMet: true,
            degreeNote: undefined,
            experienceMet: false,
            experienceNote: 'Job requires 5+ years, resume shows 3 years',
            certificationsMet: ['AWS Solutions Architect'],
            certificationsMissing: ['Kubernetes Administrator'],
          },
        },
      },
      contentQuality: {
        score: 70,
        weight: 0.2,
        weighted: 14,
        details: {
          score: 70,
          breakdown: {
            quantificationScore: 60,
            actionVerbScore: 80,
            keywordDensityScore: 70,
          },
          details: {
            totalBullets: 15,
            bulletsWithMetrics: 8,
            highTierMetrics: 3,
            mediumTierMetrics: 3,
            lowTierMetrics: 2,
            strongVerbCount: 10,
            moderateVerbCount: 3,
            weakVerbCount: 2,
            keywordsFound: ['React', 'Node.js'],
            keywordsMissing: ['GraphQL', 'CI/CD'],
          },
        },
      },
      sections: {
        score: 85,
        weight: 0.15,
        weighted: 12.75,
        details: {
          score: 85,
          breakdown: {
            summary: { present: true, meetsThreshold: true, points: 20, maxPoints: 20 },
            skills: { present: true, meetsThreshold: true, points: 25, maxPoints: 25 },
            experience: { present: true, meetsThreshold: true, points: 30, maxPoints: 30 },
            education: { present: true, meetsThreshold: false, points: 10, maxPoints: 25, issues: ['Missing graduation date'] },
          },
          educationQuality: {
            score: 70,
            breakdown: {
              hasRelevantCoursework: false,
              courseworkMatchScore: 0,
              hasGPA: false,
              gpaStrong: false,
              hasProjects: false,
              hasHonors: false,
              hasLocation: true,
              hasProperDateFormat: false,
            },
            suggestions: ['Add relevant coursework', 'Include graduation date'],
          },
        },
      },
      format: {
        score: 88,
        weight: 0.1,
        weighted: 8.8,
        details: {
          score: 88,
          breakdown: {
            hasEmail: true,
            hasPhone: true,
            hasLinkedIn: false,
            hasGitHub: true,
            hasParseableDates: true,
            hasSectionHeaders: true,
            hasBulletStructure: true,
            appropriateLength: true,
            noOutdatedFormats: true,
          },
          issues: ['Missing LinkedIn profile URL'],
          warnings: ['Consider adding portfolio link'],
        },
      },
    },
    metadata: {
      version: 'v2.1',
      algorithmHash: 'test-hash',
      processingTimeMs: 100,
      detectedRole: 'software_engineer',
      detectedSeniority: 'mid',
      weightsUsed: {
        keywords: 0.4,
        qualificationFit: 0.15,
        contentQuality: 0.2,
        sections: 0.15,
        format: 0.1,
      },
    },
    actionItems: [
      {
        priority: 'critical',
        category: 'Keywords',
        message: 'Add missing required keywords: Python, TypeScript',
        potentialImpact: 15,
      },
      {
        priority: 'high',
        category: 'Qualification',
        message: 'Highlight more years of relevant experience',
        potentialImpact: 8,
      },
    ],
  };

  describe('V2.1 Rendering', () => {
    it('should render all five V2.1 score components', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      expect(screen.getByText('Keywords')).toBeInTheDocument();
      expect(screen.getByText('Qualification Fit')).toBeInTheDocument();
      expect(screen.getByText('Content Quality')).toBeInTheDocument();
      expect(screen.getByText('Sections')).toBeInTheDocument();
      expect(screen.getByText('Format')).toBeInTheDocument();
    });

    it('should display correct score values', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      expect(screen.getByText('65')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
      expect(screen.getByText('70')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('88')).toBeInTheDocument();
    });

    it('should render progress bars for each component', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(5);
    });
  });

  describe('V2.1 Expandable Details', () => {
    it('should show issue count indicators when collapsed', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      // Multiple components have items, check that at least one indicator exists
      const itemIndicators = screen.getAllByText(/\d+ items?/);
      expect(itemIndicators.length).toBeGreaterThan(0);
    });

    it('should show Expand buttons for each component', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      // All 5 components should have Expand buttons
      const expandButtons = screen.getAllByRole('button', { name: /expand/i });
      expect(expandButtons).toHaveLength(5);
    });

    it('should expand a component when clicked', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      // Click on the first Expand button (Keywords)
      const expandButtons = screen.getAllByRole('button', { name: /expand/i });
      fireEvent.click(expandButtons[0]);

      // Should show the missing keywords issue
      expect(screen.getByText(/Missing 2 required keyword/)).toBeInTheDocument();
    });

    it('should show issues when expanded', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      // Click Format's Expand button (last one, index 4)
      const expandButtons = screen.getAllByRole('button', { name: /expand/i });
      fireEvent.click(expandButtons[4]);

      // Check for issues
      expect(screen.getByText('Missing LinkedIn profile URL')).toBeInTheDocument();
    });

    it('should show suggestions when expanded', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      // Click Format's Expand button (last one, index 4)
      const expandButtons = screen.getAllByRole('button', { name: /expand/i });
      fireEvent.click(expandButtons[4]);

      // Check for suggestions/warnings
      expect(screen.getByText('Consider adding portfolio link')).toBeInTheDocument();
    });

    it('should show Collapse text when expanded', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      // Click to expand
      const expandButtons = screen.getAllByRole('button', { name: /expand/i });
      fireEvent.click(expandButtons[0]);

      // Should now show Collapse button
      expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument();
    });

    it('should collapse when clicking Collapse button', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      // Click Keywords to expand
      const expandButtons = screen.getAllByRole('button', { name: /expand/i });
      fireEvent.click(expandButtons[0]);

      // Verify expanded content shows
      expect(screen.getByText(/Missing 2 required keyword/)).toBeInTheDocument();

      // Click Collapse button
      const collapseButton = screen.getByRole('button', { name: /collapse/i });
      fireEvent.click(collapseButton);

      // Content should no longer be visible
      expect(screen.queryByText(/Missing 2 required keyword/)).not.toBeInTheDocument();
    });

    it('should only allow one component expanded at a time', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      // Expand Keywords (first button)
      let expandButtons = screen.getAllByRole('button', { name: /expand/i });
      fireEvent.click(expandButtons[0]);
      expect(screen.getByText(/Missing 2 required keyword/)).toBeInTheDocument();

      // Expand Format (now index 3 since Keywords shows Collapse)
      expandButtons = screen.getAllByRole('button', { name: /expand/i });
      fireEvent.click(expandButtons[3]); // Format is now at index 3

      // Keywords should be collapsed
      expect(screen.queryByText(/Missing 2 required keyword/)).not.toBeInTheDocument();
      // Format should be expanded
      expect(screen.getByText('Missing LinkedIn profile URL')).toBeInTheDocument();
    });
  });

  describe('V2.1 Top Priorities', () => {
    it('should render Top Priorities section', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      expect(screen.getByText('Top Priorities')).toBeInTheDocument();
    });

    it('should show action items with priority badges', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      expect(screen.getByText('critical')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('should show action item messages', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      expect(screen.getByText('Add missing required keywords: Python, TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Highlight more years of relevant experience')).toBeInTheDocument();
    });

    it('should show potential impact for each action item', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      expect(screen.getByText('+15 pts potential')).toBeInTheDocument();
      expect(screen.getByText('+8 pts potential')).toBeInTheDocument();
    });
  });

  describe('V2.1 Accessibility', () => {
    it('should have aria-expanded attribute on expandable buttons', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      const expandButtons = screen.getAllByRole('button', { name: /expand/i });
      const keywordsButton = expandButtons[0];
      expect(keywordsButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(keywordsButton);
      expect(keywordsButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-controls linking to expanded content', () => {
      render(<ScoreBreakdownCard scoreV21={mockScoreV21} />);

      const expandButtons = screen.getAllByRole('button', { name: /expand/i });
      const keywordsButton = expandButtons[0];
      expect(keywordsButton).toHaveAttribute('aria-controls', 'keywords-details');
    });
  });
});
