-- Migration: Add privacy_report column to sessions table
-- PII Redaction Implementation - Privacy Badge Feature
-- Date: 2026-02-02

-- Add privacy_report column to store PII redaction statistics
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS privacy_report JSONB;

-- Add GIN index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_sessions_privacy_report
ON sessions USING GIN (privacy_report);

-- Add comment for documentation
COMMENT ON COLUMN sessions.privacy_report IS 'Stores PII redaction statistics showing what sensitive information (emails, phones, addresses, URLs) was redacted before sending to LLM for analysis. Used to build user trust through transparency.';
