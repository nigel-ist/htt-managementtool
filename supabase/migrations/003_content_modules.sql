-- ── 003: content module tables ────────────────────────────────────────────────
--
-- Tables for three modules whose code is complete but whose schema was
-- not included in 001_platform_schema.sql:
--   • current_state_scores  — 1-5 scoring across 15 dimensions (3 categories)
--   • future_state          — one row per tenant: vision + strategic goals (JSONB)
--   • roles                 — org structure roles with RACI (JSONB array)
--
-- RLS uses the same helper functions established in 001:
--   jwt_tenant_id()  → (auth.jwt() ->> 'tenant_id')::uuid
--   is_il_admin()    → (auth.jwt() ->> 'is_il_admin') = 'true'
-- ---------------------------------------------------------------------------


-- ── current_state_scores ─────────────────────────────────────────────────────

CREATE TABLE current_state_scores (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category    TEXT        NOT NULL,   -- strategic | operational | financial
  dimension   TEXT        NOT NULL,
  score       SMALLINT    NOT NULL CHECK (score BETWEEN 1 AND 5),
  notes       TEXT,
  updated_by  UUID        REFERENCES auth.users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, category, dimension)
);

CREATE TRIGGER current_state_scores_updated_at
  BEFORE UPDATE ON current_state_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE current_state_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON current_state_scores
  USING (
    tenant_id = jwt_tenant_id()
    OR is_il_admin()
  );


-- ── future_state ──────────────────────────────────────────────────────────────

CREATE TABLE future_state (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  vision          TEXT,
  strategic_goals JSONB       NOT NULL DEFAULT '[]',
  ai_narrative    TEXT,
  updated_by      UUID        REFERENCES auth.users(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER future_state_updated_at
  BEFORE UPDATE ON future_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE future_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON future_state
  USING (
    tenant_id = jwt_tenant_id()
    OR is_il_admin()
  );


-- ── roles ─────────────────────────────────────────────────────────────────────

CREATE TABLE roles (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title             TEXT        NOT NULL,
  department        TEXT,
  level             TEXT,       -- Junior | Mid | Senior | Lead | Principal | Executive
  responsibilities  TEXT,
  raci              JSONB       NOT NULL DEFAULT '[]',
  headcount         SMALLINT    NOT NULL DEFAULT 1,
  is_open           BOOLEAN     NOT NULL DEFAULT false,
  created_by        UUID        REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON roles
  USING (
    tenant_id = jwt_tenant_id()
    OR is_il_admin()
  );
