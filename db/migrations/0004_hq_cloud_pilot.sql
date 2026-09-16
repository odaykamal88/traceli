BEGIN;

-- Remote credentials get only these functions, never the trusted broker roles
-- from 0003. Identity is the authenticated LOGIN, not a caller-set GUC.
DO $$ DECLARE n text; BEGIN
  FOREACH n IN ARRAY ARRAY['traceli_hq_cloud_runner','traceli_hq_cloud_reader'] LOOP
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname=n) THEN
      EXECUTE format('CREATE ROLE %I NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS',n);
    END IF;
    IF EXISTS (SELECT FROM pg_roles WHERE rolname=n AND (rolcanlogin OR rolinherit OR rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls))
      OR EXISTS (SELECT FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname=n)) THEN
      RAISE EXCEPTION 'Unsafe existing cloud capability role';
    END IF;
    EXECUTE format('GRANT USAGE ON SCHEMA public TO %I',n);
  END LOOP;
END $$;

CREATE TABLE hq_cloud_bindings (
  login_name name PRIMARY KEY,
  kind text NOT NULL CHECK(kind IN ('runner','reader')),
  organization_id text NOT NULL REFERENCES organizations(id),
  actor_id text NOT NULL CHECK(length(actor_id) BETWEEN 1 AND 160),
  mandate_id text NOT NULL DEFAULT 'institutional-memory' CHECK(mandate_id='institutional-memory'),
  enabled boolean NOT NULL DEFAULT false,
  FOREIGN KEY(organization_id,mandate_id) REFERENCES hq_scopes(organization_id,id)
);
CREATE TABLE hq_cloud_policies (
  login_name name PRIMARY KEY REFERENCES hq_cloud_bindings(login_name),
  enabled boolean NOT NULL DEFAULT false,
  funding_reference text CHECK(length(funding_reference) BETWEEN 1 AND 1000),
  monthly_limit_microusd bigint NOT NULL DEFAULT 0 CHECK(monthly_limit_microusd BETWEEN 0 AND 8000000),
  pricing_valid_until timestamptz NOT NULL,
  model text NOT NULL DEFAULT 'gpt-5.6-luna' CHECK(model='gpt-5.6-luna'),
  -- Supervisor-approved immutable source snapshot; no customer records.
  inputs jsonb NOT NULL CHECK(jsonb_typeof(inputs)='array' AND jsonb_array_length(inputs) BETWEEN 1 AND 20 AND octet_length(inputs::text)<=16000)
);
CREATE UNIQUE INDEX hq_cloud_one_runner_per_mandate ON hq_cloud_bindings(organization_id,mandate_id) WHERE kind='runner';
CREATE TABLE hq_cloud_charges (
  organization_id text NOT NULL,
  run_id text NOT NULL,
  login_name name NOT NULL REFERENCES hq_cloud_bindings(login_name),
  reserved_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  period date NOT NULL DEFAULT (date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC')::date),
  reserved_microusd bigint NOT NULL DEFAULT 50000 CHECK(reserved_microusd=50000),
  estimated_microusd bigint CHECK(estimated_microusd>=0),
  input_tokens bigint CHECK(input_tokens>=0),
  output_tokens bigint CHECK(output_tokens>=0),
  provider_response_id text CHECK(length(provider_response_id) BETWEEN 1 AND 200),
  settled_at timestamptz,
  PRIMARY KEY(organization_id,run_id),
  FOREIGN KEY(organization_id,run_id) REFERENCES hq_runs(organization_id,id)
);
CREATE TABLE hq_cloud_artifacts (
  organization_id text NOT NULL,
  run_id text NOT NULL,
  job_id text NOT NULL,
  body jsonb NOT NULL CHECK(jsonb_typeof(body)='object' AND octet_length(body::text)<=32000),
  content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(organization_id,run_id),
  FOREIGN KEY(organization_id,run_id) REFERENCES hq_runs(organization_id,id),
  FOREIGN KEY(organization_id,job_id) REFERENCES hq_jobs(organization_id,id)
);
CREATE FUNCTION hq_cloud_hash_artifact() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  NEW.content_hash=encode(sha256(convert_to(NEW.body::text,'UTF8')),'hex');
  RETURN NEW;
END $$;
CREATE TRIGGER hq_cloud_artifact_hash BEFORE INSERT ON hq_cloud_artifacts
  FOR EACH ROW EXECUTE FUNCTION hq_cloud_hash_artifact();
CREATE TRIGGER hq_cloud_artifact_immutable BEFORE UPDATE OR DELETE ON hq_cloud_artifacts
  FOR EACH ROW EXECUTE FUNCTION traceli_hq_append_only();
REVOKE ALL ON hq_cloud_bindings,hq_cloud_policies,hq_cloud_charges,hq_cloud_artifacts FROM PUBLIC,traceli_hq_cloud_runner,traceli_hq_cloud_reader;

CREATE FUNCTION hq_cloud_identity(expected_kind text) RETURNS hq_cloud_bindings
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE b public.hq_cloud_bindings; permitted name;
BEGIN
  SELECT * INTO b FROM public.hq_cloud_bindings WHERE login_name=session_user AND enabled AND kind=expected_kind;
  IF b.login_name IS NULL THEN RAISE EXCEPTION 'Cloud identity denied'; END IF;
  permitted=CASE expected_kind WHEN 'runner' THEN 'traceli_hq_cloud_runner' ELSE 'traceli_hq_cloud_reader' END;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname=session_user AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolinherit OR rolbypassrls OR NOT rolcanlogin))
    OR NOT pg_has_role(session_user,permitted,'MEMBER')
    OR EXISTS (SELECT FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid WHERE m.member=(SELECT oid FROM pg_roles WHERE rolname=session_user) AND (r.rolname<>permitted OR m.admin_option))
    OR EXISTS (SELECT FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname=permitted))
    OR has_schema_privilege(session_user,'public','CREATE') OR has_schema_privilege(permitted,'public','CREATE') THEN
    RAISE EXCEPTION 'Unsafe cloud login capabilities';
  END IF;
  PERFORM set_config('app.organization_id',b.organization_id,true),set_config('app.hq_actor_id',b.actor_id,true),set_config('app.hq_mandate_id',b.mandate_id,true);
  RETURN b;
