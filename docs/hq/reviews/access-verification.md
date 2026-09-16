# Owner access verification

16 September 2026. Implementer verification; no independent security certification is claimed.

`pnpm test:hq:access`: 13 behavioral groups pass, including production/hosted-local denial, missing configuration, signed-out redirect, wrong user, wrong organization, impersonation, unverified user, procurement-role denial, removed/pending/inactive membership, changed role/subject, provider outage, successful bound owner, fixed sign-in destination and build preflight failure. The adapter uses mocked WorkOS records in this test; no customer database or production identity is touched.

Type checking passes. The production build passes. The final organization-scoped role slug is `org-hq-owner`; tests and type checking were repeated after matching WorkOS's required organization-role prefix.

Production HTTP checks with access disabled: `/` returns 200; `/hq`, memory view, direct document request and HQ sign-in return 404 with private/no-store caching. No HQ record body is exposed.

Production HTTP checks with fictional WorkOS settings: signed-out HQ and a forged cookie/role-header request redirect to `/hq/sign-in` without records. Next's RSC request returns its redirect instruction, not HQ data (RSC redirect responses can have HTTP 200). HQ sign-in ignores an attacker-controlled `returnTo`, constructs a WorkOS authorization URL for the bound organization and uses fixed protected state. Tests do not follow that fictional authorization URL or attempt to authenticate with fake credentials.

The installed SDK callback was inspected to confirm it uses PKCE-bound state and honors `returnPathname` from that state before its default `/workspace` fallback. No custom token parser, cookie scheme or credential storage was added. The [WorkOS Next.js integration](https://workos.com/docs/authkit/nextjs) and [roles documentation](https://workos.com/docs/authkit/roles-and-permissions) informed the integration; installed SDK types and source were checked directly.

Remaining: hosted real-user sign-in, non-owner end-to-end denial, authenticated Postgres integration and independent review before production. This increment does not test an unattended worker, model spending, approval mutations or production database migration.

## Hosted preview evidence

Deployment `dpl_F9ALkiYp4B8ZGGsNxhwz1VZH2EGF`, commit `a624f3d04f12b81b50e94c7a7f8a956f9f1927a5`, is READY in the existing `traceli-new` project, target Preview. The branch alias is `https://traceli-new-git-codex-trace-li-hq-odaykamal-9099s-projects.vercel.app`. The production deployment remains `dpl_Hm6BBXPBgu8vHXwm5NWUD6pEsYob` from `0130366`.

Authenticated Vercel transport checks, with no application session, confirmed both `/hq` and direct library access return 307 to `/hq/sign-in`, without company record content. The browser followed the real hosted flow to the correct WorkOS staging AuthKit sign-in page, with the exact registered preview callback and designated organization. Oday was asked to complete the application login; no credential, verification code or successful owner login was fabricated.

WorkOS readback confirmed an active membership for the configured owner and role `org-hq-owner`; the user email was still unverified before the handoff. Local mock tests establish non-owner denial at the policy/adapter level; a real non-owner end-to-end test is still pending.

[Draft pull request #21](https://github.com/odaykamal88/traceli/pull/21) holds the complete operating package, Postgres foundation and access change for review. Both GitHub-reported Vercel preview checks succeeded for the deployed commit. No production merge is authorized by those checks.

## Owner login verified

On 16 September 2026, the same hosted HQ browser session reached `/hq` after Oday completed login. The application rendered “Private owner access”, eight mandates, seven workstreams and the curated Company Feed. This confirms the real owner sign-in, callback, session binding and fresh membership check for the deployed preview. The live page correctly reported runtime status unavailable and zero package jobs running. This is owner-read acceptance only; a real non-owner session test, native Postgres reader and cloud worker still remain.
