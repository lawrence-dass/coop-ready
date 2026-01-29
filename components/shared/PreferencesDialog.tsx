/**
 * PreferencesDialog Component
 *
 * Modal dialog for configuring optimization preferences.
 * Allows users to customize 7 dimensions of suggestion generation.
 *
 * Story 11.2: Implement Optimization Preferences
 * Story 13.3: Add Job Type and Modification Level preferences
 *
 * **Features:**
 * - All 7 preferences configurable with radio buttons
 * - Clear descriptions for each option
 * - Reset to Defaults button
 * - Save Preferences button
 * - Success/error toast notifications
 * - Loading states during save
 *
 * @example
 * ```tsx
 * <PreferencesDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSaveSuccess={(prefs) => console.log('Saved:', prefs)}
 * />
 * ```
 */

'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Settings, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  OptimizationPreferences,
  DEFAULT_PREFERENCES,
  PREFERENCE_METADATA,
  TonePreference,
  VerbosityPreference,
  EmphasisPreference,
  IndustryPreference,
  ExperienceLevelPreference,
  JobTypePreference,
  ModificationLevelPreference,
} from '@/types';
import { savePreferences } from '@/actions/preferences';

interface PreferencesDialogProps {
  /** Whether the dialog is open */
  open: boolean;

  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;

  /** Initial preferences to populate form (optional, defaults to DEFAULT_PREFERENCES) */
  initialPreferences?: OptimizationPreferences | null;

  /** Called after successful save with updated preferences */
  onSaveSuccess?: (preferences: OptimizationPreferences) => void;
}

