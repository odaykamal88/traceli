BEGIN;

-- HQ state is separate from the procurement control graph and the existing D1 desk.
-- These roles are used only by a trusted server broker, never issued to agents.
DO $$ DECLARE role_name text; BEGIN
  FOREACH role_name IN ARRAY ARRAY['traceli_hq_worker','traceli_hq_supervisor','traceli_hq_librarian'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
      EXECUTE format('CREATE ROLE %I NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS',role_name);
    END IF;
    EXECUTE format('GRANT %I TO %I',role_name,current_user);
    EXECUTE format('GRANT USAGE ON SCHEMA public TO %I',role_name);
  END LOOP;
END $$;

CREATE TABLE hq_scopes (
  organization_id text NOT NULL REFERENCES organizations(id),
  id text NOT NULL,
  kind text NOT NULL CHECK(kind IN ('company','mandate','case')),
  mandate_id text,
  name text NOT NULL,
  definition jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,id),
  FOREIGN KEY(organization_id,mandate_id) REFERENCES hq_scopes(organization_id,id),
  CHECK((kind='company' AND mandate_id IS NULL) OR (kind='mandate' AND mandate_id=id) OR (kind='case' AND mandate_id IS NOT NULL AND mandate_id<>id))
);

CREATE TABLE hq_jobs (
  organization_id text NOT NULL,
  id text NOT NULL,
  mandate_id text NOT NULL,
  source_system text NOT NULL DEFAULT 'hq' CHECK(source_system IN ('hq','operating_room')),
  external_id text,
  objective text NOT NULL,
  contract jsonb NOT NULL,
  approval_level text NOT NULL CHECK(approval_level IN ('Green','Amber','Red')),
  status text NOT NULL DEFAULT 'ready' CHECK(status IN ('ready','running','review','accepted','blocked','failed','cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  max_attempts integer NOT NULL DEFAULT 2 CHECK(max_attempts BETWEEN 1 AND 3),
  lease_token text,
  lease_until timestamptz,
  worker_id text,
  result jsonb,
  reviewer_id text,
  review_evidence text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,id),
  FOREIGN KEY(organization_id,mandate_id) REFERENCES hq_scopes(organization_id,id),
  UNIQUE(organization_id,source_system,external_id),
  CHECK(attempts<=max_attempts),
  CHECK((status='running' AND lease_token IS NOT NULL AND lease_until IS NOT NULL AND worker_id IS NOT NULL) OR (status<>'running' AND lease_token IS NULL AND lease_until IS NULL)),
  CHECK(status<>'accepted' OR (reviewer_id IS NOT NULL AND review_evidence IS NOT NULL AND length(review_evidence)>0 AND reviewer_id IS DISTINCT FROM worker_id)),
  CHECK(source_system<>'operating_room' OR external_id IS NOT NULL)
);
CREATE INDEX hq_jobs_queue_idx ON hq_jobs(organization_id,mandate_id,status,created_at);
CREATE UNIQUE INDEX hq_one_running_job_per_mandate ON hq_jobs(organization_id,mandate_id) WHERE status='running';

CREATE TABLE hq_runs (
  organization_id text NOT NULL,
  id text NOT NULL,
  job_id text NOT NULL,
  mandate_id text NOT NULL,
  attempt integer NOT NULL CHECK(attempt>0),
  worker_id text NOT NULL,
  lease_token text NOT NULL,
  lease_until timestamptz NOT NULL,
  status text NOT NULL CHECK(status IN ('running','review','failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  result jsonb,
  cost_usd numeric(14,6) CHECK(cost_usd>=0),
  input_tokens bigint CHECK(input_tokens>=0),
  output_tokens bigint CHECK(output_tokens>=0),
  PRIMARY KEY(organization_id,id),
  UNIQUE(organization_id,job_id,attempt),
  UNIQUE(organization_id,lease_token),
  FOREIGN KEY(organization_id,job_id) REFERENCES hq_jobs(organization_id,id),
  FOREIGN KEY(organization_id,mandate_id) REFERENCES hq_scopes(organization_id,id),
  CHECK((status='running' AND finished_at IS NULL) OR (status<>'running' AND finished_at IS NOT NULL))
);

CREATE TABLE hq_memory_proposals (
  organization_id text NOT NULL,
  id text NOT NULL,
  scope_id text NOT NULL,
  memory_key text NOT NULL CHECK(length(memory_key) BETWEEN 1 AND 160),
  base_version integer NOT NULL CHECK(base_version>=0),
  author_id text NOT NULL,
  job_id text,
  content text NOT NULL CHECK(length(content) BETWEEN 1 AND 50000),
  content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
  evidence_refs jsonb NOT NULL CHECK(jsonb_typeof(evidence_refs)='array' AND jsonb_array_length(evidence_refs)>0),
  knowledge_kind text NOT NULL CHECK(knowledge_kind IN ('fact','inference','hypothesis','decision','procedure')),
  classification text NOT NULL DEFAULT 'internal' CHECK(classification IN ('public','internal')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,id),
  FOREIGN KEY(organization_id,scope_id) REFERENCES hq_scopes(organization_id,id),
  FOREIGN KEY(organization_id,job_id) REFERENCES hq_jobs(organization_id,id)
);

CREATE TABLE hq_memory_reviews (
  organization_id text NOT NULL,
  id text NOT NULL,
  proposal_id text NOT NULL,
  reviewer_id text NOT NULL,
  decision text NOT NULL CHECK(decision IN ('approved','rejected')),
  content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
  rationale text NOT NULL CHECK(length(rationale)>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,id),
  UNIQUE(organization_id,proposal_id),
  FOREIGN KEY(organization_id,proposal_id) REFERENCES hq_memory_proposals(organization_id,id)
);

CREATE TABLE hq_memory_versions (
  organization_id text NOT NULL,
  scope_id text NOT NULL,
  memory_key text NOT NULL,
  version integer NOT NULL CHECK(version>0),
  proposal_id text NOT NULL,
  review_id text NOT NULL,
  promoted_by text NOT NULL,
  content text NOT NULL,
  content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,scope_id,memory_key,version),
  UNIQUE(organization_id,proposal_id),
  UNIQUE(organization_id,review_id),
  FOREIGN KEY(organization_id,scope_id) REFERENCES hq_scopes(organization_id,id),
  FOREIGN KEY(organization_id,proposal_id) REFERENCES hq_memory_proposals(organization_id,id),
  FOREIGN KEY(organization_id,review_id) REFERENCES hq_memory_reviews(organization_id,id)
);

CREATE TABLE hq_decision_ledger (
  organization_id text NOT NULL REFERENCES organizations(id),
  id text NOT NULL,
  actor_id text NOT NULL,
  approval_level text NOT NULL CHECK(approval_level IN ('Green','Amber','Red')),
  decision text NOT NULL,
  rationale text NOT NULL,
  evidence_refs jsonb NOT NULL CHECK(jsonb_typeof(evidence_refs)='array' AND jsonb_array_length(evidence_refs)>0),
  supersedes_id text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,id),
  FOREIGN KEY(organization_id,supersedes_id) REFERENCES hq_decision_ledger(organization_id,id),
  CHECK(id IS DISTINCT FROM supersedes_id)
);

CREATE TABLE hq_events (
  organization_id text NOT NULL REFERENCES organizations(id),
  id text NOT NULL,
  mandate_id text NOT NULL,
  job_id text,
  actor_id text NOT NULL,
  event_type text NOT NULL,
  evidence jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,id),
  FOREIGN KEY(organization_id,mandate_id) REFERENCES hq_scopes(organization_id,id),
  FOREIGN KEY(organization_id,job_id) REFERENCES hq_jobs(organization_id,id)
);

