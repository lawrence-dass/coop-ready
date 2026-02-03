-- Add default resume functionality
-- Epic 9: Save Resume After Extraction + Settings Page + Default Resume
-- Phase 1.1: Database schema changes

-- Add is_default column to user_resumes table
ALTER TABLE user_resumes
ADD COLUMN is_default BOOLEAN DEFAULT FALSE;

-- Ensure only one default resume per user (partial unique index)
-- This constraint allows multiple FALSE values but only one TRUE value per user
CREATE UNIQUE INDEX unique_default_resume_per_user
ON user_resumes (user_id)
WHERE is_default = TRUE;

-- Function to automatically set the first resume as default
CREATE OR REPLACE FUNCTION set_first_resume_as_default()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is the user's first resume, make it default
  IF (SELECT COUNT(*) FROM user_resumes WHERE user_id = NEW.user_id) = 0 THEN
    NEW.is_default := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger fires before insert to check if this is the first resume
CREATE TRIGGER auto_default_first_resume
BEFORE INSERT ON user_resumes
FOR EACH ROW
EXECUTE FUNCTION set_first_resume_as_default();

-- Add column comment for documentation
COMMENT ON COLUMN user_resumes.is_default IS 'Marks the default/master resume. Only one per user allowed via unique partial index. First saved resume auto-becomes default via trigger.';

-- Add index comment for documentation
COMMENT ON INDEX unique_default_resume_per_user IS 'Ensures only one default resume per user. Allows multiple FALSE but only one TRUE per user_id.';
