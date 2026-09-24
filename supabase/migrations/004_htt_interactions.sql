-- ── 004: htt_interactions ────────────────────────────────────────────────────
--
-- Logs every HTT AI interaction so the platform can:
--   • track which module contexts trigger coach usage
--   • tune stage-aware prompting over time
--   • show users their coaching history
--
-- RLS uses helper functions from 001:
--   jwt_tenant_id()  → (auth.jwt() ->> 'tenant_id')::uuid
--   is_il_admin()    → (auth.jwt() ->> 'is_il_admin') = 'true'
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS htt_interactions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baseline_id      UUID        REFERENCES htt_baselines(id) ON DELETE SET NULL,
  module_context   TEXT        NOT NULL DEFAULT 'htt',
    -- which module triggered this: 'htt', 'products', 'innovations', 'staff', etc.
  prompt_type      TEXT        NOT NULL DEFAULT 'coach',
    -- 'coach' | 'embedded' | 'reflection'
  capability_focus TEXT,
    -- one of the 6 HTT capabilities, if interaction was capability-specific
  htt_stage        SMALLINT    NOT NULL CHECK (htt_stage BETWEEN 1 AND 5),
  user_message     TEXT        NOT NULL,
  ai_response      TEXT        NOT NULL,
  response_signal  TEXT,
    -- 'helpful' | 'not_helpful' | 'skipped' — filled in by user feedback
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE INDEX htt_interactions_tenant_user
    ON htt_interactions (tenant_id, user_id, created_at DESC);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE htt_interactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "tenant_isolation" ON htt_interactions
    USING (
      tenant_id = jwt_tenant_id()
      OR is_il_admin()
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
