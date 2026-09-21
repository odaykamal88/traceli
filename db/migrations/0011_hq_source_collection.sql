BEGIN;

-- Private public-source custody. No procurement or customer data, no provider.
CREATE TABLE hq_source_authorizations (
  organization_id text NOT NULL REFERENCES organizations(id),
  job_id text NOT NULL,
  login_name name NOT NULL REFERENCES hq_cloud_bindings(login_name),
  task_id integer NOT NULL CHECK(task_id IN (49,50)),
  source_claim_id uuid NOT NULL,
  authorization_ref text NOT NULL CHECK(length(authorization_ref) BETWEEN 1 AND 500),
  authorized_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  manifest jsonb NOT NULL CHECK(jsonb_typeof(manifest)='array' AND jsonb_array_length(manifest) BETWEEN 1 AND 4 AND octet_length(manifest::text)<12000),
  manifest_hash text NOT NULL CHECK(manifest_hash ~ '^[a-f0-9]{64}$'),
  PRIMARY KEY(organization_id,job_id),
  FOREIGN KEY(organization_id,job_id) REFERENCES hq_jobs(organization_id,id),
  CHECK(expires_at>authorized_at AND expires_at<=authorized_at+interval '72 hours')
);
CREATE TABLE hq_source_evidence (
  organization_id text NOT NULL,
  job_id text NOT NULL,
  run_id text NOT NULL,
  source_id text NOT NULL,
  captured_at timestamptz NOT NULL,
  status text NOT NULL CHECK(status IN ('retained','http_error','network_error','content_type','content_encoding','too_large','digest_mismatch','not_pdf','deadline')),
  bytes bytea,
  byte_hash text,
  PRIMARY KEY(organization_id,job_id,source_id),
  FOREIGN KEY(organization_id,job_id) REFERENCES hq_source_authorizations(organization_id,job_id),
  FOREIGN KEY(organization_id,run_id) REFERENCES hq_runs(organization_id,id),
  CHECK(((status='retained' AND bytes IS NOT NULL AND byte_hash IS NOT NULL AND octet_length(bytes) BETWEEN 5 AND 4194304 AND byte_hash=encode(sha256(bytes),'hex')) OR (status<>'retained' AND bytes IS NULL AND byte_hash IS NULL)) IS TRUE)
);
REVOKE ALL ON hq_source_authorizations,hq_source_evidence FROM PUBLIC,traceli_hq_cloud_runner,traceli_hq_cloud_reader;
CREATE TRIGGER hq_source_evidence_immutable BEFORE UPDATE OR DELETE ON hq_source_evidence FOR EACH ROW EXECUTE FUNCTION traceli_hq_append_only();

CREATE FUNCTION hq_source_authorization_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s jsonb;
BEGIN
  IF TG_OP='UPDATE' AND (NEW.organization_id,NEW.job_id,NEW.login_name,NEW.task_id,NEW.source_claim_id,NEW.authorization_ref,NEW.authorized_at,NEW.expires_at,NEW.manifest) IS DISTINCT FROM (OLD.organization_id,OLD.job_id,OLD.login_name,OLD.task_id,OLD.source_claim_id,OLD.authorization_ref,OLD.authorized_at,OLD.expires_at,OLD.manifest) THEN RAISE EXCEPTION 'Source authorization is version-bound; create a new job'; END IF;
  IF NOT EXISTS(SELECT FROM hq_cloud_bindings WHERE login_name=NEW.login_name AND organization_id=NEW.organization_id AND kind='runner') THEN RAISE EXCEPTION 'Source authorization identity mismatch'; END IF;
  IF NOT EXISTS(SELECT FROM hq_jobs WHERE organization_id=NEW.organization_id AND id=NEW.job_id AND mandate_id='institutional-memory' AND contract->>'charter_version'='source-collection-1' AND contract->>'source_task_id'=NEW.task_id::text AND source_system='hq') THEN RAISE EXCEPTION 'Source job contract mismatch'; END IF;
  IF (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(NEW.manifest))<>jsonb_array_length(NEW.manifest) THEN RAISE EXCEPTION 'Duplicate source'; END IF;
  FOR s IN SELECT value FROM jsonb_array_elements(NEW.manifest) LOOP
    IF jsonb_typeof(s)<>'object' OR (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(s) key)<>ARRAY['id','sha256','title','url'] OR jsonb_typeof(s->'id')<>'string' OR s->>'id' !~ '^[a-z0-9-]{1,80}$' OR jsonb_typeof(s->'sha256')<>'string' OR s->>'sha256' !~ '^[a-f0-9]{64}$' OR jsonb_typeof(s->'url')<>'string' OR length(s->>'url') NOT BETWEEN 12 AND 2000 OR s->>'url' !~ '^https://' OR jsonb_typeof(s->'title')<>'string' OR length(s->>'title') NOT BETWEEN 1 AND 300 THEN RAISE EXCEPTION 'Invalid source manifest'; END IF;
  END LOOP;
  NEW.manifest_hash=encode(sha256(convert_to(NEW.manifest::text,'UTF8')),'hex');
  RETURN NEW;
