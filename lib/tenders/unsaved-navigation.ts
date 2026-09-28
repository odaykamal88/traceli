/** Only an ordinary same-origin route change needs the in-app unsaved-work prompt. */
export function guardedDestination(href: string, currentHref: string): string | null {
  try {
    const current = new URL(currentHref)
    const destination = new URL(href, current)
    if (!['http:', 'https:'].includes(destination.protocol) || destination.origin !== current.origin) return null
    if (destination.pathname === current.pathname && destination.search === current.search) return null
    return `${destination.pathname}${destination.search}${destination.hash}`
  } catch { return null }
}
