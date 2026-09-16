# Owner access verification

16 September 2026. Implementer verification; no independent security certification is claimed.

`pnpm test:hq:access`: 13 behavioral groups pass, including production/hosted-local denial, missing configuration, signed-out redirect, wrong user, wrong organization, impersonation, unverified user, procurement-role denial, removed/pending/inactive membership, changed role/subject, provider outage, successful bound owner, fixed sign-in destination and build preflight failure. The adapter uses mocked WorkOS records in this test; no customer database or production identity is touched.

Type checking passes. The production build passes. The final organization-scoped role slug is `org-hq-owner`; tests and type checking were repeated after matching WorkOS's required organization-role prefix.

Production HTTP checks with access disabled: `/` returns 200; `/hq`, memory view, direct document request and HQ sign-in return 404 with private/no-store caching. No HQ record body is exposed.

Production HTTP checks with fictional WorkOS settings: signed-out HQ and a forged cookie/role-header request redirect to `/hq/sign-in` without records. Next's RSC request returns its redirect instruction, not HQ data (RSC redirect responses can have HTTP 200). HQ sign-in ignores an attacker-controlled `returnTo`, constructs a WorkOS authorization URL for the bound organization and uses fixed protected state. Tests do not follow that fictional authorization URL or attempt to authenticate with fake credentials.

The installed SDK callback was inspected to confirm it uses PKCE-bound state and honors `returnPathname` from that state before its default `/workspace` fallback. No custom token parser, cookie scheme or credential storage was added. The [WorkOS Next.js integration](https://workos.com/docs/authkit/nextjs) and [roles documentation](https://workos.com/docs/authkit/roles-and-permissions) informed the integration; installed SDK types and source were checked directly.

Remaining: hosted real-user sign-in, non-owner end-to-end denial, authenticated Postgres integration and independent review before production. This increment does not test an unattended worker, model spending, approval mutations or production database migration.
