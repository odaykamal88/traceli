BEGIN;

DO $$ BEGIN
  IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='traceli_hq_source_ingestor') THEN
    CREATE ROLE traceli_hq_source_ingestor NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
  IF EXISTS(SELECT FROM pg_roles WHERE rolname='traceli_hq_source_ingestor' AND (rolcanlogin OR rolinherit OR rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls))
    OR EXISTS(SELECT FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname='traceli_hq_source_ingestor')) THEN RAISE EXCEPTION 'Unsafe ingestor role'; END IF;
END $$;
GRANT USAGE ON SCHEMA public TO traceli_hq_source_ingestor;
CREATE TABLE hq_operating_ingestors (
  login_name name PRIMARY KEY, organization_id text NOT NULL REFERENCES organizations(id), enabled boolean NOT NULL DEFAULT false,
  source_id text NOT NULL CHECK(source_id='appgprj_6a94833e5918819180fb17a031f5711e')
);
CREATE TABLE hq_operating_sources (
  organization_id text PRIMARY KEY REFERENCES organizations(id), source_id text NOT NULL,
  captured_at timestamptz NOT NULL, received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  records jsonb NOT NULL CHECK(octet_length(records::text)<=200000), content_hash text NOT NULL
);
CREATE TABLE hq_operating_checks (
  organization_id text NOT NULL REFERENCES organizations(id), id text NOT NULL DEFAULT gen_random_uuid()::text,
  checked_at timestamptz NOT NULL DEFAULT clock_timestamp(), content_hash text, status text NOT NULL,
  model_eligible boolean NOT NULL DEFAULT false, PRIMARY KEY(organization_id,id)
);
CREATE INDEX hq_operating_checks_date ON hq_operating_checks(organization_id,checked_at DESC);
REVOKE ALL ON hq_operating_ingestors,hq_operating_sources,hq_operating_checks FROM PUBLIC,traceli_hq_source_ingestor,traceli_hq_cloud_runner,traceli_hq_cloud_reader;

