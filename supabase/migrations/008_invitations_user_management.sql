-- ============================================================
-- Migration 008: Invitations & User Management
-- Adds status/join tracking to tenant_members, adds invite codes
-- ============================================================

-- ── 1. Add columns to tenant_members ─────────────────────────────────────────

ALTER TABLE tenant_members
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending_validation', 'suspended')),
  ADD COLUMN IF NOT EXISTS joined_via TEXT NOT NULL DEFAULT 'invitation'
    CHECK (joined_via IN ('invitation', 'code', 'direct')),
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Index for fast pending-validation lookups per tenant
CREATE INDEX IF NOT EXISTS idx_tenant_members_status
  ON tenant_members (tenant_id, status);

-- ── 2. Create tenant_invite_codes table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_invite_codes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code            TEXT        NOT NULL UNIQUE,
  default_role    TEXT        NOT NULL DEFAULT 'viewer'
                    CHECK (default_role IN ('owner', 'admin', 'editor', 'viewer')),
  requires_validation BOOLEAN NOT NULL DEFAULT TRUE,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  uses_count      INTEGER     NOT NULL DEFAULT 0,
  max_uses        INTEGER,
  expires_at      TIMESTAMPTZ,
  created_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_invite_codes_tenant
  ON tenant_invite_codes (tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_invite_codes_code
  ON tenant_invite_codes (code) WHERE is_active = TRUE;

-- ── 3. RLS for tenant_invite_codes ───────────────────────────────────────────

ALTER TABLE tenant_invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service client manages invite codes"
  ON tenant_invite_codes
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Admins read own tenant codes"
  ON tenant_invite_codes
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
        AND is_active = TRUE
    )
  );

-- ── 4. Update invitations table: add full_name ────────────────────────────────

ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS full_name TEXT;