END $$;

CREATE FUNCTION hq_cloud_claim() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE b public.hq_cloud_bindings; p public.hq_cloud_policies; j public.hq_jobs;
  jid text; rid text; tok text; until_at timestamptz; first_at timestamptz; c jsonb;
BEGIN
  b=public.hq_cloud_identity('runner');
  SELECT * INTO p FROM public.hq_cloud_policies WHERE login_name=b.login_name FOR UPDATE;
  IF p.login_name IS NULL OR NOT p.enabled OR p.funding_reference IS NULL OR p.monthly_limit_microusd<50000 OR p.pricing_valid_until<=clock_timestamp() THEN RETURN NULL; END IF;
  IF EXISTS(SELECT FROM public.hq_jobs WHERE organization_id=b.organization_id AND mandate_id=b.mandate_id
    AND contract->>'charter_version'='cloud-pilot-1' AND contract->'inputs_context'=p.inputs AND status IN ('review','accepted')) THEN RETURN NULL; END IF;
  jid='cloud-brief-'||to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYYMMDD');
  -- Expired jobs stay auditable. An expired run is displayed as expired, never
  -- falsely described as successfully finished. Reservations are not released.
  UPDATE public.hq_jobs SET status='failed',lease_token=NULL,lease_until=NULL,updated_at=clock_timestamp(),result='{"summary":"Expired cloud pilot; Supervisor review required"}'
    WHERE organization_id=b.organization_id AND mandate_id=b.mandate_id AND worker_id=b.actor_id AND status='running' AND lease_until<=clock_timestamp() AND id<>jid;
  IF EXISTS(SELECT FROM public.hq_jobs WHERE organization_id=b.organization_id AND mandate_id=b.mandate_id AND status='running' AND id<>jid) THEN RETURN NULL; END IF;
  c=jsonb_build_object('id',jid,'owner',b.mandate_id,'objective','Draft a source-linked HQ readiness brief','charter_version','cloud-pilot-1',
    'trigger',jsonb_build_object('type','bounded-cloud-pilot','reference',p.funding_reference,'dedupe_key',jid),
    'inputs_context',p.inputs,'allowed_tools',jsonb_build_array('one-fixed-model-call','submit-draft'),
    'allowed_memory',jsonb_build_object('read',jsonb_build_array('approved-package-snapshot'),'write',jsonb_build_array('cloud-drafts')),
    'expected_output',jsonb_build_object('schema_ref','cloud-brief-v1','description','Draft only; independent review required'),
    'acceptance_criteria',jsonb_build_array('Sources match approved snapshot','No unsupported progress claims','No consequential action'),
    'reviewer','Supervisor and Auditor','deadline_sla',jsonb_build_object('active_minutes',4,'review_within_hours',24),
    'approval',jsonb_build_object('level','Green','funding_reference',p.funding_reference),'dependencies','[]'::jsonb,
    'limits',jsonb_build_object('max_tool_calls',1,'max_revisions',1,'model',p.model),
    'cost',jsonb_build_object('new_spend_limit',0.10,'reserved_per_call',0.05,'authority',p.funding_reference));
  INSERT INTO public.hq_jobs(organization_id,id,mandate_id,objective,contract,approval_level,max_attempts)
    VALUES(b.organization_id,jid,b.mandate_id,'Draft a source-linked HQ readiness brief',c,'Green',2) ON CONFLICT DO NOTHING;
  SELECT * INTO j FROM public.hq_jobs WHERE organization_id=b.organization_id AND id=jid FOR UPDATE;
  IF j.source_system<>'hq' OR j.approval_level<>'Green' OR j.mandate_id<>b.mandate_id OR j.max_attempts<>2 OR j.contract IS DISTINCT FROM c THEN RAISE EXCEPTION 'Pilot contract mismatch'; END IF;
  IF j.status NOT IN ('ready','running') OR (j.status='running' AND j.lease_until>clock_timestamp()) THEN RETURN NULL; END IF;
  SELECT min(started_at) INTO first_at FROM public.hq_runs WHERE organization_id=b.organization_id AND job_id=jid;
  IF j.attempts>=2 OR first_at+interval '240 seconds'<=clock_timestamp() THEN
    UPDATE public.hq_jobs SET status='failed',lease_token=NULL,lease_until=NULL,result='{"summary":"Pilot attempt or elapsed-time limit reached"}',updated_at=clock_timestamp() WHERE organization_id=b.organization_id AND id=jid;
    RETURN NULL;
  END IF;
  rid=gen_random_uuid()::text; tok=gen_random_uuid()::text;
  until_at=least(clock_timestamp()+interval '120 seconds',coalesce(first_at,clock_timestamp())+interval '240 seconds');
  UPDATE public.hq_jobs SET status='running',attempts=attempts+1,lease_token=tok,lease_until=until_at,worker_id=b.actor_id,updated_at=clock_timestamp() WHERE organization_id=b.organization_id AND id=jid RETURNING * INTO j;
  INSERT INTO public.hq_runs(organization_id,id,job_id,mandate_id,attempt,worker_id,lease_token,lease_until,status)
    VALUES(b.organization_id,rid,jid,b.mandate_id,j.attempts,b.actor_id,tok,until_at,'running');
  INSERT INTO public.hq_events(organization_id,id,mandate_id,job_id,actor_id,event_type,evidence)
    VALUES(b.organization_id,gen_random_uuid()::text,b.mandate_id,jid,b.actor_id,'cloud_job_claimed',jsonb_build_object('run_id',rid,'attempt',j.attempts));
  RETURN jsonb_build_object('run_id',rid,'job_id',jid,'lease_token',tok,'lease_until',until_at,
    'lease_remaining_ms',floor(extract(epoch FROM until_at-clock_timestamp())*1000),'model',p.model,'inputs',j.contract->'inputs_context');
