BEGIN;

-- Save every successful/replayed check, not only the immutable output. This
-- preserves the existing daily check ledger without inventing a fresh source.
CREATE OR REPLACE FUNCTION hq_operating_tick() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE tick_result jsonb; b public.hq_cloud_bindings; source_hash text;
BEGIN
  tick_result=public.hq_customer_readout();
  IF tick_result->>'status'='not_authorized' THEN RETURN public.hq_operating_model_tick(); END IF;
  IF tick_result->>'status' IN ('review','already_submitted') THEN
    b=public.hq_cloud_identity('runner');
    SELECT j.contract->'inputs_context'->>'source_hash' INTO source_hash FROM public.hq_jobs j
      WHERE j.organization_id=b.organization_id AND j.id=tick_result->>'job_id';
    IF source_hash IS NULL THEN RAISE EXCEPTION 'Saved readout source required'; END IF;
    INSERT INTO public.hq_operating_checks(organization_id,content_hash,status,model_eligible)
      VALUES(b.organization_id,source_hash,'customer_readout:'||(tick_result->>'status'),false);
  END IF;
  RETURN tick_result||jsonb_build_object('model_eligible',false);
END $$;
COMMIT;
