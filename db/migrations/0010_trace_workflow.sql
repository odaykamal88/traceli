BEGIN;

-- Abort rather than silently repairing historical cross-procurement links.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM requirements r JOIN source_versions v ON v.organization_id = r.organization_id AND v.id = r.source_version_id
    JOIN source_documents d ON d.organization_id = v.organization_id AND d.id = v.source_document_id
    WHERE r.procurement_id <> d.procurement_id
  ) OR EXISTS (
    SELECT 1 FROM findings f JOIN requirements r ON r.organization_id = f.organization_id AND r.id = f.requirement_id
    WHERE f.procurement_id <> r.procurement_id
  ) THEN RAISE EXCEPTION 'Trace migration preflight: inconsistent legacy procurement links'; END IF;
END $$;

ALTER TABLE source_versions ALTER COLUMN effective_at DROP NOT NULL;
ALTER TABLE source_versions ADD COLUMN effective_date_status text NOT NULL DEFAULT 'legacy_unverified'
  CHECK (effective_date_status IN ('legacy_unverified', 'unknown', 'verified'));
ALTER TABLE source_versions ADD COLUMN effective_date_basis text;
ALTER TABLE source_versions ADD COLUMN effective_date_unknown_reason text DEFAULT 'Legacy date has no retained verification basis.';
ALTER TABLE source_versions ADD COLUMN content_hash_kind text NOT NULL DEFAULT 'metadata_unverified'
  CHECK (content_hash_kind = 'metadata_unverified');
ALTER TABLE source_versions ADD CONSTRAINT source_versions_date_provenance CHECK ((
  (effective_date_status = 'verified' AND effective_at IS NOT NULL AND length(btrim(effective_date_basis)) > 0 AND effective_date_unknown_reason IS NULL)
  OR (effective_date_status = 'unknown' AND effective_at IS NULL AND length(btrim(effective_date_unknown_reason)) > 0)
  OR (effective_date_status = 'legacy_unverified' AND length(btrim(effective_date_unknown_reason)) > 0)
) IS TRUE);
ALTER TABLE source_versions ADD COLUMN procurement_id text;
UPDATE source_versions v SET procurement_id = d.procurement_id FROM source_documents d
 WHERE d.organization_id = v.organization_id AND d.id = v.source_document_id;
ALTER TABLE source_versions ALTER COLUMN procurement_id SET NOT NULL;
ALTER TABLE source_documents ADD CONSTRAINT source_documents_scope_unique UNIQUE (organization_id, procurement_id, id);
ALTER TABLE source_versions ADD CONSTRAINT source_versions_scope_unique UNIQUE (organization_id, procurement_id, id);
ALTER TABLE requirements ADD CONSTRAINT requirements_scope_unique UNIQUE (organization_id, procurement_id, id);
ALTER TABLE source_versions ADD CONSTRAINT source_versions_procurement_source_fk FOREIGN KEY (organization_id, procurement_id, source_document_id)
  REFERENCES source_documents (organization_id, procurement_id, id);
ALTER TABLE requirements ADD CONSTRAINT requirements_procurement_source_fk FOREIGN KEY (organization_id, procurement_id, source_version_id)
  REFERENCES source_versions (organization_id, procurement_id, id);
ALTER TABLE findings ADD CONSTRAINT findings_procurement_requirement_fk FOREIGN KEY (organization_id, procurement_id, requirement_id)
  REFERENCES requirements (organization_id, procurement_id, id);

-- Existing callers do not choose a procurement for versions; derive it from the source.
CREATE FUNCTION trace_legacy_version_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF TG_OP <> 'INSERT' AND OLD.locked_at IS NOT NULL THEN
    RAISE EXCEPTION 'Locked source versions are immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  IF NEW.procurement_id IS NULL THEN
    SELECT procurement_id INTO NEW.procurement_id FROM source_documents
      WHERE organization_id = NEW.organization_id AND id = NEW.source_document_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER source_versions_trace_guard BEFORE INSERT OR UPDATE OR DELETE ON source_versions
 FOR EACH ROW EXECUTE FUNCTION trace_legacy_version_guard();

