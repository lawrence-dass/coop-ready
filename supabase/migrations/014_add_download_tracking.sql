-- Migration: Add Download Tracking Columns
-- Story 6.4: Download UI & Format Selection - AC9
-- Description: Add columns to track resume downloads (timestamp, format, count)

-- Add download tracking columns to scans table
ALTER TABLE scans
  ADD COLUMN IF NOT EXISTS downloaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS download_format TEXT CHECK (download_format IN ('pdf', 'docx')),
  ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- Create index on downloaded_at for analytics queries
CREATE INDEX IF NOT EXISTS idx_scans_downloaded_at
  ON scans (downloaded_at)
  WHERE downloaded_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN scans.downloaded_at IS 'Timestamp of last resume download';
COMMENT ON COLUMN scans.download_format IS 'Format of last download: pdf or docx';
COMMENT ON COLUMN scans.download_count IS 'Total number of times resume was downloaded';
