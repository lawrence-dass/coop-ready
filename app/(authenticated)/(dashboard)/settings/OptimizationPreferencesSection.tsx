/**
 * OptimizationPreferencesSection Component
 * Story 16.6: Migrate History and Settings - Task 4
 *
 * Form for editing optimization preferences (job type, modification level, industry, keywords).
 * Uses React Hook Form + Zod validation.
 */

'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { updateUserPreferences } from '@/actions/settings/update-user-preferences';

// ============================================================================
// TYPES & SCHEMA
// ============================================================================

// Use same values as scan page - no mapping needed
const preferencesSchema = z.object({
  jobType: z.enum(['coop', 'fulltime']),
  modLevel: z.enum(['conservative', 'moderate', 'aggressive']),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface OptimizationPreferencesSectionProps {
  userId: string;
  preferences: PreferencesFormData;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OptimizationPreferencesSection({
  userId,
  preferences,
}: OptimizationPreferencesSectionProps) {
  const [isPending, startTransition] = useTransition();

  // Initialize form with current preferences
  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      jobType: preferences.jobType,
      modLevel: preferences.modLevel,
    },
  });

  // Handle form submission
  const onSubmit = async (data: PreferencesFormData) => {
    startTransition(async () => {
      const { data: updated, error } = await updateUserPreferences(data);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Preferences saved successfully');
      form.reset(data); // Reset form dirty state
    });
  };

  const isDirty = form.formState.isDirty;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Optimization Preferences</CardTitle>
        <CardDescription>
          Customize how we optimize your resume for job applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Job Type Field - Same options as scan page */}
            <FormField
              control={form.control}
              name="jobType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="coop">Co-op / Internship</SelectItem>
                      <SelectItem value="fulltime">Full-time Position</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Modification Level Field - Same options as scan page */}
            <FormField
              control={form.control}
              name="modLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modification Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select modification level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative - Minimal changes (15-25%)</SelectItem>
                      <SelectItem value="moderate">Moderate - Balanced changes (35-50%)</SelectItem>
                      <SelectItem value="aggressive">Aggressive - Major rewrite (60-75%)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Save Button */}
            <Button 
              type="submit" 
              disabled={!isDirty || isPending}
              className="w-full sm:w-auto"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Saving...' : 'Save Preferences'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
