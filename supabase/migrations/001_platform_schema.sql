-- ============================================================
-- TIL Platform — Migration 001: Platform Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- Or via CLI: supabase db push
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Updated-at trigger function ─────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PLATFORM TABLES (owned by IL — no tenant_id)
-- ============================================================

-- ── tenants ─────────────────────────────────────────────────
CREATE TABLE tenants (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        NOT NULL UNIQUE,         -- e.g. "brinkman"
  name            TEXT        NOT NULL,                -- Legal name
  display_name    TEXT        NOT NULL,                -- UI display name
  tier            TEXT        NOT NULL DEFAULT 'standard'
                              CHECK (tier IN ('standard', 'professional', 'enterprise')),
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  settings        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── tenant_branding ─────────────────────────────────────────
CREATE TABLE tenant_branding (
  tenant_id       UUID        PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url        TEXT,
  favicon_url     TEXT,
  primary_color   TEXT        NOT NULL DEFAULT '#5B6EFF',
  secondary_color TEXT        NOT NULL DEFAULT '#A855F7',
  accent_color    TEXT        NOT NULL DEFAULT '#059669',
  font_heading    TEXT        NOT NULL DEFAULT 'DM Serif Display',
  font_body       TEXT        NOT NULL DEFAULT 'IBM Plex Sans',
  tagline         TEXT,
  custom_domain   TEXT        UNIQUE,
  custom_css      TEXT,       -- IL-only escape hatch
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tenant_branding_updated_at
  BEFORE UPDATE ON tenant_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── tenant_modules ──────────────────────────────────────────
CREATE TABLE tenant_modules (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_key      TEXT        NOT NULL,
  is_enabled      BOOLEAN     NOT NULL DEFAULT FALSE,
  config          JSONB       NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, module_key)
);

CREATE TRIGGER tenant_modules_updated_at
  BEFORE UPDATE ON tenant_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── tenant_members ──────────────────────────────────────────
CREATE TABLE tenant_members (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL DEFAULT 'viewer'
                              CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  invited_by      UUID        REFERENCES auth.users(id),
  invited_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at  TIMESTAMPTZ,
  UNIQUE (tenant_id, user_id)
);

-- ── il_admins ────────────────────────────────────────────────
-- Users in this table have cross-tenant visibility.
-- is_il_admin = true is injected into their JWT by the claims hook.
CREATE TABLE il_admins (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  il_role         TEXT        NOT NULL DEFAULT 'admin'
                              CHECK (il_role IN ('super_admin', 'admin', 'support')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID        REFERENCES auth.users(id)
);

-- ── invitations ──────────────────────────────────────────────
CREATE TABLE invitations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email           TEXT        NOT NULL,
  role            TEXT        NOT NULL DEFAULT 'viewer'
                              CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  token           TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by      UUID        REFERENCES auth.users(id),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── audit_log ────────────────────────────────────────────────
CREATE TABLE audit_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        REFERENCES tenants(id) ON DELETE SET NULL,
  actor_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_is_il     BOOLEAN     NOT NULL DEFAULT FALSE,
  impersonating   UUID        REFERENCES auth.users(id), -- set when IL admin impersonates
  action          TEXT        NOT NULL,
  resource_type   TEXT        NOT NULL,
  resource_id     UUID,
  metadata        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_log_tenant_id_idx ON audit_log(tenant_id);
CREATE INDEX audit_log_actor_id_idx  ON audit_log(actor_id);
CREATE INDEX audit_log_created_at_idx ON audit_log(created_at DESC);

-- ============================================================
-- DOMAIN TABLES (all carry tenant_id + RLS)
-- ============================================================

-- ── products ─────────────────────────────────────────────────
CREATE TABLE products (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type            TEXT        NOT NULL
                              CHECK (type IN ('current', 'proposed', 'launch', 'strategic_growth', 'shelved')),
  name            TEXT        NOT NULL,
  description     TEXT,
  data            JSONB       NOT NULL DEFAULT '{}',
  display_order   INTEGER     NOT NULL DEFAULT 0,
  created_by      UUID        REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX products_tenant_id_idx ON products(tenant_id);
CREATE INDEX products_type_idx      ON products(tenant_id, type);

-- ── innovations ──────────────────────────────────────────────
CREATE TABLE innovations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  stage           TEXT        NOT NULL DEFAULT 'idea'
                              CHECK (stage IN ('idea', 'explore', 'develop', 'pilot', 'scale', 'shelved')),
  data            JSONB       NOT NULL DEFAULT '{}',
  created_by      UUID        REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER innovations_updated_at
  BEFORE UPDATE ON innovations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX innovations_tenant_id_idx ON innovations(tenant_id);

-- ── staff_skills ─────────────────────────────────────────────
CREATE TABLE staff_skills (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  department      TEXT,
  role_title      TEXT,
  skills          JSONB       NOT NULL DEFAULT '[]', -- [{name, level, category}]
  data            JSONB       NOT NULL DEFAULT '{}',
  created_by      UUID        REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER staff_skills_updated_at
  BEFORE UPDATE ON staff_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX staff_skills_tenant_id_idx ON staff_skills(tenant_id);

-- ============================================================
-- HTT TABLES
-- ============================================================

-- ── htt_baselines ────────────────────────────────────────────
CREATE TABLE htt_baselines (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage           SMALLINT    NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 5),
  scores          JSONB       NOT NULL DEFAULT '{}',
  -- Expected shape: {
  --   critical_thinking: 1-5,
  --   mental_models: 1-5,
  --   perspective_taking: 1-5,
  --   adaptability: 1-5,
  --   independence: 1-5,
  --   creativity: 1-5
  -- }
  source          TEXT        NOT NULL DEFAULT 'diagnostic'
                              CHECK (source IN ('diagnostic', 'seminar', 'coach_inferred')),
  notes           TEXT,
  assessed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX htt_baselines_tenant_user_idx ON htt_baselines(tenant_id, user_id);
CREATE INDEX htt_baselines_assessed_at_idx ON htt_baselines(assessed_at DESC);

-- ── htt_interactions ────────────────────────────────────────
CREATE TABLE htt_interactions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_context  TEXT,
  prompt_type     TEXT        NOT NULL DEFAULT 'embedded'
                              CHECK (prompt_type IN ('orienting', 'embedded', 'coach', 'diagnostic')),
  capability_focus TEXT,
  prompt_text     TEXT,
  response_signal JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX htt_interactions_tenant_user_idx ON htt_interactions(tenant_id, user_id);
CREATE INDEX htt_interactions_created_at_idx  ON htt_interactions(created_at DESC);

-- ── htt_benchmarks ──────────────────────────────────────────
-- Populated by aggregation Edge Function — never tenant-identifiable
CREATE TABLE htt_benchmarks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort          TEXT        NOT NULL,   -- "industry:forestry", "size:smb", etc.
  period          TEXT        NOT NULL,   -- "2025-Q4"
  capability      TEXT        NOT NULL,
  p25             NUMERIC(4,2),
  p50             NUMERIC(4,2),
  p75             NUMERIC(4,2),
  n_orgs          SMALLINT    NOT NULL DEFAULT 0,
  published       BOOLEAN     NOT NULL DEFAULT FALSE, -- only publish when n_orgs >= 10
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cohort, period, capability)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper: get tenant_id from JWT custom claim
CREATE OR REPLACE FUNCTION jwt_tenant_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')::UUID;
$$ LANGUAGE SQL STABLE;

-- Helper: get role from JWT custom claim
CREATE OR REPLACE FUNCTION jwt_role() RETURNS TEXT AS $$
  SELECT current_setting('request.jwt.claims', true)::json->>'role';
$$ LANGUAGE SQL STABLE;

-- Helper: is IL admin?
CREATE OR REPLACE FUNCTION is_il_admin() RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'is_il_admin')::BOOLEAN,
    FALSE
  );
$$ LANGUAGE SQL STABLE;

-- Helper: is editor or above?
CREATE OR REPLACE FUNCTION can_edit() RETURNS BOOLEAN AS $$
  SELECT jwt_role() IN ('owner', 'admin', 'editor') OR is_il_admin();
$$ LANGUAGE SQL STABLE;

-- ── tenants RLS ─────────────────────────────────────────────
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "il_admins_see_all_tenants" ON tenants
  FOR ALL USING (is_il_admin());

CREATE POLICY "members_see_own_tenant" ON tenants
  FOR SELECT USING (id = jwt_tenant_id());

-- ── tenant_branding RLS ──────────────────────────────────────
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;

-- Anyone in the tenant can read branding (needed for page load)
CREATE POLICY "members_read_own_branding" ON tenant_branding
  FOR SELECT USING (tenant_id = jwt_tenant_id() OR is_il_admin());

-- Only IL admins can write branding
CREATE POLICY "il_admins_write_branding" ON tenant_branding
  FOR ALL USING (is_il_admin());

-- ── tenant_modules RLS ──────────────────────────────────────
ALTER TABLE tenant_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_own_modules" ON tenant_modules
  FOR SELECT USING (tenant_id = jwt_tenant_id() OR is_il_admin());

CREATE POLICY "il_admins_write_modules" ON tenant_modules
  FOR ALL USING (is_il_admin());

-- ── tenant_members RLS ──────────────────────────────────────
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_own_tenant_members" ON tenant_members
  FOR SELECT USING (tenant_id = jwt_tenant_id() OR is_il_admin());

CREATE POLICY "admins_write_members" ON tenant_members
  FOR ALL USING (
    (tenant_id = jwt_tenant_id() AND jwt_role() IN ('owner', 'admin'))
    OR is_il_admin()
  );

-- ── il_admins RLS ────────────────────────────────────────────
ALTER TABLE il_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "il_admins_only" ON il_admins
  FOR ALL USING (is_il_admin());

-- ── invitations RLS ──────────────────────────────────────────
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_invitations" ON invitations
  FOR ALL USING (
    (tenant_id = jwt_tenant_id() AND jwt_role() IN ('owner', 'admin'))
    OR is_il_admin()
  );

-- ── audit_log RLS ────────────────────────────────────────────
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_own_audit_log" ON audit_log
  FOR SELECT USING (tenant_id = jwt_tenant_id() OR is_il_admin());

-- Audit log is append-only for service role (Edge Functions)
-- No direct insert/update/delete for regular users

-- ── products RLS ────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_products" ON products
  FOR SELECT USING (tenant_id = jwt_tenant_id() OR is_il_admin());

CREATE POLICY "editors_write_products" ON products
  FOR ALL USING (tenant_id = jwt_tenant_id() AND can_edit() OR is_il_admin());

-- ── innovations RLS ─────────────────────────────────────────
ALTER TABLE innovations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_innovations" ON innovations
  FOR SELECT USING (tenant_id = jwt_tenant_id() OR is_il_admin());

CREATE POLICY "editors_write_innovations" ON innovations
  FOR ALL USING (tenant_id = jwt_tenant_id() AND can_edit() OR is_il_admin());

-- ── staff_skills RLS ────────────────────────────────────────
ALTER TABLE staff_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_staff_skills" ON staff_skills
  FOR SELECT USING (tenant_id = jwt_tenant_id() OR is_il_admin());

CREATE POLICY "editors_write_staff_skills" ON staff_skills
  FOR ALL USING (tenant_id = jwt_tenant_id() AND can_edit() OR is_il_admin());

-- ── htt_baselines RLS ───────────────────────────────────────
ALTER TABLE htt_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_own_htt_baselines" ON htt_baselines
  FOR SELECT USING (tenant_id = jwt_tenant_id() OR is_il_admin());

-- Users can only write their own baselines
CREATE POLICY "users_write_own_baselines" ON htt_baselines
  FOR INSERT WITH CHECK (
    tenant_id = jwt_tenant_id()
    AND user_id = auth.uid()
  );

-- ── htt_interactions RLS ────────────────────────────────────
ALTER TABLE htt_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_own_htt_interactions" ON htt_interactions
  FOR SELECT USING (tenant_id = jwt_tenant_id() OR is_il_admin());

CREATE POLICY "users_write_own_interactions" ON htt_interactions
  FOR INSERT WITH CHECK (
    tenant_id = jwt_tenant_id()
    AND user_id = auth.uid()
  );

-- ── htt_benchmarks RLS ──────────────────────────────────────
ALTER TABLE htt_benchmarks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read published benchmarks
CREATE POLICY "authenticated_read_benchmarks" ON htt_benchmarks
  FOR SELECT USING (published = TRUE OR is_il_admin());

-- Only service role can write benchmarks (via Edge Function)

-- ============================================================
-- SEED DATA: IL Admin tenant + default modules
-- ============================================================

-- Insert The Innovation Lab as the first "tenant" (for admin portal context)
INSERT INTO tenants (slug, name, display_name, tier)
VALUES ('il', 'The Innovation Lab', 'The Innovation Lab', 'enterprise')
ON CONFLICT (slug) DO NOTHING;

-- Default module definitions (all disabled — IL enables per tenant)
-- Run after inserting a new tenant:
-- INSERT INTO tenant_modules (tenant_id, module_key, is_enabled)
-- SELECT id, module_key, FALSE FROM tenants CROSS JOIN (
--   VALUES
--     ('products'), ('current_state'), ('future_state'),
--     ('innovations'), ('ideas'), ('market_intel'),
--     ('competition'), ('structure'), ('staff_skills'),
--     ('compensation'), ('finance'), ('collaboration'),
--     ('surveys'), ('bod_management'), ('relationship_network'),
--     ('downloads'), ('htt')
-- ) AS m(module_key)
-- WHERE slug = 'your-tenant-slug';

-- ============================================================
-- NOTES FOR SETUP
-- ============================================================
-- 1. After running this migration, register the custom-claims
--    Edge Function as an auth hook in:
--    Supabase Dashboard → Auth → Hooks → Custom Access Token Hook
--    Point it to: supabase/functions/custom-claims
--
-- 2. To create your first IL admin:
--    a. Sign up normally through the app
--    b. Run in SQL Editor:
--       INSERT INTO il_admins (user_id, il_role)
--       VALUES ('<your-auth-user-uuid>', 'super_admin');
--
-- 3. To create your first tenant (Brinkman):
--    INSERT INTO tenants (slug, name, display_name, tier)
--    VALUES ('brinkman', 'Brinkman & Associates', 'Brinkman', 'professional');
--    -- Then insert default modules and branding for that tenant_id
