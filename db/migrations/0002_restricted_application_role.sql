BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'traceli_app') THEN
    CREATE ROLE traceli_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END;
$$;

DO $$
BEGIN
  EXECUTE format('GRANT traceli_app TO %I', current_user);
END;
$$;

GRANT USAGE ON SCHEMA public TO traceli_app;
GRANT SELECT ON organizations TO traceli_app;
GRANT SELECT, INSERT, UPDATE ON
  procurements,
  source_documents,
  source_versions,
  requirements,
  findings,
  decisions,
  outbox_events
TO traceli_app;
GRANT SELECT, INSERT ON audit_events TO traceli_app;

COMMIT;
