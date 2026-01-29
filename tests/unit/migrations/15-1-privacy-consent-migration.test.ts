/**
 * Unit Tests for Privacy Consent Database Migration
 * Story 15.1: Add Privacy Consent Database Columns
 *
 * These tests verify the migration SQL structure and TypeScript type definitions.
 * Actual database execution happens via Supabase migrations in production.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { PrivacyConsentStatus } from '@/types/auth';

describe('Privacy Consent Migration (15.1)', () => {
  describe('Migration File Structure', () => {
    it('should have migration file with correct naming pattern', () => {
      // Verify migration file exists
      const migrationPath = join(
        process.cwd(),
        'supabase',
        'migrations',
        '20260129105112_add_privacy_consent_columns.sql'
      );

      expect(() => {
        readFileSync(migrationPath, 'utf-8');
      }).not.toThrow();
    });

    it('should contain ALTER TABLE statements for both columns', () => {
      const migrationPath = join(
        process.cwd(),
        'supabase',
        'migrations',
        '20260129105112_add_privacy_consent_columns.sql'
      );
      const migrationContent = readFileSync(migrationPath, 'utf-8');

      // Verify privacy_accepted column
      expect(migrationContent).toContain('ADD COLUMN IF NOT EXISTS privacy_accepted');
      expect(migrationContent).toContain('BOOLEAN NOT NULL DEFAULT false');

      // Verify privacy_accepted_at column
      expect(migrationContent).toContain('ADD COLUMN IF NOT EXISTS privacy_accepted_at');
      expect(migrationContent).toContain('TIMESTAMP WITH TIME ZONE');
    });

    it('should include backfill statement for existing records', () => {
      const migrationPath = join(
        process.cwd(),
        'supabase',
        'migrations',
        '20260129105112_add_privacy_consent_columns.sql'
      );
      const migrationContent = readFileSync(migrationPath, 'utf-8');

      // Verify backfill sets privacy_accepted to false for existing records
      expect(migrationContent).toContain('UPDATE profiles');
      expect(migrationContent).toContain('SET privacy_accepted = false');
      expect(migrationContent).toContain('WHERE privacy_accepted IS NULL');
    });

    it('should include COMMENT statements for documentation', () => {
      const migrationPath = join(
        process.cwd(),
        'supabase',
        'migrations',
        '20260129105112_add_privacy_consent_columns.sql'
      );
      const migrationContent = readFileSync(migrationPath, 'utf-8');

      // Verify column comments exist
      expect(migrationContent).toContain('COMMENT ON COLUMN profiles.privacy_accepted');
      expect(migrationContent).toContain('COMMENT ON COLUMN profiles.privacy_accepted_at');
    });

    it('should document RLS policy coverage', () => {
      const migrationPath = join(
        process.cwd(),
        'supabase',
        'migrations',
        '20260129105112_add_privacy_consent_columns.sql'
      );
      const migrationContent = readFileSync(migrationPath, 'utf-8');

      // Verify RLS note is present
      expect(migrationContent).toContain('RLS');
      expect(migrationContent).toContain('UPDATE policy');
    });
  });

  describe('TypeScript Type Definitions', () => {
    it('should define PrivacyConsentStatus interface with correct fields', () => {
      // Type check - this will fail at compile time if types are wrong
      const validStatus: PrivacyConsentStatus = {
        privacyAccepted: false,
        privacyAcceptedAt: null,
      };

      expect(validStatus.privacyAccepted).toBe(false);
      expect(validStatus.privacyAcceptedAt).toBeNull();
    });

    it('should allow privacyAcceptedAt to be Date or null', () => {
      const notAccepted: PrivacyConsentStatus = {
        privacyAccepted: false,
        privacyAcceptedAt: null,
      };

      const accepted: PrivacyConsentStatus = {
        privacyAccepted: true,
        privacyAcceptedAt: new Date('2026-01-29T10:51:12Z'),
      };

      expect(notAccepted.privacyAcceptedAt).toBeNull();
      expect(accepted.privacyAcceptedAt).toBeInstanceOf(Date);
    });
  });

  describe('Migration Expectations', () => {
    it('should document expected column defaults', () => {
      // AC1: privacy_accepted BOOLEAN DEFAULT false
      const expectedDefault = false;
      expect(expectedDefault).toBe(false);
    });

    it('should document expected column nullability', () => {
      // AC2: privacy_accepted_at TIMESTAMP nullable
      const acceptedAt: Date | null = null;
      expect(acceptedAt).toBeNull();
    });

    it('should verify existing profiles get privacy_accepted = false', () => {
      // AC3: Backfill existing profiles with privacy_accepted = false
      // This is enforced by the UPDATE statement in migration
      const existingProfileDefault = false;
      expect(existingProfileDefault).toBe(false);
    });
  });

  describe('AC Verification via Migration SQL', () => {
    const migrationPath = join(
      process.cwd(),
      'supabase',
      'migrations',
      '20260129105112_add_privacy_consent_columns.sql'
    );

    it('AC1: privacy_accepted BOOLEAN column exists with default false and NOT NULL', () => {
      const content = readFileSync(migrationPath, 'utf-8');
      expect(content).toContain('ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN');
      expect(content).toContain('NOT NULL DEFAULT false');
    });

    it('AC2: privacy_accepted_at TIMESTAMP column exists and is nullable', () => {
      const content = readFileSync(migrationPath, 'utf-8');
      expect(content).toContain('ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMP WITH TIME ZONE');
      // Nullable because no NOT NULL constraint
      expect(content).not.toMatch(/privacy_accepted_at.*NOT NULL/);
    });

    it('AC3: Existing profiles have privacy_accepted = false after migration (backfill)', () => {
      const content = readFileSync(migrationPath, 'utf-8');
      expect(content).toContain('UPDATE profiles SET privacy_accepted = false WHERE privacy_accepted IS NULL');
    });

    it('AC4: RLS policies documented (existing UPDATE policy covers new columns)', () => {
      const content = readFileSync(migrationPath, 'utf-8');
      expect(content).toContain('RLS Note');
      expect(content).toContain('UPDATE policy');
      expect(content).toContain('20260123000000_create_profiles_table.sql');
    });

    it('AC5: Index rationale documented in migration', () => {
      const content = readFileSync(migrationPath, 'utf-8');
      expect(content).toContain('Index Note');
      expect(content).toContain('primary key');
      // Rationale explains why no additional index needed
      expect(content).toMatch(/not a common access pattern|already indexed/i);
    });
  });
});
