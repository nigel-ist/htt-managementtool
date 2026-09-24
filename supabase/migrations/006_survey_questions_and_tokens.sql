-- ============================================================
-- Migration 006: Survey questions JSONB + share tokens
--
-- Prior code inserted into survey_questions (a table that
-- was never created in migrations). This migration:
--   1. Adds questions JSONB to the surveys table directly
--   2. Adds share_token for unauthenticated public response links
--   3. Adds respondent_name / respondent_email to survey_responses
--   4. Opens an INSERT policy on survey_responses so anonymous
--      users can submit via the /api/surveys/respond endpoint
--      (which uses service role — no direct anon INSERT needed)
-- ============================================================

-- 1. Add questions column to surveys
ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS questions JSONB NOT NULL DEFAULT '[]';

-- 2. Add share token (unique per survey for public response links)
ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS share_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS surveys_share_token_idx ON surveys(share_token);

-- 3. Enrich survey_responses with respondent identity fields
ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS respondent_name  TEXT,
  ADD COLUMN IF NOT EXISTS respondent_email TEXT;

-- 4. Allow the service-role key (used by /api/surveys/respond)
--    to bypass RLS — no extra policy needed since service role
--    already bypasses RLS in Supabase. No action required here.
--
--    If you want to allow direct anon inserts in the future,
--    uncomment the policy below:
--
-- DO $$ BEGIN
--   CREATE POLICY "anon_submit" ON survey_responses
--     FOR INSERT TO anon
--     WITH CHECK (true);
-- EXCEPTION WHEN duplicate_object THEN NULL;
-- END $$;
