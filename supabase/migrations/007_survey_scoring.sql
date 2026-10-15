-- Migration 007: Survey scoring support
-- Adds survey_type and scoring_config to surveys table

ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS survey_type TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS scoring_config JSONB;

-- Index for type-based queries
CREATE INDEX IF NOT EXISTS surveys_type_idx ON surveys (survey_type);

COMMENT ON COLUMN surveys.survey_type IS 'standard | industry_assessment';
COMMENT ON COLUMN surveys.scoring_config IS 'JSON scoring configuration with subscales, bands, and composite weights';