END $$;
CREATE TRIGGER hq_source_authorization_guard BEFORE INSERT OR UPDATE ON hq_source_authorizations FOR EACH ROW EXECUTE FUNCTION hq_source_authorization_guard();

CREATE FUNCTION hq_source_claim() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp SET lock_timeout='2s' AS $$
DECLARE b hq_cloud_bindings; a hq_source_authorizations; j hq_jobs; rid text; tok text; expiry timestamptz;
BEGIN
  b=public.hq_cloud_identity('runner');
  -- One runner/mandate, serialize even when two cron invocations overlap.
  PERFORM 1 FROM public.hq_cloud_bindings WHERE login_name=b.login_name FOR UPDATE;
  b=public.hq_cloud_identity('runner');
  PERFORM 1 FROM public.hq_cloud_policies WHERE login_name=b.login_name FOR SHARE;
  IF NOT EXISTS(SELECT FROM public.hq_cloud_policies WHERE login_name=b.login_name AND enabled AND funding_reference IS NOT NULL) THEN RETURN NULL; END IF;
  PERFORM 1 FROM public.hq_source_authorizations WHERE organization_id=b.organization_id AND login_name=b.login_name ORDER BY job_id FOR UPDATE;
  -- Terminalize only this runner's revoked/expired/exhausted source jobs.
  -- Preserve old attempt rows; the snapshot identifies those leases as expired.
  UPDATE public.hq_jobs j0 SET status='failed',lease_token=NULL,lease_until=NULL,updated_at=clock_timestamp(),result=jsonb_build_object('summary','Source authorization inactive or bounded attempts exhausted; Supervisor review required')
    FROM public.hq_source_authorizations a0 WHERE (a0.organization_id,a0.job_id)=(j0.organization_id,j0.id)
      AND j0.organization_id=b.organization_id AND a0.login_name=b.login_name AND j0.status='running'
      AND (NOT a0.enabled OR a0.expires_at<=clock_timestamp() OR (j0.lease_until<=clock_timestamp() AND (j0.attempts>=j0.max_attempts OR a0.expires_at<=clock_timestamp()+interval '125 seconds')));
  SELECT j0.* INTO j FROM public.hq_jobs j0 JOIN public.hq_source_authorizations a0 ON (a0.organization_id,a0.job_id)=(j0.organization_id,j0.id)
    WHERE j0.organization_id=b.organization_id AND j0.mandate_id=b.mandate_id AND a0.login_name=b.login_name AND a0.enabled AND a0.expires_at>clock_timestamp()+interval '125 seconds'
      AND j0.contract->>'charter_version'='source-collection-1' AND j0.attempts<j0.max_attempts AND j0.max_attempts<=2
      AND (j0.status='ready' OR (j0.status='running' AND j0.lease_until<=clock_timestamp()))
    ORDER BY j0.created_at,j0.id LIMIT 1 FOR UPDATE OF j0,a0;
  IF j.id IS NULL THEN RETURN NULL; END IF;
  -- Do not bypass another job. Expired attempts remain immutable and the HQ
  -- snapshot renders them as expired. A new run gets a distinct lease.
  IF EXISTS(SELECT FROM public.hq_jobs WHERE organization_id=b.organization_id AND mandate_id=b.mandate_id AND status='running' AND id<>j.id) THEN RETURN NULL; END IF;
  SELECT * INTO a FROM public.hq_source_authorizations WHERE organization_id=b.organization_id AND job_id=j.id;
  rid=gen_random_uuid()::text; tok=gen_random_uuid()::text; expiry=clock_timestamp()+interval '120 seconds';
  UPDATE public.hq_jobs SET status='running',attempts=attempts+1,worker_id=b.actor_id,lease_token=tok,lease_until=expiry,updated_at=clock_timestamp() WHERE organization_id=b.organization_id AND id=j.id;
  INSERT INTO public.hq_runs(organization_id,id,job_id,mandate_id,attempt,worker_id,lease_token,lease_until,status)
    VALUES(b.organization_id,rid,j.id,b.mandate_id,j.attempts+1,b.actor_id,tok,expiry,'running');
  RETURN jsonb_build_object('run_id',rid,'lease_token',tok,'manifest_hash',a.manifest_hash,'sources',a.manifest,'lease_remaining_ms',floor(extract(epoch FROM expiry-clock_timestamp())*1000));
END $$;

