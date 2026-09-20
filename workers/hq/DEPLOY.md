# Deploy the bounded HQ worker

This is the approved preview service, not the public web application. `railway-service.json` records the exact service and settings. It contains no secrets and is an operator reference for Railway's `serviceInstanceUpdate` API, not a file Railway automatically evaluates.

Run `node workers/hq/stage.mjs` from the repository. It produces a temporary directory containing only the four tracked runtime files, their hashes, a root copy of the Dockerfile and a strict ignore file. Review the printed file list. From that directory, use `railway up` with the explicit project, service and preview environment IDs in the settings file. Do not upload the application workspace.

Keep `dockerfilePath` and `RAILWAY_DOCKERFILE_PATH` set to `Dockerfile` for this staged layout. Railway's actual deployment must report Dockerfile build, the daily 06:00 UTC schedule, one replica and restart NEVER. Read back the deployment and next scheduled run; a successful settings update alone does not prove a healthy deployment.

The old `railway.toml` approach is removed because Railway rejected configuration-as-code for this newly created service. The pilot uses explicit service settings; no new infrastructure framework is needed. See [Railway configuration guidance](https://docs.railway.com/infrastructure-as-code).

Keep credentials in Railway variables. Initial installation starts disabled. The existing service is enabled under Oday's recorded approval; the database admits only a new Supervisor-approved snapshot. Never change funding, inputs, pricing validity or the review gate merely to make a deployment pass. No public domain is required.

Pause by disabling the database policy and binding, setting worker execution false, and clearing the schedule. Preserve job/artifact/cost history. Verify the database denial and service state after any pause. An in-flight provider call may still be charged.