CREATE TABLE trace_units (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  procurement_id text NOT NULL,
  previous_unit_id text,
  version integer NOT NULL CHECK (version > 0),
  artifact_hash text NOT NULL CHECK (artifact_hash ~ '^[0-9a-f]{64}$'),
  payload jsonb NOT NULL CHECK (octet_length(payload::text) <= 180000),
  actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, procurement_id, id),
  UNIQUE (organization_id, previous_unit_id),
  FOREIGN KEY (organization_id, procurement_id) REFERENCES procurements (organization_id, id),
  FOREIGN KEY (organization_id, procurement_id, previous_unit_id) REFERENCES trace_units (organization_id, procurement_id, id),
  CHECK (previous_unit_id IS DISTINCT FROM id),
  CHECK ((payload->>'id' = id AND payload->>'organizationId' = organization_id AND payload->>'procurementId' = procurement_id
    AND payload->>'artifactHash' = artifact_hash AND payload->>'createdBy' = actor_id AND (payload->>'version')::integer = version) IS TRUE),
  CHECK (payload ?& ARRAY['id','organizationId','procurementId','artifactHash','version','createdBy']),
  CHECK ((payload->>'previousUnitId') IS NOT DISTINCT FROM previous_unit_id)
);
CREATE INDEX trace_units_scope_created ON trace_units (organization_id, created_at DESC);

CREATE TABLE trace_human_decisions (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  procurement_id text NOT NULL,
  unit_id text NOT NULL,
  sequence integer NOT NULL CHECK (sequence > 0),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, procurement_id, id),
  UNIQUE (organization_id, unit_id, sequence),
  FOREIGN KEY (organization_id, procurement_id, unit_id) REFERENCES trace_units (organization_id, procurement_id, id),
  CHECK (payload ?& ARRAY['id','organizationId','procurementId','unitId','sequence']),
  CHECK ((payload->>'id' = id AND payload->>'organizationId' = organization_id AND payload->>'procurementId' = procurement_id
    AND payload->>'unitId' = unit_id AND (payload->>'sequence')::integer = sequence) IS TRUE)
);

CREATE TABLE trace_export_grants (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  procurement_id text NOT NULL,
  unit_id text NOT NULL,
  artifact_hash text NOT NULL CHECK (artifact_hash ~ '^[0-9a-f]{64}$'),
  decision_sequence integer NOT NULL CHECK (decision_sequence >= 0),
  recipient_id text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('redacted', 'full')),
  purpose text NOT NULL CHECK (length(purpose) BETWEEN 10 AND 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  UNIQUE (organization_id, procurement_id, id),
  UNIQUE (organization_id, procurement_id, unit_id, id),
  FOREIGN KEY (organization_id, procurement_id, unit_id) REFERENCES trace_units (organization_id, procurement_id, id),
  CHECK (expires_at > created_at AND expires_at <= created_at + interval '15 minutes')
);

CREATE TABLE trace_export_revocations (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  procurement_id text NOT NULL,
  grant_id text NOT NULL,
  actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, grant_id),
  FOREIGN KEY (organization_id, procurement_id, grant_id) REFERENCES trace_export_grants (organization_id, procurement_id, id)
);

CREATE TABLE trace_export_receipts (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  procurement_id text NOT NULL,
  unit_id text NOT NULL,
  grant_id text NOT NULL,
  recipient_id text NOT NULL,
  payload_hash text NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, procurement_id, unit_id, grant_id) REFERENCES trace_export_grants (organization_id, procurement_id, unit_id, id)
);

CREATE TABLE trace_commands (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  procurement_id text NOT NULL,
  actor_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('create_unit', 'human_decision', 'export_grant')),
  idempotency_key text NOT NULL,
  input_hash text NOT NULL CHECK (input_hash ~ '^[0-9a-f]{64}$'),
  response_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, action, idempotency_key),
  FOREIGN KEY (organization_id, procurement_id) REFERENCES procurements (organization_id, id)
);

CREATE FUNCTION trace_prevent_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  RAISE EXCEPTION 'Trace records are immutable; append a new version or event';
END $$;
DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['trace_units','trace_human_decisions','trace_export_grants','trace_export_revocations','trace_export_receipts','trace_commands'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (organization_id = traceli_current_organization_id()) WITH CHECK (organization_id = traceli_current_organization_id())', table_name);
    EXECUTE format('CREATE TRIGGER trace_no_mutation BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION trace_prevent_mutation()', table_name);
    EXECUTE format('GRANT SELECT, INSERT ON %I TO traceli_app', table_name);
  END LOOP;
END $$;
COMMIT;
