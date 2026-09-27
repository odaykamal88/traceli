BEGIN;

-- New tables only. No existing case, source version or v1 freeze is rewritten.
CREATE TABLE tender_workspaces (
  organization_id text NOT NULL,
  procurement_id text NOT NULL,
  owner_id text NOT NULL,
  primary_pack_id text NOT NULL CHECK (primary_pack_id IN ('global-fund','fcdo-prime','unfpa','ocha-cbpf')),
  pack_version text NOT NULL,
  current_revision integer NOT NULL DEFAULT 0 CHECK (current_revision >= 0),
  current_draft_id text,
  current_assessment_id text,
  current_judgment_id text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, procurement_id),
  FOREIGN KEY (organization_id, procurement_id) REFERENCES procurements (organization_id, id)
);
CREATE INDEX tender_workspaces_owner_idx ON tender_workspaces (organization_id, owner_id, updated_at DESC);

CREATE TABLE tender_access (
  organization_id text NOT NULL,
  procurement_id text NOT NULL,
  user_id text NOT NULL,
  access text NOT NULL CHECK (access IN ('read','review')),
  granted_by text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, procurement_id, user_id),
  FOREIGN KEY (organization_id, procurement_id) REFERENCES tender_workspaces (organization_id, procurement_id)
);
CREATE INDEX tender_access_user_idx ON tender_access (organization_id, user_id, procurement_id);

CREATE TABLE tender_manual_versions (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  procurement_id text NOT NULL,
  ordinal integer NOT NULL CHECK (ordinal > 0),
  version_label text NOT NULL,
  label text NOT NULL,
  original_filename text NOT NULL,
  media_type text NOT NULL,
  byte_size integer NOT NULL CHECK (byte_size > 0 AND byte_size <= 8388608),
  sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  hash_kind text NOT NULL CHECK (hash_kind IN ('server_verified_upload','client_declared_unverified')),
  source_version_id text,
  supersedes_id text,
  recorded_by text NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, procurement_id, id),
  UNIQUE (organization_id, procurement_id, ordinal),
  FOREIGN KEY (organization_id, procurement_id) REFERENCES tender_workspaces (organization_id, procurement_id),
  FOREIGN KEY (organization_id, procurement_id, source_version_id) REFERENCES source_versions (organization_id, procurement_id, id),
  FOREIGN KEY (organization_id, procurement_id, supersedes_id) REFERENCES tender_manual_versions (organization_id, procurement_id, id),
  CHECK (supersedes_id IS DISTINCT FROM id)
);

CREATE TABLE tender_packet_receipts (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  procurement_id text NOT NULL,
  pack_id text NOT NULL,
  pack_version text NOT NULL,
  pack_definition jsonb NOT NULL CHECK (octet_length(pack_definition::text) <= 180000),
  pack_definition_hash text NOT NULL CHECK (pack_definition_hash ~ '^[a-f0-9]{64}$'),
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[a-f0-9]{64}$'),
  original_filename text NOT NULL,
  media_type text NOT NULL,
  byte_size integer NOT NULL CHECK (byte_size > 0 AND byte_size <= 8388608),
  provider_id text NOT NULL,
  classification text NOT NULL CHECK (classification IN ('synthetic','customer')),
  payload jsonb NOT NULL CHECK (octet_length(payload::text) <= 180000),
  payload_hash text NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'),
  issued_by text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, procurement_id, id),
  FOREIGN KEY (organization_id, procurement_id) REFERENCES tender_workspaces (organization_id, procurement_id)
);
CREATE INDEX tender_packet_receipts_scope_time_idx ON tender_packet_receipts (organization_id, procurement_id, issued_at DESC);

CREATE TABLE tender_draft_revisions (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  procurement_id text NOT NULL,
  revision integer NOT NULL CHECK (revision > 0),
  parent_draft_id text,
  packet_receipt_id text NOT NULL,
  payload jsonb NOT NULL CHECK (octet_length(payload::text) <= 180000),
  payload_hash text NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'),
  actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, procurement_id, id),
  UNIQUE (organization_id, procurement_id, revision),
  FOREIGN KEY (organization_id, procurement_id) REFERENCES tender_workspaces (organization_id, procurement_id),
  FOREIGN KEY (organization_id, procurement_id, parent_draft_id) REFERENCES tender_draft_revisions (organization_id, procurement_id, id),
  FOREIGN KEY (organization_id, procurement_id, packet_receipt_id) REFERENCES tender_packet_receipts (organization_id, procurement_id, id),
  CHECK (parent_draft_id IS DISTINCT FROM id)
);

CREATE TABLE tender_draft_manuals (
  organization_id text NOT NULL,
  procurement_id text NOT NULL,
  draft_id text NOT NULL,
  manual_version_id text NOT NULL,
  PRIMARY KEY (organization_id, procurement_id, draft_id, manual_version_id),
  FOREIGN KEY (organization_id, procurement_id, draft_id) REFERENCES tender_draft_revisions (organization_id, procurement_id, id),
  FOREIGN KEY (organization_id, procurement_id, manual_version_id) REFERENCES tender_manual_versions (organization_id, procurement_id, id)
);

