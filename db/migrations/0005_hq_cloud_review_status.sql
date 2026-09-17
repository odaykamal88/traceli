BEGIN;

-- Reflect independent acceptance of this exact artifact; retain raw attempt history.
CREATE OR REPLACE FUNCTION hq_cloud_snapshot() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE b public.hq_cloud_bindings; result jsonb;
BEGIN
  b=public.hq_cloud_identity('reader');
  SELECT jsonb_build_object('checked_at',clock_timestamp(),'workers',coalesce((SELECT jsonb_agg(jsonb_build_object(
    'actor',wb.actor_id,'mandate',wb.mandate_id,'enabled',wb.enabled AND p.enabled AND p.funding_reference IS NOT NULL AND p.monthly_limit_microusd>=50000 AND p.pricing_valid_until>clock_timestamp(),
    'monthly_limit_microusd',p.monthly_limit_microusd,'reserved_microusd',(SELECT coalesce(sum(reserved_microusd),0) FROM public.hq_cloud_charges WHERE login_name=wb.login_name AND period=date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC')::date),
    'pricing_valid_until',p.pricing_valid_until)) FROM public.hq_cloud_bindings wb JOIN public.hq_cloud_policies p USING(login_name) WHERE wb.organization_id=b.organization_id),'[]'::jsonb),
    'runs',coalesce((SELECT jsonb_agg(row) FROM (SELECT r.id,r.job_id,r.attempt,
      CASE WHEN r.status='review' AND j.status='accepted' AND j.result->>'artifactHash'=a.content_hash THEN 'accepted'
      WHEN r.status='running' AND (r.lease_until<=clock_timestamp() OR j.lease_token IS DISTINCT FROM r.lease_token) THEN 'expired' ELSE r.status END AS status,
      r.started_at,r.finished_at,c.estimated_microusd,c.reserved_microusd,c.settled_at IS NULL AND c.run_id IS NOT NULL AS cost_uncertain,
      a.body AS draft,a.content_hash FROM public.hq_runs r JOIN public.hq_jobs j ON (j.organization_id,j.id)=(r.organization_id,r.job_id)
      LEFT JOIN public.hq_cloud_artifacts a ON (a.organization_id,a.run_id)=(r.organization_id,r.id)
      LEFT JOIN public.hq_cloud_charges c ON (c.organization_id,c.run_id)=(r.organization_id,r.id)
      WHERE r.organization_id=b.organization_id AND r.mandate_id=b.mandate_id AND j.contract->>'charter_version'='cloud-pilot-1'
      ORDER BY r.started_at DESC LIMIT 20) row),'[]'::jsonb)) INTO result;
  RETURN result;
END $$;

COMMIT;
