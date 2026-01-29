'use client';

/**
 * PreferencesPanel Component
 *
 * Story 16.3 - Configuration Options for V0.5 Preferences
 *
 * Displays Job Type and Modification Level options for resume optimization.
 * Selections persist in Zustand store for the scan session.
 *
 * **Features:**
 * - Job Type: Co-op/Internship or Full-time Position
 * - Modification Level: Conservative, Moderate, or Aggressive
 * - Radio buttons with descriptive text
 * - Loads defaults or user's saved preferences
 * - Responsive layout: stack on mobile, side-by-side on desktop
 *
 * @example
 * ```tsx
 * <PreferencesPanel />
 * ```
 */

import { useEffect } from 'react';
import { useOptimizationStore } from '@/store';
import { DEFAULT_PREFERENCES } from '@/types/preferences';
import type { JobTypePreference, ModificationLevelPreference } from '@/types/preferences';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// ============================================================================
// COMPONENT
// ============================================================================

export function PreferencesPanel() {
  // Get preferences from store (or use defaults)
  const userPreferences = useOptimizationStore((state) => state.userPreferences);
  const setUserPreferences = useOptimizationStore((state) => state.setUserPreferences);

  // Initialize preferences in store if not set
  useEffect(() => {
    if (!userPreferences) {
      setUserPreferences(DEFAULT_PREFERENCES);
    }
  }, [userPreferences, setUserPreferences]);

  // Use defaults if no preferences set
  const currentPreferences = userPreferences ?? DEFAULT_PREFERENCES;

  // Handle Job Type change
  const handleJobTypeChange = (value: JobTypePreference) => {
    setUserPreferences({
      ...currentPreferences,
      jobType: value,
    });
  };

  // Handle Modification Level change
  const handleModificationLevelChange = (value: ModificationLevelPreference) => {
    setUserPreferences({
      ...currentPreferences,
      modificationLevel: value,
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Optimization Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Customize how suggestions are generated for your resume
        </p>
      </div>

      {/* Job Type Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Job Type</h4>
        <RadioGroup
          value={currentPreferences.jobType}
          onValueChange={(value) => handleJobTypeChange(value as JobTypePreference)}
        >
          {/* Co-op / Internship Option */}
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="coop" id="job-type-coop" className="mt-1" />
            <Label htmlFor="job-type-coop" className="cursor-pointer">
              <div className="font-medium">Co-op / Internship</div>
              <div className="text-xs text-muted-foreground">
                Learning-focused opportunity, emphasize growth and development
              </div>
            </Label>
          </div>

          {/* Full-time Position Option */}
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="fulltime" id="job-type-fulltime" className="mt-1" />
            <Label htmlFor="job-type-fulltime" className="cursor-pointer">
              <div className="font-medium">Full-time Position</div>
              <div className="text-xs text-muted-foreground">
                Career position, emphasize impact and delivery
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Modification Level Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Modification Level</h4>
        <RadioGroup
          value={currentPreferences.modificationLevel}
          onValueChange={(value) =>
            handleModificationLevelChange(value as ModificationLevelPreference)
          }
        >
          {/* Conservative Option */}
          <div className="flex items-start space-x-2">
            <RadioGroupItem
              value="conservative"
              id="mod-level-conservative"
              className="mt-1"
            />
            <Label htmlFor="mod-level-conservative" className="cursor-pointer">
              <div className="font-medium">Conservative</div>
              <div className="text-xs text-muted-foreground">
                Minimal changes (15-25%) - Only adds keywords, light restructuring
              </div>
            </Label>
          </div>

          {/* Moderate Option */}
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="moderate" id="mod-level-moderate" className="mt-1" />
            <Label htmlFor="mod-level-moderate" className="cursor-pointer">
              <div className="font-medium">Moderate</div>
              <div className="text-xs text-muted-foreground">
                Balanced changes (35-50%) - Restructures for impact
              </div>
            </Label>
          </div>

          {/* Aggressive Option */}
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="aggressive" id="mod-level-aggressive" className="mt-1" />
            <Label htmlFor="mod-level-aggressive" className="cursor-pointer">
              <div className="font-medium">Aggressive</div>
              <div className="text-xs text-muted-foreground">
                Major rewrite (60-75%) - Full reorganization for maximum impact
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </Card>
  );
}