CREATE TABLE tender_issued_records (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  procurement_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('assessment','human_judgment','exception_proposal')),
  draft_id text NOT NULL,
  parent_record_id text,
  payload jsonb NOT NULL CHECK (octet_length(payload::text) <= 180000),
  snapshot_hash text NOT NULL CHECK (snapshot_hash ~ '^[a-f0-9]{64}$'),
  packs_hash text NOT NULL CHECK (packs_hash ~ '^[a-f0-9]{64}$'),
  payload_hash text NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'),
  issued_by text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, procurement_id, id),
  FOREIGN KEY (organization_id, procurement_id) REFERENCES tender_workspaces (organization_id, procurement_id),
  FOREIGN KEY (organization_id, procurement_id, draft_id) REFERENCES tender_draft_revisions (organization_id, procurement_id, id),
  FOREIGN KEY (organization_id, procurement_id, parent_record_id) REFERENCES tender_issued_records (organization_id, procurement_id, id),
  CHECK (parent_record_id IS DISTINCT FROM id)
);
CREATE INDEX tender_issued_records_scope_time_idx ON tender_issued_records (organization_id, procurement_id, issued_at DESC);

ALTER TABLE tender_workspaces ADD CONSTRAINT tender_workspace_current_draft_fk
  FOREIGN KEY (organization_id, procurement_id, current_draft_id) REFERENCES tender_draft_revisions (organization_id, procurement_id, id);
ALTER TABLE tender_workspaces ADD CONSTRAINT tender_workspace_current_assessment_fk
  FOREIGN KEY (organization_id, procurement_id, current_assessment_id) REFERENCES tender_issued_records (organization_id, procurement_id, id);
ALTER TABLE tender_workspaces ADD CONSTRAINT tender_workspace_current_judgment_fk
  FOREIGN KEY (organization_id, procurement_id, current_judgment_id) REFERENCES tender_issued_records (organization_id, procurement_id, id);

CREATE TABLE tender_commands (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  procurement_id text NOT NULL,
  actor_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('create','manual','packet','draft','assessment','judgment','grant','revoke')),
  idempotency_key text NOT NULL,
  input_hash text NOT NULL CHECK (input_hash ~ '^[a-f0-9]{64}$'),
  response_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, action, idempotency_key),
  FOREIGN KEY (organization_id, procurement_id) REFERENCES tender_workspaces (organization_id, procurement_id)
);

CREATE TABLE tender_export_receipts (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  procurement_id text NOT NULL,
  record_id text NOT NULL,
  actor_id text NOT NULL,
  pdf_sha256 text NOT NULL CHECK (pdf_sha256 ~ '^[a-f0-9]{64}$'),
  exported_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, procurement_id, record_id) REFERENCES tender_issued_records (organization_id, procurement_id, id)
);

CREATE FUNCTION tender_prevent_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  RAISE EXCEPTION 'Tender evidence and receipts are immutable; append a revision';
END $$;
CREATE FUNCTION tender_workspace_cursor_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id OR NEW.procurement_id IS DISTINCT FROM OLD.procurement_id
    OR NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.primary_pack_id IS DISTINCT FROM OLD.primary_pack_id
    OR NEW.pack_version IS DISTINCT FROM OLD.pack_version THEN
    RAISE EXCEPTION 'Tender identity and pinned pack are immutable';
  END IF;
  IF NEW.current_revision < OLD.current_revision OR NEW.current_revision > OLD.current_revision + 1 THEN
    RAISE EXCEPTION 'Tender cursor must advance one revision at a time';
  END IF;
  IF NEW.current_revision = OLD.current_revision + 1 AND NEW.current_draft_id IS NOT DISTINCT FROM OLD.current_draft_id THEN
    RAISE EXCEPTION 'Tender revision requires a new draft';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER tender_workspace_cursor_only BEFORE UPDATE ON tender_workspaces
  FOR EACH ROW EXECUTE FUNCTION tender_workspace_cursor_guard();
DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['tender_workspaces','tender_access','tender_manual_versions','tender_packet_receipts','tender_draft_revisions','tender_draft_manuals','tender_issued_records','tender_commands','tender_export_receipts'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (organization_id = traceli_current_organization_id()) WITH CHECK (organization_id = traceli_current_organization_id())', table_name);
  END LOOP;
  FOREACH table_name IN ARRAY ARRAY['tender_manual_versions','tender_packet_receipts','tender_draft_revisions','tender_draft_manuals','tender_issued_records','tender_commands','tender_export_receipts'] LOOP
    EXECUTE format('CREATE TRIGGER tender_no_mutation BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION tender_prevent_mutation()', table_name);
    EXECUTE format('GRANT SELECT, INSERT ON %I TO traceli_app', table_name);
  END LOOP;
END $$;
GRANT SELECT, INSERT, UPDATE ON tender_workspaces, tender_access TO traceli_app;
GRANT DELETE ON tender_access TO traceli_app;

COMMIT;
