-- ── 002: per-role and per-user module access ──────────────────────────────
--
-- Two-layer permission model:
--   Layer 1 (tenant_module_roles)         — minimum role required to see a module.
--                                           Default when no row exists: 'viewer' (everyone).
--   Layer 2 (tenant_module_user_overrides) — explicit grant OR deny for a specific user.
--                                           Takes precedence over layer 1.
--
-- Resolution order (server-side, getAccessibleModules()):
--   1. Is the module enabled for this tenant?  (tenant_modules.is_enabled)
--   2. Does the user have a row in user_overrides?  → use can_access (true/false)
--   3. Else: is the user's role >= min_role in tenant_module_roles?
--      (If no row exists: min_role defaults to 'viewer' — everyone sees it)
-- ---------------------------------------------------------------------------

-- ── tenant_module_roles ─────────────────────────────────────────────────────
CREATE TABLE tenant_module_roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_key  TEXT        NOT NULL,
  min_role    TEXT        NOT NULL DEFAULT 'viewer'
              CHECK (min_role IN ('owner', 'admin', 'editor', 'viewer')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, module_key)
);

CREATE TRIGGER tenant_module_roles_updated_at
  BEFORE UPDATE ON tenant_module_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE tenant_module_roles ENABLE ROW LEVEL SECURITY;

-- Any member can read their own tenant's role config (needed to gate pages server-side)
CREATE POLICY "members_read_module_roles" ON tenant_module_roles
  FOR SELECT USING (tenant_id = jwt_tenant_id() OR is_il_admin());

-- Only tenant admins/owners and IL admins can write
CREATE POLICY "admins_write_module_roles" ON tenant_module_roles
  FOR ALL USING (
    (tenant_id = jwt_tenant_id() AND jwt_role() IN ('admin', 'owner'))
    OR is_il_admin()
  );


-- ── tenant_module_user_overrides ─────────────────────────────────────────────
CREATE TABLE tenant_module_user_overrides (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key  TEXT        NOT NULL,
  can_access  BOOLEAN     NOT NULL,  -- true = granted, false = denied
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, module_key)
);

CREATE TRIGGER tenant_module_user_overrides_updated_at
  BEFORE UPDATE ON tenant_module_user_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE tenant_module_user_overrides ENABLE ROW LEVEL SECURITY;

-- Members can read overrides that apply to themselves; admins/owners see all
CREATE POLICY "members_read_own_overrides" ON tenant_module_user_overrides
  FOR SELECT USING (
    tenant_id = jwt_tenant_id()
    AND (
      user_id = auth.uid()
      OR jwt_role() IN ('admin', 'owner')
    )
    OR is_il_admin()
  );

-- Only tenant admins/owners and IL admins can write overrides
CREATE POLICY "admins_write_user_overrides" ON tenant_module_user_overrides
  FOR ALL USING (
    (tenant_id = jwt_tenant_id() AND jwt_role() IN ('admin', 'owner'))
    OR is_il_admin()
  );