CREATE FUNCTION hq_source_submit(rid text,tok text,manifest_digest text,results jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp SET lock_timeout='2s' AS $$
DECLARE b hq_cloud_bindings; a hq_source_authorizations; j hq_jobs; r hq_runs; s jsonb; entry jsonb; payload bytea; digest text; observed timestamptz; body jsonb; observations jsonb='[]'; h text; submission jsonb; retained integer=0;
BEGIN
  b=public.hq_cloud_identity('runner');
  PERFORM 1 FROM public.hq_cloud_bindings WHERE login_name=b.login_name FOR UPDATE;
  b=public.hq_cloud_identity('runner');
  PERFORM 1 FROM public.hq_cloud_policies WHERE login_name=b.login_name FOR SHARE;
  SELECT * INTO r FROM public.hq_runs WHERE organization_id=b.organization_id AND id=rid AND worker_id=b.actor_id;
  IF r.id IS NULL OR r.lease_token IS DISTINCT FROM tok THEN RAISE EXCEPTION 'Source run denied'; END IF;
  SELECT * INTO j FROM public.hq_jobs WHERE organization_id=b.organization_id AND id=r.job_id FOR UPDATE;
  SELECT * INTO a FROM public.hq_source_authorizations WHERE organization_id=b.organization_id AND job_id=j.id AND login_name=b.login_name FOR SHARE;
  IF a.job_id IS NULL OR manifest_digest IS DISTINCT FROM a.manifest_hash THEN RAISE EXCEPTION 'Source manifest mismatch'; END IF;
  IF NOT a.enabled OR a.expires_at<=clock_timestamp() OR NOT EXISTS(SELECT FROM public.hq_cloud_policies WHERE login_name=b.login_name AND enabled AND funding_reference IS NOT NULL) THEN RAISE EXCEPTION 'Source authorization inactive'; END IF;
  -- Lost-response replay returns saved bytes/artifact identity, never overwrites.
  IF r.status='review' AND j.status IN ('review','accepted') AND j.result IS NOT NULL THEN RETURN j.result||jsonb_build_object('status','already_submitted'); END IF;
  IF j.status<>'running' OR r.status<>'running' OR j.lease_token IS DISTINCT FROM tok OR j.lease_until<=clock_timestamp() OR r.lease_until<=clock_timestamp() OR r.attempt<>j.attempts THEN RAISE EXCEPTION 'Source lease denied'; END IF;
  IF results IS NULL OR jsonb_typeof(results)<>'array' OR jsonb_array_length(results)<>jsonb_array_length(a.manifest) OR octet_length(results::text)>24000000 OR (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(results))<>jsonb_array_length(results) THEN RAISE EXCEPTION 'Invalid source result set'; END IF;
  FOR s IN SELECT value FROM jsonb_array_elements(a.manifest) LOOP
    SELECT value INTO entry FROM jsonb_array_elements(results) WHERE value->>'id'=s->>'id';
    IF entry IS NULL OR jsonb_typeof(entry)<>'object' OR jsonb_typeof(entry->'captured_at')<>'string' OR jsonb_typeof(entry->'status')<>'string' OR entry->>'status' NOT IN ('retained','http_error','network_error','content_type','content_encoding','too_large','digest_mismatch','not_pdf','deadline') THEN RAISE EXCEPTION 'Invalid source result'; END IF;
    observed=(entry->>'captured_at')::timestamptz;
    IF observed<r.started_at-interval '1 minute' OR observed>clock_timestamp()+interval '1 minute' THEN RAISE EXCEPTION 'Source observation time invalid'; END IF;
    payload=NULL; digest=NULL;
    IF entry->>'status'='retained' THEN
      IF (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(entry) key)<>ARRAY['bytes_base64','captured_at','id','status'] OR jsonb_typeof(entry->'bytes_base64')<>'string' THEN RAISE EXCEPTION 'Invalid retained payload'; END IF;
      payload=decode(entry->>'bytes_base64','base64'); digest=encode(sha256(payload),'hex');
      IF octet_length(payload) NOT BETWEEN 5 AND 4194304 OR substring(payload FROM 1 FOR 5)<>convert_to('%PDF-','UTF8') OR digest<>s->>'sha256' THEN RAISE EXCEPTION 'Source bytes do not match approved digest'; END IF;
      retained=retained+1;
    ELSIF (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(entry) key)<>ARRAY['captured_at','id','status'] THEN RAISE EXCEPTION 'Failure cannot contain bytes or extra data'; END IF;
    INSERT INTO public.hq_source_evidence(organization_id,job_id,run_id,source_id,captured_at,status,bytes,byte_hash) VALUES(b.organization_id,j.id,rid,s->>'id',observed,entry->>'status',payload,digest);
    observations=observations||jsonb_build_array(jsonb_build_object('statement',(s->>'title')||': '||(entry->>'status')||CASE WHEN payload IS NOT NULL THEN '; retained '||octet_length(payload)||' PDF bytes; SHA-256 '||digest ELSE '; no verified source bytes retained' END||'. Retrieved/checked '||observed||'. Edition, amendments and applicability require the linked inventory and independent domain review.','source_refs',jsonb_build_array(s->>'url','source:'||(s->>'id'),'manifest-sha256:'||a.manifest_hash)));
  END LOOP;
  body=jsonb_build_object('summary','Official-source evidence bundle for task '||a.task_id||': '||retained||'/'||jsonb_array_length(a.manifest)||' PDFs retrieved and matched to approved byte hashes. Private draft for source review; no real rules admitted.','observations',observations,'questions',jsonb_build_array('Review the exact editions, amendments, reuse terms, translation limits and financing/entity scope before admitting any rule.','Missing or failed retrieval means evidence is unavailable in this bundle, not that a procurement requirement failed.','This saved bundle is immutable. A changed source or partial retrieval needs a newly authorized job; it is not silently re-fetched.'));
  INSERT INTO public.hq_cloud_artifacts(organization_id,run_id,job_id,body) VALUES(b.organization_id,rid,j.id,body) RETURNING content_hash INTO h;
  submission=jsonb_build_object('summary',body->>'summary','artifactRef','postgres:hq_cloud_artifacts/'||rid,'artifactHash',h,'manifestHash',a.manifest_hash,'reviewStatus','pending','job_id',j.id,'run_id',rid,'retained_sources',retained,'total_sources',jsonb_array_length(a.manifest),'input_tokens',0,'output_tokens',0,'model_cost_usd',0,'hosting_cost','unavailable');
  PERFORM set_config('app.hq_lease_token',tok,true);
  UPDATE public.hq_runs SET status='review',finished_at=clock_timestamp(),result=submission,cost_usd=0,input_tokens=0,output_tokens=0 WHERE organization_id=b.organization_id AND id=rid;
  UPDATE public.hq_jobs SET status='review',lease_token=NULL,lease_until=NULL,result=submission,updated_at=clock_timestamp() WHERE organization_id=b.organization_id AND id=j.id;
  INSERT INTO public.hq_events(organization_id,id,mandate_id,job_id,actor_id,event_type,evidence) VALUES(b.organization_id,gen_random_uuid()::text,b.mandate_id,j.id,b.actor_id,'source_collection_submitted',submission);
  INSERT INTO public.hq_operating_checks(organization_id,content_hash,status,model_eligible) VALUES(b.organization_id,a.manifest_hash,'source_collection:review',false);
  RETURN submission||jsonb_build_object('status','review');
END $$;
REVOKE ALL ON FUNCTION hq_source_claim(),hq_source_submit(text,text,text,jsonb),hq_source_authorization_guard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION hq_source_claim(),hq_source_submit(text,text,text,jsonb) TO traceli_hq_cloud_runner;

ALTER FUNCTION hq_cloud_snapshot() RENAME TO hq_cloud_base_snapshot;
CREATE FUNCTION hq_cloud_snapshot() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE b hq_cloud_bindings; base jsonb; source_runs jsonb;
BEGIN
  b=public.hq_cloud_identity('reader'); base=public.hq_cloud_base_snapshot();
  SELECT coalesce(jsonb_agg(row),'[]'::jsonb) INTO source_runs FROM (
    SELECT r.id,r.job_id,r.attempt,
      CASE WHEN r.status='review' AND j.status='accepted' AND j.result->>'artifactHash'=a.content_hash THEN 'accepted'
      WHEN r.status='running' AND (r.lease_until<=clock_timestamp() OR j.lease_token IS DISTINCT FROM r.lease_token) THEN 'expired' ELSE r.status END AS status,
      r.started_at,r.finished_at,r.input_tokens,r.output_tokens,0 AS estimated_microusd,NULL::bigint AS reserved_microusd,false AS cost_uncertain,a.body AS draft,a.content_hash
    FROM public.hq_runs r JOIN public.hq_jobs j ON (j.organization_id,j.id)=(r.organization_id,r.job_id)
    LEFT JOIN public.hq_cloud_artifacts a ON (a.organization_id,a.run_id)=(r.organization_id,r.id)
    WHERE r.organization_id=b.organization_id AND r.mandate_id=b.mandate_id AND j.contract->>'charter_version'='source-collection-1' ORDER BY r.started_at DESC LIMIT 10
  ) row;
  RETURN jsonb_set(base,'{runs}',source_runs||(base->'runs'));
END $$;
REVOKE ALL ON FUNCTION hq_cloud_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION hq_cloud_snapshot() TO traceli_hq_cloud_reader;
COMMIT;
