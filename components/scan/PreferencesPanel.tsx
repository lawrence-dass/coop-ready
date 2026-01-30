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
 */

import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    <div className="space-y-2">
      <Label htmlFor={prefKey} className="text-sm font-medium">
        {metadata.label}
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={prefKey} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionMeta]) => (
            <SelectItem key={optionValue} value={optionValue}>
              <div className="flex flex-col">
                <span>{optionMeta.label}</span>
                <span className="text-xs text-muted-foreground">
                  {optionMeta.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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

  // Initialize preferences in store if not set
  useEffect(() => {
    if (!userPreferences) {
      setUserPreferences(DEFAULT_PREFERENCES);
    }
  }, [userPreferences, setUserPreferences]);

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
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Optimization Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Customize how suggestions are generated for your resume
        </p>
      </div>

      {/* Two preferences side by side */}
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
