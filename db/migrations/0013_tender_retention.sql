BEGIN;

-- Existing tenders are preserved. Only newly created managed tenders enter the approved 30-day policy.
ALTER TABLE tender_workspaces ADD COLUMN retention_state text NOT NULL DEFAULT 'legacy_preserved' CHECK (retention_state IN ('legacy_preserved','managed'));
ALTER TABLE tender_workspaces ADD COLUMN classification text NOT NULL DEFAULT 'synthetic' CHECK (classification IN ('synthetic','customer'));
ALTER TABLE tender_workspaces ADD COLUMN policy jsonb CHECK (octet_length(policy::text) <= 4000);
ALTER TABLE tender_workspaces ADD COLUMN policy_hash text CHECK (policy_hash ~ '^[a-f0-9]{64}$');
ALTER TABLE tender_workspaces ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE tender_workspaces ADD COLUMN expires_at timestamptz;
ALTER TABLE tender_workspaces ADD COLUMN deletion_requested_at timestamptz;
ALTER TABLE tender_workspaces ADD CONSTRAINT tender_policy_expiry CHECK ((
 (retention_state='legacy_preserved' AND policy IS NULL AND policy_hash IS NULL AND expires_at IS NULL AND deletion_requested_at IS NULL)
 OR (retention_state='managed' AND policy IS NOT NULL AND policy_hash IS NOT NULL AND expires_at IS NOT NULL
 AND jsonb_typeof(policy)='object' AND jsonb_typeof(policy->'retentionDays')='number'
 AND jsonb_typeof(policy->'version')='string' AND jsonb_typeof(policy->'description')='string'
 AND jsonb_typeof(policy->'providerDisclosure')='string' AND policy->>'providerId' IN ('mock','talonic')
 AND policy->'sourceBytesRetained'='false'::jsonb
 AND policy->>'classification' = classification AND (policy->>'retentionDays')::integer = 30
 AND expires_at = created_at + interval '720 hours')) IS TRUE);
CREATE INDEX tender_workspaces_expiry_idx ON tender_workspaces (organization_id, expires_at) WHERE retention_state='managed';

CREATE TABLE tender_deletion_requests (
 id text PRIMARY KEY, organization_id text NOT NULL, procurement_id text NOT NULL,
 idempotency_key text NOT NULL, input_hash text NOT NULL CHECK (input_hash ~ '^[a-f0-9]{64}$'), requested_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (organization_id,procurement_id,idempotency_key),
 FOREIGN KEY (organization_id,procurement_id) REFERENCES tender_workspaces (organization_id,procurement_id)
);
-- No FK to deleted content; no names, excerpts, file hashes or actor identity retained. Finite replay window.
CREATE TABLE tender_deletion_receipts (
 id text PRIMARY KEY, organization_id text NOT NULL, procurement_id text NOT NULL,
 idempotency_key text, input_hash text CHECK (input_hash ~ '^[a-f0-9]{64}$'), reason text NOT NULL CHECK (reason IN ('requested','expired')),
 deleted_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 UNIQUE (organization_id,procurement_id,idempotency_key), CHECK (expires_at = deleted_at + interval '720 hours')
);
DO $$ DECLARE table_name text; BEGIN
 FOREACH table_name IN ARRAY ARRAY['tender_deletion_requests','tender_deletion_receipts'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',table_name);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',table_name);
  EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (organization_id = traceli_current_organization_id()) WITH CHECK (organization_id = traceli_current_organization_id())',table_name);
  EXECUTE format('CREATE TRIGGER tender_no_mutation BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION tender_prevent_mutation()',table_name);
 END LOOP;
END $$;
GRANT SELECT,INSERT ON tender_deletion_requests TO traceli_app;
GRANT SELECT ON tender_deletion_receipts TO traceli_app;

DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='traceli_retention_executor') THEN
  CREATE ROLE traceli_retention_executor NOLOGIN NOINHERIT NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
 ELSIF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='traceli_retention_executor' AND (rolcanlogin OR rolbypassrls OR rolsuper OR rolcreaterole OR rolcreatedb OR rolreplication)) THEN
  RAISE EXCEPTION 'Retention executor has unsafe privileges';
 END IF;
 IF pg_has_role('traceli_app','traceli_retention_executor','MEMBER') THEN
  RAISE EXCEPTION 'Application must not inherit retention executor';
 END IF;
 EXECUTE format('GRANT traceli_retention_executor TO %I',current_user);
