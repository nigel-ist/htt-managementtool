-- ── 005: remaining content module tables ───────────────────────────────────
--
-- Creates tables for the nine content modules whose code exists but whose
-- schema was missing from earlier migrations:
--
--   • board_meetings       — BoD/committee meeting records
--   • ideas                — idea pipeline with status workflow
--   • market_intel         — market intelligence entries
--   • compensation_bands   — salary band definitions
--   • finance_entries      — P&L / financial snapshot entries
--   • surveys              — survey definitions
--   • survey_responses     — individual survey response rows
--   • competitors          — competitive landscape entries
--   • downloads            — file / resource library entries
--   • relationships        — stakeholder / partner / investor CRM
--
-- RLS uses helpers from migration 001:
--   jwt_tenant_id()  → (auth.jwt() ->> 'tenant_id')::uuid
--   is_il_admin()    → (auth.jwt() ->> 'is_il_admin') = 'true'
--   can_edit()       → jwt_role() IN ('owner', 'admin', 'editor')
-- ---------------------------------------------------------------------------


-- ── board_meetings ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS board_meetings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  meeting_type TEXT        NOT NULL DEFAULT 'board'
                           CHECK (meeting_type IN ('board', 'committee', 'advisory', 'agm')),
  meeting_date DATE        NOT NULL,
  location     TEXT,
  attendees    TEXT[]      NOT NULL DEFAULT '{}',
  agenda       TEXT,
  minutes      TEXT,
  action_items TEXT[]      NOT NULL DEFAULT '{}',
  created_by   UUID        REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER board_meetings_updated_at
    BEFORE UPDATE ON board_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE board_meetings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "tenant_isolation" ON board_meetings
    USING (tenant_id = jwt_tenant_id() OR is_il_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── ideas ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ideas (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  status       TEXT        NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'proposed', 'in_review', 'approved', 'rejected')),
  tags         TEXT[]      NOT NULL DEFAULT '{}',
  submitted_by UUID        REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER ideas_updated_at
    BEFORE UPDATE ON ideas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "tenant_isolation" ON ideas
    USING (tenant_id = jwt_tenant_id() OR is_il_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── market_intel ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS market_intel (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category     TEXT        NOT NULL
                           CHECK (category IN ('trend', 'regulatory', 'technology', 'competitive', 'customer', 'other')),
  title        TEXT        NOT NULL,
  source       TEXT,
  summary      TEXT,
  url          TEXT,
  tags         TEXT[]      NOT NULL DEFAULT '{}',
  created_by   UUID        REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER market_intel_updated_at
    BEFORE UPDATE ON market_intel
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE market_intel ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "tenant_isolation" ON market_intel
    USING (tenant_id = jwt_tenant_id() OR is_il_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── compensation_bands ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS compensation_bands (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_title       TEXT        NOT NULL,
  level            TEXT,
  department       TEXT,
  employment_type  TEXT        NOT NULL DEFAULT 'full_time'
                               CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'casual')),
  min_salary       NUMERIC(12,2) NOT NULL,
  max_salary       NUMERIC(12,2) NOT NULL,
  currency         TEXT        NOT NULL DEFAULT 'USD',
  location         TEXT,
  notes            TEXT,
  effective_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_by       UUID        REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER compensation_bands_updated_at
    BEFORE UPDATE ON compensation_bands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE compensation_bands ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "tenant_isolation" ON compensation_bands
    USING (tenant_id = jwt_tenant_id() OR is_il_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── finance_entries ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS finance_entries (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        TEXT          NOT NULL,
  category     TEXT          NOT NULL
                             CHECK (category IN ('revenue', 'expense', 'asset', 'liability', 'equity', 'other')),
  period       TEXT          NOT NULL,   -- e.g. "2025-Q1", "2025-06"
  amount       NUMERIC(14,2) NOT NULL,
  currency     TEXT          NOT NULL DEFAULT 'USD',
  entry_date   DATE          NOT NULL DEFAULT CURRENT_DATE,
  description  TEXT,
  tags         TEXT[]        NOT NULL DEFAULT '{}',
  created_by   UUID          REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER finance_entries_updated_at
    BEFORE UPDATE ON finance_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "tenant_isolation" ON finance_entries
    USING (tenant_id = jwt_tenant_id() OR is_il_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── surveys ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS surveys (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  status       TEXT        NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'active', 'closed')),
  created_by   UUID        REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER surveys_updated_at
    BEFORE UPDATE ON surveys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "tenant_isolation" ON surveys
    USING (tenant_id = jwt_tenant_id() OR is_il_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── survey_responses ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS survey_responses (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id     UUID        NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  respondent_id UUID        REFERENCES auth.users(id),
  data          JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS survey_responses_survey_idx ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS survey_responses_tenant_idx ON survey_responses(tenant_id);

ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "tenant_isolation" ON survey_responses
    USING (tenant_id = jwt_tenant_id() OR is_il_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── competitors ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS competitors (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  website      TEXT,
  tier         TEXT        NOT NULL DEFAULT 'indirect'
                           CHECK (tier IN ('direct', 'indirect', 'emerging', 'aspirational')),
  summary      TEXT,
  strengths    TEXT[]      NOT NULL DEFAULT '{}',
  weaknesses   TEXT[]      NOT NULL DEFAULT '{}',
  notes        TEXT,
  tags         TEXT[]      NOT NULL DEFAULT '{}',
  created_by   UUID        REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER competitors_updated_at
    BEFORE UPDATE ON competitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "tenant_isolation" ON competitors
    USING (tenant_id = jwt_tenant_id() OR is_il_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── downloads ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS downloads (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  category     TEXT        NOT NULL DEFAULT 'general',
  file_url     TEXT        NOT NULL,
  file_name    TEXT        NOT NULL DEFAULT '',
  tags         TEXT[]      NOT NULL DEFAULT '{}',
  created_by   UUID        REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER downloads_updated_at
    BEFORE UPDATE ON downloads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "tenant_isolation" ON downloads
    USING (tenant_id = jwt_tenant_id() OR is_il_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── relationships ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS relationships (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  organisation   TEXT,
  category       TEXT        NOT NULL DEFAULT 'other'
                             CHECK (category IN ('partner', 'investor', 'customer', 'supplier', 'advisor', 'government', 'other')),
  contact_email  TEXT,
  contact_phone  TEXT,
  notes          TEXT,
  tags           TEXT[]      NOT NULL DEFAULT '{}',
  created_by     UUID        REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER relationships_updated_at
    BEFORE UPDATE ON relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "tenant_isolation" ON relationships
    USING (tenant_id = jwt_tenant_id() OR is_il_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
