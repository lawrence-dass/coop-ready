-- Migration: Add separate job_title and company_name columns to sessions table
-- Purpose: Enable more reliable job metadata storage from LLM extraction
--
-- Current state:
-- - `title` column stores combined "Job Title - Company" (or just job title)
-- - Company extraction from content is unreliable (regex-based)
--
-- After migration:
-- - `job_title` stores the job position separately
-- - `company_name` stores the company separately
-- - `title` remains for backward compatibility (combined display)
--
-- Benefits:
-- - More reliable company detection via LLM extraction
-- - Flexible display options (combined or separate)
-- - Better data for analytics/filtering

-- Add separate columns for job metadata
ALTER TABLE sessions ADD COLUMN job_title VARCHAR(255);
ALTER TABLE sessions ADD COLUMN company_name VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN sessions.job_title IS 'Job position title extracted from job description. Used for display.';
COMMENT ON COLUMN sessions.company_name IS 'Company name extracted from job description. Used for display.';

-- Backfill job_title from existing title column
-- For titles with " - " separator: extract the first part as job_title
UPDATE sessions
SET job_title = SPLIT_PART(title, ' - ', 1)
WHERE title IS NOT NULL
  AND title LIKE '% - %'
  AND job_title IS NULL;

-- Backfill company_name from existing title column
-- For titles with " - " separator: extract the second part as company_name
UPDATE sessions
SET company_name = NULLIF(TRIM(SPLIT_PART(title, ' - ', 2)), '')
WHERE title IS NOT NULL
  AND title LIKE '% - %'
  AND company_name IS NULL;

-- For titles without " - " separator: use whole title as job_title
UPDATE sessions
SET job_title = title
WHERE title IS NOT NULL
  AND title NOT LIKE '% - %'
  AND job_title IS NULL;

-- Create index for potential filtering by company
CREATE INDEX idx_sessions_company_name ON sessions(company_name) WHERE company_name IS NOT NULL;
