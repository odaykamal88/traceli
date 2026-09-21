BEGIN;

-- Backward-compatible metadata only. Source D1 remains the task authority.
-- Keep this existing function identity, owner and EXECUTE grants unchanged.
CREATE OR REPLACE FUNCTION hq_operating_ingest(packet jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE b public.hq_operating_ingestors; prior public.hq_operating_sources; r jsonb; section text; row jsonb; allowed text[]; required text[]; cap integer;
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
    required=allowed;
    IF section='tasks' THEN allowed=allowed||ARRAY['priority','revision']; END IF;
    FOR row IN SELECT value FROM jsonb_array_elements(r->section) LOOP
      IF jsonb_typeof(row) IS DISTINCT FROM 'object' OR NOT row ?& required OR EXISTS(SELECT FROM jsonb_object_keys(row) k WHERE NOT k=ANY(allowed)) THEN RAISE EXCEPTION 'Non-metadata field rejected'; END IF;
      IF section='tasks' THEN
        IF row ? 'priority' AND (jsonb_typeof(row->'priority') IS DISTINCT FROM 'string' OR row->>'priority' NOT IN ('normal','later')) THEN RAISE EXCEPTION 'Invalid task priority'; END IF;
        IF row ? 'revision' THEN
          IF jsonb_typeof(row->'revision') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Invalid task revision'; END IF;
          IF (row->>'revision')::numeric NOT BETWEEN 0 AND 9007199254740991 OR trunc((row->>'revision')::numeric)<>(row->>'revision')::numeric THEN RAISE EXCEPTION 'Invalid task revision'; END IF;
        END IF;
      END IF;
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
COMMIT;
