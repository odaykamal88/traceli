import 'server-only'

/** Opt-in rollout. A service failure never falls back to browser-only saving. */
export function tenderWorkspacesEnabled(): boolean {
  return process.env.TRACELI_TENDER_WORKSPACES === '1'
}