CREATE FUNCTION traceli_hq_actor_id() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.hq_actor_id',true),'')
$$;
CREATE FUNCTION traceli_hq_mandate_id() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.hq_mandate_id',true),'')
$$;
CREATE FUNCTION traceli_hq_visible_scope(scope text) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS(SELECT 1 FROM hq_scopes WHERE organization_id=traceli_current_organization_id() AND id=scope)
$$;

DO $$ DECLARE tab text; BEGIN
  FOREACH tab IN ARRAY ARRAY['hq_scopes','hq_jobs','hq_runs','hq_memory_proposals','hq_memory_reviews','hq_memory_versions','hq_decision_ledger','hq_events'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',tab);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',tab);
    EXECUTE format('CREATE POLICY hq_staff_tenant ON %I TO traceli_hq_supervisor,traceli_hq_librarian USING(organization_id=traceli_current_organization_id()) WITH CHECK(organization_id=traceli_current_organization_id())',tab);
  END LOOP;
END $$;

CREATE POLICY hq_worker_scope ON hq_scopes FOR SELECT TO traceli_hq_worker
  USING(organization_id=traceli_current_organization_id() AND (kind='company' OR mandate_id=traceli_hq_mandate_id()));
CREATE POLICY hq_worker_jobs_read ON hq_jobs FOR SELECT TO traceli_hq_worker
  USING(organization_id=traceli_current_organization_id() AND mandate_id=traceli_hq_mandate_id());