END $$;
GRANT USAGE,CREATE ON SCHEMA public TO traceli_retention_executor;
GRANT SELECT,DELETE ON tender_workspaces,tender_access,tender_manual_versions,tender_packet_receipts,tender_draft_revisions,tender_draft_manuals,tender_issued_records,tender_commands,tender_export_receipts,tender_deletion_requests,tender_deletion_receipts,audit_events,outbox_events,procurements TO traceli_retention_executor;
GRANT UPDATE (current_draft_id,current_assessment_id,current_judgment_id) ON tender_workspaces TO traceli_retention_executor;
GRANT INSERT ON tender_deletion_receipts TO traceli_retention_executor;
-- Row-lock privilege only; the immutable trigger still rejects every UPDATE, including by this role.
GRANT UPDATE (id) ON tender_deletion_receipts TO traceli_retention_executor;

CREATE OR REPLACE FUNCTION tender_prevent_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' AND current_user='traceli_retention_executor' THEN RETURN OLD; END IF;
 RAISE EXCEPTION 'Tender evidence and receipts are immutable; append a revision';
END $$;
CREATE OR REPLACE FUNCTION prevent_audit_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' AND current_user='traceli_retention_executor' AND OLD.event_type LIKE 'tender.%' THEN RETURN OLD; END IF;
 RAISE EXCEPTION 'audit_events are append-only';
END $$;
CREATE OR REPLACE FUNCTION tender_workspace_cursor_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.organization_id IS DISTINCT FROM OLD.organization_id OR NEW.procurement_id IS DISTINCT FROM OLD.procurement_id
 OR NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.primary_pack_id IS DISTINCT FROM OLD.primary_pack_id OR NEW.pack_version IS DISTINCT FROM OLD.pack_version
 OR NEW.retention_state IS DISTINCT FROM OLD.retention_state OR NEW.classification IS DISTINCT FROM OLD.classification
 OR NEW.policy IS DISTINCT FROM OLD.policy OR NEW.policy_hash IS DISTINCT FROM OLD.policy_hash
 OR NEW.created_at IS DISTINCT FROM OLD.created_at OR NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
  RAISE EXCEPTION 'Tender identity, pinned policy and pack are immutable';
 END IF;
 IF OLD.deletion_requested_at IS NOT NULL AND NEW.deletion_requested_at IS DISTINCT FROM OLD.deletion_requested_at THEN RAISE EXCEPTION 'Tender deletion cannot be reversed'; END IF;
 IF current_user <> 'traceli_retention_executor' AND (OLD.expires_at <= clock_timestamp() OR OLD.deletion_requested_at IS NOT NULL) THEN RAISE EXCEPTION 'Tender retention has ended'; END IF;
 IF NEW.current_revision < OLD.current_revision OR NEW.current_revision > OLD.current_revision+1 THEN RAISE EXCEPTION 'Tender cursor must advance one revision at a time'; END IF;
 IF NEW.current_revision=OLD.current_revision+1 AND NEW.current_draft_id IS NOT DISTINCT FROM OLD.current_draft_id THEN RAISE EXCEPTION 'Tender revision requires a new draft'; END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION tender_require_active() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_TABLE_NAME IN ('tender_packet_receipts','tender_manual_versions') THEN
  IF NEW.byte_size>4194304 THEN RAISE EXCEPTION 'Tender upload exceeds 4 MB'; END IF;
 END IF;
 PERFORM 1 FROM tender_workspaces WHERE organization_id=NEW.organization_id AND procurement_id=NEW.procurement_id AND (expires_at IS NULL OR expires_at>clock_timestamp()) AND deletion_requested_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Tender retention has ended'; END IF;
 RETURN NEW;
END $$;
DO $$ DECLARE table_name text; BEGIN
 FOREACH table_name IN ARRAY ARRAY['tender_access','tender_manual_versions','tender_packet_receipts','tender_draft_revisions','tender_draft_manuals','tender_issued_records','tender_commands','tender_export_receipts'] LOOP
  EXECUTE format('CREATE TRIGGER tender_active_insert BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION tender_require_active()',table_name);
 END LOOP;
END $$;

