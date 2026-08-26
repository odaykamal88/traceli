BEGIN;

CREATE TABLE IF NOT EXISTS organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS procurements (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  reference text NOT NULL,
  title text NOT NULL,
  region text NOT NULL,
  status text NOT NULL,
  evidence_coverage integer NOT NULL DEFAULT 0 CHECK (evidence_coverage BETWEEN 0 AND 100),
  blocker_summary text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, reference)
);

CREATE INDEX IF NOT EXISTS procurements_org_updated_idx
  ON procurements (organization_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS source_documents (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  procurement_id text NOT NULL,
  name text NOT NULL,
  kind text NOT NULL,
  access_boundary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  CONSTRAINT source_documents_procurement_tenant_fk
    FOREIGN KEY (organization_id, procurement_id)
    REFERENCES procurements (organization_id, id)
);

CREATE INDEX IF NOT EXISTS source_documents_procurement_idx
  ON source_documents (organization_id, procurement_id);

CREATE TABLE IF NOT EXISTS source_versions (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  source_document_id text NOT NULL,
  version_label text NOT NULL,
  content_hash text NOT NULL,
  effective_at timestamptz NOT NULL,
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  CONSTRAINT source_versions_source_tenant_fk
    FOREIGN KEY (organization_id, source_document_id)
    REFERENCES source_documents (organization_id, id)
);

CREATE INDEX IF NOT EXISTS source_versions_source_idx
  ON source_versions (organization_id, source_document_id);

CREATE TABLE IF NOT EXISTS requirements (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  procurement_id text NOT NULL,
  source_version_id text NOT NULL,
  code text NOT NULL,
  title text NOT NULL,
  source_anchor text NOT NULL,
  state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, procurement_id, code),
  CONSTRAINT requirements_procurement_tenant_fk
    FOREIGN KEY (organization_id, procurement_id)
    REFERENCES procurements (organization_id, id),
  CONSTRAINT requirements_source_version_tenant_fk
    FOREIGN KEY (organization_id, source_version_id)
    REFERENCES source_versions (organization_id, id)
);

CREATE TABLE IF NOT EXISTS findings (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  procurement_id text NOT NULL,
  requirement_id text NOT NULL,
  supplier_name text NOT NULL,
  status text NOT NULL,
  human_determination text,
  reviewer_id text,
  reviewer_name text,
  reviewed_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  CONSTRAINT findings_procurement_tenant_fk
    FOREIGN KEY (organization_id, procurement_id)
    REFERENCES procurements (organization_id, id),
  CONSTRAINT findings_requirement_tenant_fk
    FOREIGN KEY (organization_id, requirement_id)
    REFERENCES requirements (organization_id, id)
);

CREATE INDEX IF NOT EXISTS findings_procurement_status_idx
  ON findings (organization_id, procurement_id, status);

CREATE TABLE IF NOT EXISTS decisions (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  procurement_id text NOT NULL,
  state text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  locked_at timestamptz,
  root_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, procurement_id),
  CONSTRAINT decisions_procurement_tenant_fk
    FOREIGN KEY (organization_id, procurement_id)
    REFERENCES procurements (organization_id, id)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  procurement_id text NOT NULL,
  sequence integer NOT NULL CHECK (sequence > 0),
  event_type text NOT NULL,
  actor_id text NOT NULL,
  actor_name text NOT NULL,
  source_label text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  previous_hash text,
  event_hash text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, procurement_id, sequence),
  CONSTRAINT audit_events_procurement_tenant_fk
    FOREIGN KEY (organization_id, procurement_id)
    REFERENCES procurements (organization_id, id)
);

CREATE INDEX IF NOT EXISTS audit_events_org_occurred_idx
  ON audit_events (organization_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS outbox_events (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE INDEX IF NOT EXISTS outbox_events_unpublished_idx
  ON outbox_events (organization_id, published_at)
  WHERE published_at IS NULL;

CREATE OR REPLACE FUNCTION traceli_current_organization_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('app.organization_id', true), '')
$$;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organizations_tenant_isolation ON organizations;
CREATE POLICY organizations_tenant_isolation ON organizations
  USING (id = traceli_current_organization_id())
  WITH CHECK (id = traceli_current_organization_id());

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'procurements',
    'source_documents',
    'source_versions',
    'requirements',
    'findings',
    'decisions',
    'audit_events',
    'outbox_events'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', table_name);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (organization_id = traceli_current_organization_id()) WITH CHECK (organization_id = traceli_current_organization_id())',
      table_name
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_events are append-only';
END;
$$;

DROP TRIGGER IF EXISTS audit_events_no_update ON audit_events;
CREATE TRIGGER audit_events_no_update
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_event_mutation();

COMMIT;
