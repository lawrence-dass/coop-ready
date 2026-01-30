'use client';

/**
 * PreferencesPanel Component
 *
 * Displays the 2 essential optimization preferences for resume scan customization.
 * Other preferences (tone, verbosity, etc.) are inferred by the LLM from context.
 *
 * **Preferences:**
 * - Job Type: Co-op/Internship vs Full-time (changes language framing)
 * - Modification Level: How aggressively to rewrite content
 *
 * **Defaults:**
 * - Loads user's saved preferences from Settings on mount
 * - Falls back to sensible defaults if not set
 */

import { useEffect, useState, useRef } from 'react';
import { useOptimizationStore } from '@/store';
import {
  DEFAULT_PREFERENCES,
  PREFERENCE_METADATA,
  type JobTypePreference,
  type ModificationLevelPreference,
  type OptimizationPreferences,
} from '@/types/preferences';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getScanDefaults } from '@/actions/scan/get-scan-defaults';

// ============================================================================
// HELPER COMPONENT
// ============================================================================

interface PreferenceSelectProps<T extends string> {
  prefKey: keyof typeof PREFERENCE_METADATA;
  value: T;
  onChange: (value: T) => void;
}

function PreferenceSelect<T extends string>({
  prefKey,
  value,
  onChange,
}: PreferenceSelectProps<T>) {
  const metadata = PREFERENCE_METADATA[prefKey];
  const options = Object.entries(metadata.options) as [T, { label: string; description: string }][];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        {metadata.label}
      </Label>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
        {options.map(([optionValue, optionMeta]) => (
          <div key={optionValue} className="flex items-start space-x-3">
            <RadioGroupItem value={optionValue} id={`${prefKey}-${optionValue}`} className="mt-0.5" />
            <Label htmlFor={`${prefKey}-${optionValue}`} className="font-normal cursor-pointer">
              <span className="block text-sm">{optionMeta.label}</span>
              <span className="block text-xs text-muted-foreground">
                {optionMeta.description}
              </span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PreferencesPanel() {
  // Get preferences from store (or use defaults)
  const userPreferences = useOptimizationStore((state) => state.userPreferences);
  const setUserPreferences = useOptimizationStore((state) => state.setUserPreferences);

  // Track if we've loaded user's saved defaults
  const hasLoadedDefaults = useRef(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's saved preferences from Settings on mount
  useEffect(() => {
    if (hasLoadedDefaults.current) {
      setIsLoading(false);
      return;
    }

    async function loadDefaults() {
      try {
        const { data } = await getScanDefaults();
        if (data) {
          // Merge with full defaults (getScanDefaults only returns jobType and modificationLevel)
          setUserPreferences({
            ...DEFAULT_PREFERENCES,
            jobType: data.jobType,
            modificationLevel: data.modificationLevel,
          });
        } else {
          setUserPreferences(DEFAULT_PREFERENCES);
        }
      } catch {
        setUserPreferences(DEFAULT_PREFERENCES);
      } finally {
        hasLoadedDefaults.current = true;
        setIsLoading(false);
      }
    }

    loadDefaults();
  }, [setUserPreferences]);

  // Use defaults if no preferences set
  const currentPreferences = userPreferences ?? DEFAULT_PREFERENCES;

  // Generic handler for preference changes
  const handlePreferenceChange = <K extends keyof OptimizationPreferences>(
    key: K,
    value: OptimizationPreferences[K]
  ) => {
    setUserPreferences({
      ...currentPreferences,
      [key]: value,
    });
  };

  return (
    <Card className={`p-6 ${isLoading ? 'opacity-75' : ''}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Job Type */}
        <PreferenceSelect<JobTypePreference>
          prefKey="jobType"
          value={currentPreferences.jobType}
          onChange={(v) => handlePreferenceChange('jobType', v)}
        />

        {/* Modification Level */}
        <PreferenceSelect<ModificationLevelPreference>
          prefKey="modificationLevel"
          value={currentPreferences.modificationLevel}
          onChange={(v) => handlePreferenceChange('modificationLevel', v)}
        />
      </div>
    </Card>
  );
}