CREATE POLICY hq_worker_jobs_write ON hq_jobs FOR UPDATE TO traceli_hq_worker
  USING(organization_id=traceli_current_organization_id() AND mandate_id=traceli_hq_mandate_id() AND approval_level='Green' AND source_system='hq')
  WITH CHECK(organization_id=traceli_current_organization_id() AND mandate_id=traceli_hq_mandate_id() AND approval_level='Green' AND source_system='hq' AND worker_id=traceli_hq_actor_id() AND status IN ('running','review','failed'));
CREATE POLICY hq_worker_runs ON hq_runs TO traceli_hq_worker
  USING(organization_id=traceli_current_organization_id() AND mandate_id=traceli_hq_mandate_id())
  WITH CHECK(organization_id=traceli_current_organization_id() AND mandate_id=traceli_hq_mandate_id() AND worker_id=traceli_hq_actor_id());
CREATE POLICY hq_worker_proposals_read ON hq_memory_proposals FOR SELECT TO traceli_hq_worker
  USING(organization_id=traceli_current_organization_id() AND traceli_hq_visible_scope(scope_id));
CREATE POLICY hq_worker_proposals_insert ON hq_memory_proposals FOR INSERT TO traceli_hq_worker
  WITH CHECK(organization_id=traceli_current_organization_id() AND traceli_hq_visible_scope(scope_id) AND author_id=traceli_hq_actor_id());
CREATE POLICY hq_worker_memory ON hq_memory_versions FOR SELECT TO traceli_hq_worker
  USING(organization_id=traceli_current_organization_id() AND traceli_hq_visible_scope(scope_id));
CREATE POLICY hq_worker_decisions ON hq_decision_ledger FOR SELECT TO traceli_hq_worker
  USING(organization_id=traceli_current_organization_id());
CREATE POLICY hq_worker_events ON hq_events TO traceli_hq_worker
  USING(organization_id=traceli_current_organization_id() AND mandate_id=traceli_hq_mandate_id())
  WITH CHECK(organization_id=traceli_current_organization_id() AND mandate_id=traceli_hq_mandate_id() AND actor_id=traceli_hq_actor_id());

-- Minimal cross-mandate handoff evidence, with an explicit tenant predicate.
-- The owner-backed view exposes neither contracts nor memory/run bodies.
CREATE VIEW hq_job_status WITH(security_barrier=true) AS
  SELECT id,status FROM hq_jobs WHERE organization_id=traceli_current_organization_id();
GRANT SELECT ON hq_job_status TO traceli_hq_worker;

