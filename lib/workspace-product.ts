/** Workspace product IA for Award desk + Rule library. Not the protected tender workbench. */

export const workspaceProductPaths = {
  awards: '/demo',
  awardPrep: '/demo/rfp-2026-041',
  awardRecord: '/demo/rfp-2026-041/record',
  library: '/workspace/library',
  records: '/workspace/records',
  settings: '/workspace/settings',
} as const

export function isWorkspaceProductPath(pathname: string) {
  const { library, records, settings } = workspaceProductPaths
  return (
    pathname === library ||
    pathname.startsWith(`${library}/`) ||
    pathname === records ||
    pathname.startsWith(`${records}/`) ||
    pathname === settings ||
    pathname.startsWith(`${settings}/`)
  )
}