CREATE FUNCTION hq_operating_ingest(packet jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE b public.hq_operating_ingestors; prior public.hq_operating_sources; r jsonb; section text; row jsonb; allowed text[]; cap integer;
  captured timestamptz; hash text; changed boolean;
BEGIN
  SELECT * INTO b FROM public.hq_operating_ingestors WHERE login_name=session_user AND enabled;
  IF b.login_name IS NULL OR NOT pg_has_role(session_user,'traceli_hq_source_ingestor','MEMBER')
    OR EXISTS(SELECT FROM pg_roles WHERE rolname=session_user AND (rolsuper OR rolinherit OR rolcreatedb OR rolcreaterole OR rolbypassrls OR NOT rolcanlogin))
    OR EXISTS(SELECT FROM pg_auth_members m JOIN pg_roles p ON p.oid=m.roleid WHERE m.member=(SELECT oid FROM pg_roles WHERE rolname=session_user) AND (p.rolname<>'traceli_hq_source_ingestor' OR m.admin_option))
    OR has_schema_privilege(session_user,'public','CREATE') OR has_schema_privilege('traceli_hq_source_ingestor','public','CREATE')
    OR EXISTS(SELECT FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname='traceli_hq_source_ingestor')) THEN RAISE EXCEPTION 'Source identity denied'; END IF;
  IF jsonb_typeof(packet)<>'object' OR packet->>'source_id' IS DISTINCT FROM b.source_id OR packet->>'schema_version' IS DISTINCT FROM '1'
    OR EXISTS(SELECT FROM jsonb_object_keys(packet) k WHERE k NOT IN ('source_id','schema_version','captured_at','records')) THEN RAISE EXCEPTION 'Invalid source packet'; END IF;
  captured=(packet->>'captured_at')::timestamptz;
  IF captured IS NULL OR captured>clock_timestamp()+interval '1 minute' OR captured<clock_timestamp()-interval '5 minutes' THEN RAISE EXCEPTION 'Expired source packet'; END IF;
  r=packet->'records';
  IF jsonb_typeof(r) IS DISTINCT FROM 'object' OR octet_length(r::text)>200000
    OR NOT r ?& ARRAY['tasks','metrics','reviews','latest','receipt_count']
    OR EXISTS(SELECT FROM jsonb_object_keys(r) k WHERE k NOT IN ('tasks','metrics','reviews','latest','receipt_count'))
    OR jsonb_typeof(r->'receipt_count') IS DISTINCT FROM 'number' OR (r->>'receipt_count')::numeric NOT BETWEEN 0 AND 1000000 THEN RAISE EXCEPTION 'Invalid minimized records'; END IF;
  FOREACH section IN ARRAY ARRAY['tasks','metrics','reviews','latest'] LOOP
    cap=CASE WHEN section IN ('tasks','reviews') THEN 500 ELSE 100 END;
    IF jsonb_typeof(r->section) IS DISTINCT FROM 'array' OR jsonb_array_length(r->section)>cap THEN RAISE EXCEPTION 'Record bound exceeded'; END IF;
    allowed=CASE section WHEN 'tasks' THEN ARRAY['id','title','owner','lane','status','due','week','updated_at']
      WHEN 'metrics' THEN ARRAY['id','label','current','target','sort_order']
      WHEN 'reviews' THEN ARRAY['id','task_id','title','status','created_at','reviewed_at']
      ELSE ARRAY['id','job_id','at','outcome'] END;
    FOR row IN SELECT value FROM jsonb_array_elements(r->section) LOOP
      IF jsonb_typeof(row)<>'object' OR NOT row ?& allowed OR EXISTS(SELECT FROM jsonb_object_keys(row) k WHERE NOT k=ANY(allowed)) THEN RAISE EXCEPTION 'Non-metadata field rejected'; END IF;
      IF octet_length(row::text)>3000 THEN RAISE EXCEPTION 'Record too large'; END IF;
    END LOOP;
  END LOOP;
  -- Serialize source updates without trusting a caller-selected tenant or source.
  PERFORM pg_advisory_xact_lock(hashtextextended(b.organization_id||':operating-feed',0));
  SELECT * INTO prior FROM public.hq_operating_sources WHERE organization_id=b.organization_id FOR UPDATE;
  IF prior.captured_at>captured THEN RETURN jsonb_build_object('status','older_packet_ignored'); END IF;
  hash=encode(sha256(convert_to(r::text,'UTF8')),'hex');
  IF prior.captured_at=captured AND prior.content_hash<>hash THEN RAISE EXCEPTION 'Conflicting capture replay'; END IF;
  changed=prior.content_hash IS DISTINCT FROM hash;
  INSERT INTO public.hq_operating_sources(organization_id,source_id,captured_at,records,content_hash)
    VALUES(b.organization_id,b.source_id,captured,r,hash)
    ON CONFLICT(organization_id) DO UPDATE SET captured_at=excluded.captured_at,received_at=clock_timestamp(),records=excluded.records,content_hash=excluded.content_hash;
  RETURN jsonb_build_object('status',CASE WHEN changed THEN 'changed' ELSE 'unchanged' END,'content_hash',hash);
