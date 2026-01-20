-- Migration: Add section parsing columns to resumes table
-- Story: 3.3 Resume Section Parsing
-- Created: 2026-01-20

-- Add parsing columns
ALTER TABLE resumes
ADD COLUMN parsed_sections JSONB,
ADD COLUMN parsing_status TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'completed', 'failed')),
ADD COLUMN parsing_error TEXT;

-- Add index for querying pending parses
CREATE INDEX idx_resumes_parsing_status ON resumes(parsing_status);

-- Add composite index for efficient querying of resumes needing parsing
-- (extraction completed but parsing pending)
CREATE INDEX idx_resumes_extraction_parsing_status ON resumes(extraction_status, parsing_status);

-- Add comments for documentation
COMMENT ON COLUMN resumes.parsed_sections IS 'Structured resume sections parsed from extracted text (JSON format)';
COMMENT ON COLUMN resumes.parsing_status IS 'Status of section parsing: pending, completed, or failed';
COMMENT ON COLUMN resumes.parsing_error IS 'Error message if parsing failed';
