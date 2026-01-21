-- Create suggestions table for storing AI-generated suggestions (bullet rewrites, etc.)
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  section VARCHAR(50) NOT NULL, -- 'experience', 'education', 'projects', 'skills', 'format'
  item_index INTEGER, -- for ordering within section (e.g., job 0, job 1, bullet point 0)
  suggestion_type VARCHAR(50) NOT NULL, -- 'bullet_rewrite', 'skill_mapping', 'action_verb', 'quantification', 'skill_expansion', 'format', 'removal'
  original_text TEXT NOT NULL,
  suggested_text TEXT NOT NULL,
  reasoning TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_section CHECK (section IN ('experience', 'education', 'projects', 'skills', 'format')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected'))
);

-- RLS Policy: Users can see suggestions for their own scans
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own suggestions"
  ON suggestions FOR SELECT
  USING (
    scan_id IN (
      SELECT id FROM scans WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own suggestions"
  ON suggestions FOR INSERT
  WITH CHECK (
    scan_id IN (
      SELECT id FROM scans WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own suggestions"
  ON suggestions FOR UPDATE
  USING (
    scan_id IN (
      SELECT id FROM scans WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own suggestions"
  ON suggestions FOR DELETE
  USING (
    scan_id IN (
      SELECT id FROM scans WHERE user_id = auth.uid()
    )
  );

-- Index for performance
CREATE INDEX idx_suggestions_scan_id ON suggestions(scan_id);
CREATE INDEX idx_suggestions_section ON suggestions(section);
CREATE INDEX idx_suggestions_type ON suggestions(suggestion_type);
CREATE INDEX idx_suggestions_status ON suggestions(status);
