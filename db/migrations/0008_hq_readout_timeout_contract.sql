BEGIN;
-- Correct the configured bound: the existing Railway client sets the outer
-- statement timeout to 10 seconds. Function-local statement_timeout cannot
-- shorten the already running SELECT. No artifact body or review is changed.
CREATE OR REPLACE FUNCTION hq_customer_readout() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp SET lock_timeout='2s' AS $$
DECLARE b public.hq_cloud_bindings; a public.hq_readout_authorizations; s public.hq_operating_sources;
  reason text; jid text='customer-readout-w4-20260914'; rid text; tok text; expiry timestamptz;
  body jsonb; h text; refs jsonb; metrics jsonb; tasks jsonb; inputs jsonb; submission jsonb;
BEGIN
  b=public.hq_cloud_identity('runner');
  SELECT * INTO a FROM public.hq_readout_authorizations WHERE login_name=b.login_name FOR UPDATE;
  IF a.login_name IS NULL THEN RETURN jsonb_build_object('status','not_authorized','model_called',false); END IF;
  -- Immutable result survives a lost response. Retry returns the original hash.
  SELECT result INTO submission FROM public.hq_jobs WHERE organization_id=b.organization_id AND id=jid;
  IF submission IS NOT NULL THEN RETURN submission||jsonb_build_object('status','already_submitted','model_called',false); END IF;
  SELECT * INTO s FROM public.hq_operating_sources WHERE organization_id=b.organization_id FOR UPDATE;
  IF a.claim_until<=clock_timestamp()+interval '10 seconds' THEN reason='claim_expired';
  ELSIF s.organization_id IS NULL THEN reason='source_missing';
  ELSIF s.captured_at<clock_timestamp()-interval '24 hours' THEN reason='source_stale';
  ELSIF s.content_hash<>a.source_hash THEN reason='source_changed';
  ELSIF NOT EXISTS(SELECT FROM public.hq_cloud_policies WHERE login_name=b.login_name AND enabled) THEN reason='policy_paused';
  ELSIF NOT EXISTS(SELECT FROM jsonb_array_elements(s.records->'tasks') t WHERE t->>'id'='38' AND t->>'week'='2026-09-14' AND t->>'status'='doing' AND t->>'owner'='Codex') THEN reason='task_not_claimed';
  ELSIF EXISTS(SELECT FROM public.hq_jobs WHERE organization_id=b.organization_id AND mandate_id=b.mandate_id AND status='running') THEN reason='job_running';
  END IF;
  IF reason IS NULL THEN
    SELECT jsonb_agg(value ORDER BY value->>'id') INTO metrics FROM jsonb_array_elements(s.records->'metrics') WHERE value->>'id' IN ('w4-people','w4-sent','w4-conversations','w4-next-steps');
    SELECT jsonb_agg(jsonb_build_object('id',value->'id','status',value->'status','owner',value->'owner') ORDER BY (value->>'id')::integer) INTO tasks FROM jsonb_array_elements(s.records->'tasks') WHERE (value->>'id')::integer BETWEEN 28 AND 39;
    -- This bounded version covers the evidenced missing-input case only. New
    -- conversations require permitted notes and judgment, never template guesses.
    IF coalesce(jsonb_array_length(metrics),0)<>4 OR coalesce(jsonb_array_length(tasks),0)<>12
      OR (SELECT count(DISTINCT m->>'id') FROM jsonb_array_elements(metrics) m)<>4
      OR (SELECT count(DISTINCT t->>'id') FROM jsonb_array_elements(tasks) t)<>12
      OR EXISTS(SELECT FROM jsonb_array_elements(metrics) m WHERE m->>'current' IS DISTINCT FROM '0' OR m->>'target' IS DISTINCT FROM CASE m->>'id' WHEN 'w4-people' THEN '10' WHEN 'w4-sent' THEN '10' WHEN 'w4-conversations' THEN '5' ELSE '1' END) THEN reason='inputs_need_review'; END IF;
  END IF;
  IF reason IS NOT NULL THEN
    INSERT INTO public.hq_operating_checks(organization_id,content_hash,status,model_eligible) VALUES(b.organization_id,s.content_hash,'customer_readout:'||reason,false);
    RETURN jsonb_build_object('status',reason,'model_called',false);
  END IF;
  refs=jsonb_build_array('ops-sha256:'||s.content_hash,'plan:week4-20260914:task38');
  inputs=jsonb_build_object('source_hash',s.content_hash,'captured_at',s.captured_at,'metrics',metrics,'tasks',tasks,'claim_id',a.claim_id);
  body=jsonb_build_object(
    'summary','Week 4 decision memo: establish the send evidence and test access before changing the offer. Draft for task 38; customer demand remains untested.',
    'observations',jsonb_build_array(
      jsonb_build_object('statement','The saved Week 4 counters record 0/10 relevant people selected, 0/10 approaches sent, 0/5 substantive conversations and 0/1 dated commercial next steps. These are recorded counters, not independently verified event totals.','source_refs',refs),
      jsonb_build_object('statement','The actual sent, delivered, bounced, replied and met denominators are unavailable in this metadata-only input. Do not calculate a response rate or conclude that silence means rejection. The earlier seven-touch counter belongs to a different period and is not a Week 4 denominator.','source_refs',refs),
      jsonb_build_object('statement','Recent task, steps, hours, workaround, consequence, owner, deadline, purchasing route and exact buyer language are unavailable. Direct buyer, referrer and partner comparisons therefore cannot be made. Confidence is high in the saved zero counters, low in actual funnel completeness; no costly-pain or willingness-to-pay conclusion is supported.','source_refs',refs),
      jsonb_build_object('statement','Recommended experiment: Oday supplies the existing send-history handoff in task 28; Codex reconciles task 29, selects the first relevant warm route in task 30 and prepares one exact recent-task question through task 31. Oday alone sends after review and records the event in task 32. Change only the access route/ask first; success is one substantive recent-task example or named relevant introduction.','source_refs',refs),
      jsonb_build_object('statement','Owner action: Oday reviews this memo and records the Week 5 choice in task 39. Codex prepares from available permitted inputs. Preserve follow-up windows of 3–5 recipient business days from each actual send; no date is inferred from draft creation. Tasks 36/37 need a current task, owner, deadline and plausible purchasing route before a commercial scope.','source_refs',refs),
      jsonb_build_object('statement','Defer speculative features, integrations, expanded lead research and new major content until buyer evidence justifies them. Proposed lesson only: make send timestamp, delivery evidence and exact ask the minimum next handoff. No canonical memory promotion; the two-week/six-human-disposition/three-job-class learning gate is not established.','source_refs',refs)
    ),
    'questions',jsonb_build_array('Oday: provide the task 28 send history or explicitly confirm that no Week 4 approach was sent.','Independent Auditor and Supervisor: verify this exact artifact against its pinned counters and weekly plan before acceptance.','Oday: disposition task 38 and choose the next access experiment in task 39. Acceptance does not authorize sending.'));
  rid=gen_random_uuid()::text; tok=gen_random_uuid()::text; expiry=least(a.claim_until,clock_timestamp()+interval '30 seconds');
  INSERT INTO public.hq_jobs(organization_id,id,mandate_id,source_system,external_id,objective,contract,approval_level,status,attempts,max_attempts,lease_token,lease_until,worker_id)
    VALUES(b.organization_id,jid,b.mandate_id,'operating_room','38','Week 4 customer evidence decision memo',
      jsonb_build_object('charter_version','customer-readout-1','inputs_context',inputs,'reviewer','Independent Auditor and Supervisor; Oday disposition in Operating Room task 38','limits',jsonb_build_object('model_calls',0,'active_seconds',10),'source_task_id',38),
      'Green','running',1,1,tok,expiry,b.actor_id);
  INSERT INTO public.hq_runs(organization_id,id,job_id,mandate_id,attempt,worker_id,lease_token,lease_until,status)
    VALUES(b.organization_id,rid,jid,b.mandate_id,1,b.actor_id,tok,expiry,'running');
  INSERT INTO public.hq_cloud_artifacts(organization_id,run_id,job_id,body) VALUES(b.organization_id,rid,jid,body) RETURNING content_hash INTO h;
  submission=jsonb_build_object('summary',body->>'summary','artifactRef','postgres:hq_cloud_artifacts/'||rid,'artifactHash',h,'reviewStatus','pending','job_id',jid,'run_id',rid,'input_tokens',0,'output_tokens',0,'model_cost_usd',0,'hosting_cost','unavailable');
  PERFORM set_config('app.hq_lease_token',tok,true);
  UPDATE public.hq_runs SET status='review',finished_at=clock_timestamp(),result=submission,cost_usd=0,input_tokens=0,output_tokens=0 WHERE organization_id=b.organization_id AND id=rid;
  UPDATE public.hq_jobs SET status='review',lease_token=NULL,lease_until=NULL,result=submission,updated_at=clock_timestamp() WHERE organization_id=b.organization_id AND id=jid;
  INSERT INTO public.hq_events(organization_id,id,mandate_id,job_id,actor_id,event_type,evidence) VALUES(b.organization_id,gen_random_uuid()::text,b.mandate_id,jid,b.actor_id,'customer_readout_submitted',submission);
  RETURN submission||jsonb_build_object('status','review','model_called',false);
END $$;

UPDATE hq_jobs SET contract=jsonb_set(contract,'{limits,active_seconds}','10'::jsonb)
WHERE contract->>'charter_version'='customer-readout-1' AND contract->'limits'->>'active_seconds'='8';
COMMIT;
