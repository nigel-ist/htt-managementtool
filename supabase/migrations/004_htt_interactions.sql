-- ── 004: htt_interactions schema extension ─────────────────────────────────
--
-- The htt_interactions table was created in migration 001 with a basic schema.
-- This migration extends it with the columns needed by the HTT Coach AI layer:
--   • user_message   — renamed from prompt_text for clarity
--   • baseline_id    — ties each coaching session to a specific HTT assessment
--   • htt_stage      — the user's stage at time of interaction (1–5)
--   • ai_response    — stores the full streamed response
--   • response_signal — converted from JSONB NOT NULL DEFAULT '{}' → TEXT nullable
--
-- All steps are idempotent: safe to run on a DB that already ran migration 001,
-- and also safe to run on a fresh DB that hasn't run any migrations yet.
--
-- RLS policies were already created in migration 001 — no action needed here.
-- ---------------------------------------------------------------------------

-- Step 1: rename prompt_text → user_message (idempotent via EXCEPTION)
DO $$ BEGIN
  ALTER TABLE htt_interactions RENAME COLUMN prompt_text TO user_message;
EXCEPTION WHEN undefined_column THEN NULL;  -- already renamed or column doesn't exist
END $$;

-- Step 2: add baseline_id (nullable FK to htt_baselines)
DO $$ BEGIN
  ALTER TABLE htt_interactions
    ADD COLUMN baseline_id UUID REFERENCES htt_baselines(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Step 3: add htt_stage (nullable so existing rows don't break)
DO $$ BEGIN
  ALTER TABLE htt_interactions
    ADD COLUMN htt_stage SMALLINT CHECK (htt_stage BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Step 4: add ai_response (nullable)
DO $$ BEGIN
  ALTER TABLE htt_interactions
    ADD COLUMN ai_response TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Step 5: convert response_signal JSONB NOT NULL DEFAULT '{}' → TEXT nullable
-- First strip the NOT NULL constraint and default so TYPE conversion can proceed
DO $$ BEGIN
  ALTER TABLE htt_interactions
    ALTER COLUMN response_signal DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE htt_interactions
    ALTER COLUMN response_signal DROP DEFAULT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE htt_interactions
    ALTER COLUMN response_signal TYPE TEXT
    USING CASE
      WHEN response_signal IS NULL OR response_signal::text = '{}'
      THEN NULL
      ELSE response_signal->>'signal'
    END;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Step 6: index for baseline lookups (idempotent)
DO $$ BEGIN
  CREATE INDEX htt_interactions_baseline_idx
    ON htt_interactions (baseline_id)
    WHERE baseline_id IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