END $$;
REVOKE ALL ON FUNCTION hq_operating_ingest(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION hq_operating_ingest(jsonb) TO traceli_hq_source_ingestor;

CREATE FUNCTION hq_operating_tick() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE b public.hq_cloud_bindings; p public.hq_cloud_policies; s public.hq_operating_sources;
  reason text; eligible boolean=false; prepared_inputs jsonb; source_ref text; summary jsonb;
BEGIN
  b=public.hq_cloud_identity('runner');
  SELECT * INTO p FROM public.hq_cloud_policies WHERE login_name=b.login_name FOR UPDATE;
  SELECT * INTO s FROM public.hq_operating_sources WHERE organization_id=b.organization_id FOR UPDATE;
  IF s.organization_id IS NULL THEN reason='source_missing';
  ELSIF s.captured_at<clock_timestamp()-interval '24 hours' THEN reason='source_stale';
  ELSIF NOT coalesce(p.enabled,false) OR p.funding_reference IS NULL OR p.pricing_valid_until<=clock_timestamp() THEN reason='model_policy_paused';
  ELSIF EXISTS(SELECT FROM public.hq_jobs WHERE organization_id=b.organization_id AND mandate_id=b.mandate_id AND contract->>'charter_version'='cloud-pilot-1' AND status='review') THEN reason='review_pending';
  ELSIF EXISTS(SELECT FROM public.hq_jobs WHERE organization_id=b.organization_id AND mandate_id=b.mandate_id AND contract->>'charter_version'='cloud-pilot-1' AND contract->'inputs_context' @> jsonb_build_array(jsonb_build_object('ref','ops-sha256:'||s.content_hash)) AND status='accepted') THEN reason='unchanged';
  ELSIF (SELECT coalesce(sum(reserved_microusd),0) FROM public.hq_cloud_charges WHERE login_name=b.login_name AND period=date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC')::date)+50000>p.monthly_limit_microusd THEN reason='budget_exhausted';
  ELSIF EXISTS(SELECT FROM public.hq_jobs WHERE organization_id=b.organization_id AND id='cloud-brief-'||to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYYMMDD')) THEN reason='daily_job_exists';
  ELSIF EXISTS(SELECT FROM public.hq_jobs WHERE organization_id=b.organization_id AND mandate_id=b.mandate_id AND status='running') THEN reason='job_running';
  ELSE
    -- Source field selection is fixed. Free-form titles, notes, contact records,
    -- review packets, source instructions and model-generated memory are excluded.
    source_ref='ops-sha256:'||s.content_hash;
    summary=jsonb_build_object('source_captured_at',s.captured_at,'source_id',s.source_id,
      'task_count',jsonb_array_length(s.records->'tasks'),
      'task_status_counts',(SELECT jsonb_object_agg(status,n) FROM (SELECT value->>'status' status,count(*) n FROM jsonb_array_elements(s.records->'tasks') GROUP BY 1) t),
      'metrics',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',value->>'id','current',value->'current','target',value->'target')),'[]'::jsonb) FROM jsonb_array_elements(s.records->'metrics')),
      'pending_review_task_ids',(SELECT coalesce(jsonb_agg(value->'task_id'),'[]'::jsonb) FROM jsonb_array_elements(s.records->'reviews') WHERE value->>'status'='pending'),
      'latest_saved_receipts',s.records->'latest',
      'limits','Counters are recorded evidence, not independently verified sends, replies, payments or causality. Receipts are historical outcomes, not current job health. Analytics are not connected. This signed source mirror is captured on source app reads/changes; this worker does not poll the private source directly.');
    prepared_inputs=jsonb_build_array(jsonb_build_object('ref',source_ref,'text',summary::text));
    IF octet_length(prepared_inputs::text)>16000 THEN reason='input_bound_exceeded';
    ELSE
      UPDATE public.hq_cloud_policies policy SET inputs=prepared_inputs WHERE policy.login_name=b.login_name;
      reason='changed'; eligible=true;
    END IF;
  END IF;
  INSERT INTO public.hq_operating_checks(organization_id,content_hash,status,model_eligible) VALUES(b.organization_id,s.content_hash,reason,eligible);
  RETURN jsonb_build_object('status',reason,'model_eligible',eligible,'content_hash',s.content_hash);
END $$;
REVOKE ALL ON FUNCTION hq_operating_tick() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION hq_operating_tick() TO traceli_hq_cloud_runner;

CREATE FUNCTION hq_operating_snapshot() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE b public.hq_cloud_bindings;
BEGIN
  b=public.hq_cloud_identity('reader');
  RETURN jsonb_build_object('source',(SELECT jsonb_build_object('captured_at',captured_at,'received_at',received_at,'content_hash',content_hash,'records',records) FROM public.hq_operating_sources WHERE organization_id=b.organization_id),
    'checks',coalesce((SELECT jsonb_agg(t) FROM (SELECT id,checked_at,status,content_hash,model_eligible FROM public.hq_operating_checks WHERE organization_id=b.organization_id ORDER BY checked_at DESC LIMIT 30) t),'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION hq_operating_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION hq_operating_snapshot() TO traceli_hq_cloud_reader;
COMMIT;