GRANT SELECT ON hq_scopes,hq_jobs,hq_runs,hq_memory_proposals,hq_memory_versions,hq_decision_ledger,hq_events TO traceli_hq_worker;
GRANT INSERT ON hq_runs,hq_memory_proposals,hq_events TO traceli_hq_worker;
GRANT UPDATE(status,attempts,lease_token,lease_until,worker_id,result,updated_at) ON hq_jobs TO traceli_hq_worker;
GRANT UPDATE(status,finished_at,result,cost_usd,input_tokens,output_tokens) ON hq_runs TO traceli_hq_worker;
GRANT SELECT ON hq_scopes,hq_jobs,hq_runs,hq_memory_proposals,hq_memory_reviews,hq_memory_versions,hq_decision_ledger,hq_events TO traceli_hq_supervisor,traceli_hq_librarian;
GRANT INSERT,UPDATE ON hq_scopes,hq_jobs TO traceli_hq_supervisor;
GRANT INSERT ON hq_memory_reviews,hq_decision_ledger,hq_events TO traceli_hq_supervisor;
GRANT INSERT ON hq_memory_versions,hq_events TO traceli_hq_librarian;

CREATE FUNCTION traceli_hq_append_only() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  RAISE EXCEPTION 'HQ history is append-only; create a linked correction';
END $$;
DO $$ DECLARE tab text; BEGIN
  FOREACH tab IN ARRAY ARRAY['hq_memory_proposals','hq_memory_reviews','hq_memory_versions','hq_decision_ledger','hq_events'] LOOP
    EXECUTE format('CREATE TRIGGER hq_immutable BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION traceli_hq_append_only()',tab);
  END LOOP;
END $$;

CREATE FUNCTION traceli_hq_check_job() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM hq_scopes WHERE organization_id=NEW.organization_id AND id=NEW.mandate_id AND kind='mandate') THEN
    RAISE EXCEPTION 'A job must belong to a mandate';
  END IF;
  IF TG_OP='UPDATE' AND current_user='traceli_hq_worker' THEN
    IF OLD.status NOT IN ('ready','running') THEN RAISE EXCEPTION 'Job is not dispatchable'; END IF;
    IF NEW.status='running' THEN
      IF OLD.status='running' AND OLD.lease_until>clock_timestamp() THEN RAISE EXCEPTION 'Active lease exists'; END IF;
      IF NEW.attempts<>OLD.attempts+1 OR NEW.lease_until<=clock_timestamp() OR NEW.lease_until>clock_timestamp()+interval '45 minutes' THEN RAISE EXCEPTION 'Invalid attempt or lease limit'; END IF;
      IF (NEW.contract->'deadline_sla'->>'active_minutes') IS NULL OR (NEW.contract->'deadline_sla'->>'active_minutes')::numeric<=0 OR NEW.lease_until>clock_timestamp()+((NEW.contract->'deadline_sla'->>'active_minutes')::numeric*interval '1 minute') THEN RAISE EXCEPTION 'Job active-time budget exceeded'; END IF;
    ELSE
      IF OLD.status<>'running' OR OLD.lease_until<=clock_timestamp() OR OLD.lease_token IS DISTINCT FROM current_setting('app.hq_lease_token',true) OR OLD.worker_id IS DISTINCT FROM traceli_hq_actor_id() THEN RAISE EXCEPTION 'An active matching lease is required'; END IF;
      IF NEW.attempts<>OLD.attempts OR NEW.result IS NULL THEN RAISE EXCEPTION 'Submission evidence required'; END IF;
    END IF;
  END IF;
  IF NEW.status='accepted' AND (TG_OP='INSERT' OR OLD.status<>'review' OR NEW.reviewer_id IS DISTINCT FROM traceli_hq_actor_id() OR NEW.result IS NULL) THEN
    RAISE EXCEPTION 'Acceptance requires a submitted result and independent reviewer';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER hq_job_guard BEFORE INSERT OR UPDATE ON hq_jobs FOR EACH ROW EXECUTE FUNCTION traceli_hq_check_job();