END $$;

CREATE FUNCTION hq_cloud_reserve(rid text,tok text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE b public.hq_cloud_bindings; p public.hq_cloud_policies; spent bigint;
BEGIN
  b=public.hq_cloud_identity('runner');
  SELECT * INTO p FROM public.hq_cloud_policies WHERE login_name=b.login_name FOR UPDATE;
  IF p.login_name IS NULL OR NOT p.enabled OR p.funding_reference IS NULL OR p.pricing_valid_until<=clock_timestamp() THEN RAISE EXCEPTION 'Paid pilot disabled'; END IF;
  IF NOT EXISTS(SELECT FROM public.hq_runs r JOIN public.hq_jobs j ON (j.organization_id,j.id)=(r.organization_id,r.job_id)
      WHERE r.organization_id=b.organization_id AND r.id=rid AND r.worker_id=b.actor_id AND r.mandate_id=b.mandate_id AND r.lease_token=tok
      AND j.status='running' AND j.lease_token=tok AND j.lease_until>clock_timestamp() AND r.status='running') THEN RAISE EXCEPTION 'Active cloud lease required'; END IF;
  -- Locking the policy serializes reservations across concurrent attempts.
  SELECT coalesce(sum(reserved_microusd),0) INTO spent FROM public.hq_cloud_charges WHERE login_name=b.login_name AND period=date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC')::date;
  IF spent+50000>p.monthly_limit_microusd THEN RAISE EXCEPTION 'Monthly pilot budget exhausted'; END IF;
  INSERT INTO public.hq_cloud_charges(organization_id,run_id,login_name) VALUES(b.organization_id,rid,b.login_name);
  -- Duplicate reservations fail. Never repeat a possibly billable API call.
  RETURN true;
END $$;

CREATE FUNCTION hq_cloud_submit(rid text,tok text,draft jsonb,usage jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE b public.hq_cloud_bindings; p public.hq_cloud_policies; r public.hq_runs; j public.hq_jobs;
  observation jsonb; ref text; h text; submission jsonb; in_tokens bigint; out_tokens bigint; actual bigint;
BEGIN
  b=public.hq_cloud_identity('runner');
  SELECT * INTO p FROM public.hq_cloud_policies WHERE login_name=b.login_name FOR UPDATE;
  IF p.login_name IS NULL OR NOT p.enabled THEN RAISE EXCEPTION 'Pilot paused'; END IF;
  SELECT * INTO r FROM public.hq_runs WHERE organization_id=b.organization_id AND id=rid AND worker_id=b.actor_id AND mandate_id=b.mandate_id;
  SELECT * INTO j FROM public.hq_jobs WHERE organization_id=b.organization_id AND id=r.job_id FOR UPDATE;
  IF r.id IS NULL OR r.status<>'running' OR r.lease_token IS DISTINCT FROM tok OR j.status<>'running' OR j.lease_token IS DISTINCT FROM tok OR j.lease_until<=clock_timestamp() THEN RAISE EXCEPTION 'Active cloud lease required'; END IF;
  IF NOT EXISTS(SELECT FROM public.hq_cloud_charges WHERE organization_id=b.organization_id AND run_id=rid AND settled_at IS NULL) THEN RAISE EXCEPTION 'Unsettled reservation required'; END IF;
  IF jsonb_typeof(draft) IS DISTINCT FROM 'object' OR octet_length(draft::text)>32000
    OR jsonb_typeof(draft->'summary') IS DISTINCT FROM 'string' OR length(draft->>'summary') NOT BETWEEN 1 AND 4000
    OR jsonb_typeof(draft->'observations') IS DISTINCT FROM 'array' OR jsonb_array_length(draft->'observations') NOT BETWEEN 1 AND 12
    OR jsonb_typeof(draft->'questions') IS DISTINCT FROM 'array' OR jsonb_array_length(draft->'questions')>8 THEN RAISE EXCEPTION 'Invalid brief'; END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(draft))<>3 OR EXISTS(SELECT FROM jsonb_array_elements(draft->'questions') q WHERE jsonb_typeof(q)<>'string' OR length(q#>>'{}')>1000) THEN RAISE EXCEPTION 'Invalid brief fields'; END IF;
  FOR observation IN SELECT value FROM jsonb_array_elements(draft->'observations') LOOP
    IF jsonb_typeof(observation->'statement') IS DISTINCT FROM 'string' OR length(observation->>'statement') NOT BETWEEN 1 AND 2000
      OR jsonb_typeof(observation->'source_refs') IS DISTINCT FROM 'array' OR jsonb_array_length(observation->'source_refs') NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Source-linked observation required'; END IF;
    IF (SELECT count(*) FROM jsonb_object_keys(observation))<>2 THEN RAISE EXCEPTION 'Invalid observation fields'; END IF;
    FOR ref IN SELECT value FROM jsonb_array_elements_text(observation->'source_refs') LOOP
      IF NOT EXISTS(SELECT FROM jsonb_array_elements(j.contract->'inputs_context') source WHERE source->>'ref'=ref) THEN RAISE EXCEPTION 'Unapproved source reference'; END IF;
    END LOOP;
  END LOOP;
  in_tokens=(usage->>'input_tokens')::bigint; out_tokens=(usage->>'output_tokens')::bigint;
  IF in_tokens IS NULL OR out_tokens IS NULL OR in_tokens NOT BETWEEN 0 AND 100000 OR out_tokens NOT BETWEEN 0 AND 2048 OR nullif(usage->>'response_id','') IS NULL THEN RAISE EXCEPTION 'Bounded provider usage required'; END IF;
  -- Conservative: no cache discounts; 1.25x input rate covers cache writes.
  actual=ceil(in_tokens*0.25+out_tokens*1.2)::bigint;
  IF actual>50000 THEN RAISE EXCEPTION 'Usage exceeds reserved maximum'; END IF;
  INSERT INTO public.hq_cloud_artifacts(organization_id,run_id,job_id,body) VALUES(b.organization_id,rid,j.id,draft) RETURNING content_hash INTO h;
  submission=jsonb_build_object('summary',draft->>'summary','artifactRef','postgres:hq_cloud_artifacts/'||rid,'artifactHash',h,'reviewStatus','pending');
  UPDATE public.hq_cloud_charges SET estimated_microusd=actual,input_tokens=in_tokens,output_tokens=out_tokens,provider_response_id=usage->>'response_id',settled_at=clock_timestamp() WHERE organization_id=b.organization_id AND run_id=rid;
  PERFORM set_config('app.hq_lease_token',tok,true);
  UPDATE public.hq_runs SET status='review',finished_at=clock_timestamp(),result=submission,cost_usd=NULL,input_tokens=in_tokens,output_tokens=out_tokens WHERE organization_id=b.organization_id AND id=rid;
  UPDATE public.hq_jobs SET status='review',result=submission,lease_token=NULL,lease_until=NULL,updated_at=clock_timestamp() WHERE organization_id=b.organization_id AND id=j.id;
  INSERT INTO public.hq_events(organization_id,id,mandate_id,job_id,actor_id,event_type,evidence)
    VALUES(b.organization_id,gen_random_uuid()::text,b.mandate_id,j.id,b.actor_id,'cloud_draft_submitted',jsonb_build_object('run_id',rid,'artifact_hash',h,'review_status','pending'));
  RETURN submission;
END $$;

CREATE FUNCTION hq_cloud_snapshot() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE b public.hq_cloud_bindings; result jsonb;
BEGIN
  b=public.hq_cloud_identity('reader');
  SELECT jsonb_build_object('checked_at',clock_timestamp(),'workers',coalesce((SELECT jsonb_agg(jsonb_build_object(
    'actor',wb.actor_id,'mandate',wb.mandate_id,'enabled',wb.enabled AND p.enabled AND p.funding_reference IS NOT NULL AND p.monthly_limit_microusd>=50000 AND p.pricing_valid_until>clock_timestamp(),
    'monthly_limit_microusd',p.monthly_limit_microusd,'reserved_microusd',(SELECT coalesce(sum(reserved_microusd),0) FROM public.hq_cloud_charges WHERE login_name=wb.login_name AND period=date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC')::date),
    'pricing_valid_until',p.pricing_valid_until)) FROM public.hq_cloud_bindings wb JOIN public.hq_cloud_policies p USING(login_name) WHERE wb.organization_id=b.organization_id),'[]'::jsonb),
    'runs',coalesce((SELECT jsonb_agg(row) FROM (SELECT r.id,r.job_id,r.attempt,
      CASE WHEN r.status='running' AND (r.lease_until<=clock_timestamp() OR j.lease_token IS DISTINCT FROM r.lease_token) THEN 'expired' ELSE r.status END AS status,
      r.started_at,r.finished_at,c.estimated_microusd,c.reserved_microusd,c.settled_at IS NULL AND c.run_id IS NOT NULL AS cost_uncertain,
      a.body AS draft,a.content_hash FROM public.hq_runs r JOIN public.hq_jobs j ON (j.organization_id,j.id)=(r.organization_id,r.job_id)
      LEFT JOIN public.hq_cloud_artifacts a ON (a.organization_id,a.run_id)=(r.organization_id,r.id)
      LEFT JOIN public.hq_cloud_charges c ON (c.organization_id,c.run_id)=(r.organization_id,r.id)
      WHERE r.organization_id=b.organization_id AND r.mandate_id=b.mandate_id AND j.contract->>'charter_version'='cloud-pilot-1'
      ORDER BY r.started_at DESC LIMIT 20) row),'[]'::jsonb)) INTO result;
  RETURN result;
END $$;

REVOKE ALL ON FUNCTION hq_cloud_identity(text),hq_cloud_claim(),hq_cloud_reserve(text,text),hq_cloud_submit(text,text,jsonb,jsonb),hq_cloud_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION hq_cloud_claim(),hq_cloud_reserve(text,text),hq_cloud_submit(text,text,jsonb,jsonb) TO traceli_hq_cloud_runner;
GRANT EXECUTE ON FUNCTION hq_cloud_snapshot() TO traceli_hq_cloud_reader;

COMMIT;
