-- Migration: Add text extraction columns to resumes table
-- Story: 3.2 Resume Text Extraction
-- Created: 2026-01-20

-- Add extraction columns
ALTER TABLE resumes
ADD COLUMN extracted_text TEXT,
ADD COLUMN extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'completed', 'failed')),
ADD COLUMN extraction_error TEXT;

-- Add index for querying pending extractions
CREATE INDEX idx_resumes_extraction_status ON resumes(extraction_status);

-- Add comment for documentation
COMMENT ON COLUMN resumes.extracted_text IS 'Raw text content extracted from PDF/DOCX file';
COMMENT ON COLUMN resumes.extraction_status IS 'Status of text extraction: pending, completed, or failed';
COMMENT ON COLUMN resumes.extraction_error IS 'Error message if extraction failed';