CREATE FUNCTION tender_purge(p_organization_id text,p_procurement_id text,p_receipt_id text,p_request_id text DEFAULT NULL)
RETURNS tender_deletion_receipts LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE w public.tender_workspaces; r public.tender_deletion_requests; receipt public.tender_deletion_receipts; deleted_time timestamptz;
BEGIN
 IF p_organization_id IS DISTINCT FROM public.traceli_current_organization_id() THEN RAISE EXCEPTION 'Unavailable retention scope'; END IF;
 SELECT * INTO w FROM public.tender_workspaces WHERE organization_id=p_organization_id AND procurement_id=p_procurement_id FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF w.retention_state <> 'managed' OR w.expires_at IS NULL THEN RAISE EXCEPTION 'Legacy tender is outside the deletion policy'; END IF;
 IF p_request_id IS NOT NULL THEN
  SELECT * INTO r FROM public.tender_deletion_requests WHERE id=p_request_id AND organization_id=p_organization_id AND procurement_id=p_procurement_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unavailable deletion request'; END IF;
 ELSIF w.expires_at>clock_timestamp() THEN RAISE EXCEPTION 'Tender retention has not ended'; END IF;
 -- Unrelated FKs/immutable non-tender audit events fail and roll back the whole purge.
 UPDATE public.tender_workspaces SET current_draft_id=NULL,current_assessment_id=NULL,current_judgment_id=NULL WHERE organization_id=p_organization_id AND procurement_id=p_procurement_id;
 DELETE FROM public.tender_export_receipts WHERE organization_id=p_organization_id AND procurement_id=p_procurement_id;
 DELETE FROM public.tender_draft_manuals WHERE organization_id=p_organization_id AND procurement_id=p_procurement_id;
 DELETE FROM public.tender_issued_records WHERE organization_id=p_organization_id AND procurement_id=p_procurement_id;
 DELETE FROM public.tender_draft_revisions WHERE organization_id=p_organization_id AND procurement_id=p_procurement_id;
 DELETE FROM public.tender_packet_receipts WHERE organization_id=p_organization_id AND procurement_id=p_procurement_id;
 DELETE FROM public.tender_manual_versions WHERE organization_id=p_organization_id AND procurement_id=p_procurement_id;
 DELETE FROM public.tender_commands WHERE organization_id=p_organization_id AND procurement_id=p_procurement_id;
 DELETE FROM public.tender_access WHERE organization_id=p_organization_id AND procurement_id=p_procurement_id;
 DELETE FROM public.tender_deletion_requests WHERE organization_id=p_organization_id AND procurement_id=p_procurement_id;
 DELETE FROM public.tender_workspaces WHERE organization_id=p_organization_id AND procurement_id=p_procurement_id;
 DELETE FROM public.audit_events WHERE organization_id=p_organization_id AND procurement_id=p_procurement_id;
 DELETE FROM public.outbox_events WHERE organization_id=p_organization_id AND aggregate_type='procurement' AND aggregate_id=p_procurement_id;
 DELETE FROM public.procurements WHERE organization_id=p_organization_id AND id=p_procurement_id;
 deleted_time=clock_timestamp();
 INSERT INTO public.tender_deletion_receipts(id,organization_id,procurement_id,idempotency_key,input_hash,reason,deleted_at,expires_at)
 VALUES(p_receipt_id,p_organization_id,p_procurement_id,r.idempotency_key,r.input_hash,CASE WHEN p_request_id IS NULL THEN 'expired' ELSE 'requested' END,deleted_time,deleted_time+interval '720 hours') RETURNING * INTO receipt;
 RETURN receipt;
END $$;
ALTER FUNCTION tender_purge(text,text,text,text) OWNER TO traceli_retention_executor;
REVOKE ALL ON FUNCTION tender_purge(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION tender_purge(text,text,text,text) TO traceli_app;

CREATE FUNCTION tender_expire_deletion_receipts(p_organization_id text,p_limit integer DEFAULT 50)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ DECLARE amount integer; BEGIN
 IF p_organization_id IS DISTINCT FROM public.traceli_current_organization_id() OR p_limit<1 OR p_limit>100 THEN RAISE EXCEPTION 'Unavailable retention scope'; END IF;
 DELETE FROM public.tender_deletion_receipts WHERE id IN (SELECT id FROM public.tender_deletion_receipts WHERE organization_id=p_organization_id AND expires_at<=clock_timestamp() ORDER BY expires_at LIMIT p_limit FOR UPDATE SKIP LOCKED);
 GET DIAGNOSTICS amount=ROW_COUNT;
 RETURN amount;
END $$;
ALTER FUNCTION tender_expire_deletion_receipts(text,integer) OWNER TO traceli_retention_executor;
REVOKE ALL ON FUNCTION tender_expire_deletion_receipts(text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION tender_expire_deletion_receipts(text,integer) TO traceli_app;
REVOKE CREATE ON SCHEMA public FROM traceli_retention_executor;
DO $$ BEGIN
 EXECUTE format('REVOKE traceli_retention_executor FROM %I',current_user);
END $$;
COMMIT;