CREATE FUNCTION traceli_hq_check_run() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE job hq_jobs; BEGIN
  SELECT * INTO job FROM hq_jobs WHERE organization_id=NEW.organization_id AND id=NEW.job_id;
  IF job.id IS NULL OR NEW.mandate_id<>job.mandate_id OR NEW.worker_id<>job.worker_id OR NEW.attempt<>job.attempts THEN RAISE EXCEPTION 'Run does not match its job'; END IF;
  IF TG_OP='INSERT' AND (job.status<>'running' OR NEW.lease_token<>job.lease_token OR NEW.lease_until<>job.lease_until OR NEW.status<>'running') THEN RAISE EXCEPTION 'Run requires the active claim'; END IF;
  IF TG_OP='UPDATE' THEN
    IF OLD.status<>'running' OR OLD.lease_until<=clock_timestamp() OR OLD.lease_token IS DISTINCT FROM current_setting('app.hq_lease_token',true) OR NEW.status NOT IN ('review','failed') THEN RAISE EXCEPTION 'Run submission requires an active matching lease'; END IF;
    IF (NEW.job_id,NEW.mandate_id,NEW.attempt,NEW.worker_id,NEW.lease_token,NEW.lease_until) IS DISTINCT FROM (OLD.job_id,OLD.mandate_id,OLD.attempt,OLD.worker_id,OLD.lease_token,OLD.lease_until) THEN RAISE EXCEPTION 'Run identity is immutable'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER hq_run_guard BEFORE INSERT OR UPDATE ON hq_runs FOR EACH ROW EXECUTE FUNCTION traceli_hq_check_run();

CREATE FUNCTION traceli_hq_hash_proposal() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  NEW.content_hash=encode(sha256(convert_to(NEW.content,'UTF8')),'hex');
  IF NEW.job_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM hq_jobs WHERE organization_id=NEW.organization_id AND id=NEW.job_id) THEN RAISE EXCEPTION 'Proposal job is unavailable in this scope'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER hq_proposal_hash BEFORE INSERT ON hq_memory_proposals FOR EACH ROW EXECUTE FUNCTION traceli_hq_hash_proposal();

CREATE FUNCTION traceli_hq_check_review() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE proposal hq_memory_proposals; BEGIN
  SELECT * INTO proposal FROM hq_memory_proposals WHERE organization_id=NEW.organization_id AND id=NEW.proposal_id;
  IF proposal.id IS NULL OR NEW.reviewer_id=proposal.author_id OR NEW.reviewer_id IS DISTINCT FROM traceli_hq_actor_id() OR NEW.content_hash<>proposal.content_hash THEN RAISE EXCEPTION 'Review must bind an independent actor and the exact proposal'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER hq_review_guard BEFORE INSERT ON hq_memory_reviews FOR EACH ROW EXECUTE FUNCTION traceli_hq_check_review();

CREATE FUNCTION traceli_hq_check_promotion() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE proposal hq_memory_proposals; review hq_memory_reviews; head integer;
BEGIN
  SELECT * INTO proposal FROM hq_memory_proposals WHERE organization_id=NEW.organization_id AND id=NEW.proposal_id;
  SELECT * INTO review FROM hq_memory_reviews WHERE organization_id=NEW.organization_id AND id=NEW.review_id;
  IF proposal.id IS NULL OR review.id IS NULL OR review.proposal_id<>proposal.id OR review.decision<>'approved' OR review.content_hash<>proposal.content_hash OR NEW.scope_id<>proposal.scope_id OR NEW.memory_key<>proposal.memory_key OR NEW.content<>proposal.content OR NEW.promoted_by IS DISTINCT FROM traceli_hq_actor_id() THEN RAISE EXCEPTION 'Promotion requires the exact approved proposal'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.organization_id||':'||NEW.scope_id||':'||NEW.memory_key,0));
  SELECT coalesce(max(version),0) INTO head FROM hq_memory_versions WHERE organization_id=NEW.organization_id AND scope_id=NEW.scope_id AND memory_key=NEW.memory_key;
  IF head<>proposal.base_version OR NEW.version<>head+1 THEN RAISE EXCEPTION 'Stale memory base version; rebase and obtain a new review'; END IF;
  NEW.content_hash=encode(sha256(convert_to(NEW.content,'UTF8')),'hex');
  RETURN NEW;
END $$;
CREATE TRIGGER hq_promotion_guard BEFORE INSERT ON hq_memory_versions FOR EACH ROW EXECUTE FUNCTION traceli_hq_check_promotion();

COMMIT;