export function PreferencesDialog({
  open,
  onOpenChange,
  initialPreferences,
  onSaveSuccess,
}: PreferencesDialogProps) {
  const [isPending, startTransition] = useTransition();

  // Form state
  const [preferences, setPreferences] = useState<OptimizationPreferences>(
    initialPreferences ?? DEFAULT_PREFERENCES
  );

  // Update form when initialPreferences change
  useEffect(() => {
    if (initialPreferences) {
      setPreferences(initialPreferences);
    }
  }, [initialPreferences]);

  // Reset to defaults
  const handleReset = () => {
    setPreferences(DEFAULT_PREFERENCES);
    toast.success('Preferences reset to defaults');
  };

  // Save preferences
  const handleSave = () => {
    startTransition(async () => {
      const { data, error } = await savePreferences(preferences);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Preferences saved successfully!');
      onSaveSuccess?.(data);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Optimization Preferences
          </DialogTitle>
          <DialogDescription>
            Customize how suggestions are generated to match your needs and style.
            These settings apply to all future optimizations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Job Type Preference */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">
                {PREFERENCE_METADATA.jobType.label}
              </Label>
              <p className="text-sm text-muted-foreground">
                {PREFERENCE_METADATA.jobType.description}
              </p>
            </div>
            <RadioGroup
              value={preferences.jobType}
              onValueChange={(value) =>
                setPreferences({
                  ...preferences,
                  jobType: value as JobTypePreference,
                })
              }
              className="space-y-2"
            >
              {Object.entries(PREFERENCE_METADATA.jobType.options).map(
                ([key, option]) => (
                  <div key={key} className="flex items-start space-x-2">
                    <RadioGroupItem
                      value={key}
                      id={`jobType-${key}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`jobType-${key}`}
                        className="font-medium cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                      {'example' in option && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          Ex: "{option.example}"
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}
            </RadioGroup>
          </div>

          {/* Modification Level Preference */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">
                {PREFERENCE_METADATA.modificationLevel.label}
              </Label>
              <p className="text-sm text-muted-foreground">
                {PREFERENCE_METADATA.modificationLevel.description}
              </p>
            </div>
            <RadioGroup
              value={preferences.modificationLevel}
              onValueChange={(value) =>
                setPreferences({
                  ...preferences,
                  modificationLevel: value as ModificationLevelPreference,
                })
              }
              className="space-y-2"
            >
              {Object.entries(PREFERENCE_METADATA.modificationLevel.options).map(
                ([key, option]) => (
                  <div key={key} className="flex items-start space-x-2">
                    <RadioGroupItem
                      value={key}
                      id={`modificationLevel-${key}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`modificationLevel-${key}`}
                        className="font-medium cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                      {'example' in option && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          Ex: "{option.example}"
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}
            </RadioGroup>
          </div>

          {/* Tone Preference */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">
                {PREFERENCE_METADATA.tone.label}
              </Label>
              <p className="text-sm text-muted-foreground">
                {PREFERENCE_METADATA.tone.description}
              </p>
            </div>
            <RadioGroup
              value={preferences.tone}
              onValueChange={(value) =>
                setPreferences({ ...preferences, tone: value as TonePreference })
              }
              className="space-y-2"
            >
              {Object.entries(PREFERENCE_METADATA.tone.options).map(([key, option]) => (
                <div key={key} className="flex items-start space-x-2">
                  <RadioGroupItem value={key} id={`tone-${key}`} className="mt-1" />
                  <div className="flex-1">
                    <Label
                      htmlFor={`tone-${key}`}
                      className="font-medium cursor-pointer"
                    >
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                    {'example' in option && (
                      <p className="text-xs text-muted-foreground italic mt-1">
                        Ex: "{option.example}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Verbosity Preference */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">
                {PREFERENCE_METADATA.verbosity.label}
              </Label>
              <p className="text-sm text-muted-foreground">
                {PREFERENCE_METADATA.verbosity.description}
              </p>
            </div>
            <RadioGroup
              value={preferences.verbosity}
              onValueChange={(value) =>
                setPreferences({
                  ...preferences,
                  verbosity: value as VerbosityPreference,
                })
              }
              className="space-y-2"
            >
              {Object.entries(PREFERENCE_METADATA.verbosity.options).map(
                ([key, option]) => (
                  <div key={key} className="flex items-start space-x-2">
                    <RadioGroupItem
                      value={key}
                      id={`verbosity-${key}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`verbosity-${key}`}
                        className="font-medium cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                )
              )}
            </RadioGroup>
          </div>

          {/* Emphasis Preference */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">
                {PREFERENCE_METADATA.emphasis.label}
              </Label>
              <p className="text-sm text-muted-foreground">
                {PREFERENCE_METADATA.emphasis.description}
              </p>
            </div>
            <RadioGroup
              value={preferences.emphasis}
              onValueChange={(value) =>
                setPreferences({
                  ...preferences,
                  emphasis: value as EmphasisPreference,
                })
              }
              className="space-y-2"
            >
              {Object.entries(PREFERENCE_METADATA.emphasis.options).map(
                ([key, option]) => (
                  <div key={key} className="flex items-start space-x-2">
                    <RadioGroupItem
                      value={key}
                      id={`emphasis-${key}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`emphasis-${key}`}
                        className="font-medium cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                )
              )}
            </RadioGroup>
          </div>

          {/* Industry Preference */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">
                {PREFERENCE_METADATA.industry.label}
              </Label>
              <p className="text-sm text-muted-foreground">
                {PREFERENCE_METADATA.industry.description}
              </p>
            </div>
            <RadioGroup
              value={preferences.industry}
              onValueChange={(value) =>
                setPreferences({
                  ...preferences,
                  industry: value as IndustryPreference,
                })
              }
              className="space-y-2"
            >
              {Object.entries(PREFERENCE_METADATA.industry.options).map(
                ([key, option]) => (
                  <div key={key} className="flex items-start space-x-2">
                    <RadioGroupItem
                      value={key}
                      id={`industry-${key}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`industry-${key}`}
                        className="font-medium cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                )
              )}
            </RadioGroup>
          </div>

          {/* Experience Level Preference */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">
                {PREFERENCE_METADATA.experienceLevel.label}
              </Label>
              <p className="text-sm text-muted-foreground">
                {PREFERENCE_METADATA.experienceLevel.description}
              </p>
            </div>
            <RadioGroup
              value={preferences.experienceLevel}
              onValueChange={(value) =>
                setPreferences({
                  ...preferences,
                  experienceLevel: value as ExperienceLevelPreference,
                })
              }
              className="space-y-2"
            >
              {Object.entries(PREFERENCE_METADATA.experienceLevel.options).map(
                ([key, option]) => (
                  <div key={key} className="flex items-start space-x-2">
                    <RadioGroupItem
                      value={key}
                      id={`experience-${key}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`experience-${key}`}
                        className="font-medium cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                )
              )}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isPending}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
