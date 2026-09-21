export type Metric = { id: string; label: string; current: number | null; target: number }

export const updatesDesk = 'https://traceli-operating-room.odeyqemal.chatgpt.site/updates'
export function updatesDeskUrl(taskId?: number) {
  if (taskId === undefined) return updatesDesk
  if (!Number.isSafeInteger(taskId) || taskId <= 0) throw new Error('Invalid task link')
  return `${updatesDesk}?task=${taskId}`
}

/** A missing priority in an older snapshot is unknown, never an inferred decision. */
export function taskPriorityLabel(priority?: 'normal' | 'later') {
  return priority === 'later' ? 'Later' : priority === 'normal' ? 'Normal priority' : 'Priority not recorded'
}

export function requestTaskState(ids: number[], tasks: { id: number; status: string; priority?: 'normal' | 'later' }[]) {
  const current: number[] = [], later: number[] = [], completed: number[] = []
  for (const id of ids) {
    const task = tasks.find(task => task.id === id)
    if (!task) continue
    if (task.status === 'done') completed.push(id)
    else if (task.priority === 'later') later.push(id)
    else current.push(id)
  }
  return { current, later, completed, completeRequest: current.length === ids.length }
}

/** Missing evidence must never look like a measured zero or a completed goal. */
export function metricProgress(metric: Metric | undefined) {
  if (!metric || metric.current === null || !Number.isFinite(metric.current) || metric.current < 0 || !Number.isFinite(metric.target) || metric.target <= 0) return null
  return { current: metric.current, target: metric.target, percent: Math.min(100, metric.current / metric.target * 100), remaining: Math.max(0, metric.target - metric.current) }
}

export function newestFirst<T extends { at: string }>(events: T[]): T[] {
  // Date-only checkpoints sort above timed entries on their date without
  // inventing a display time. Use one total ordering to avoid mixed-date cycles.
  const calendar = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' })
  const dayOf = (at: string) => at.includes('T') ? calendar.format(new Date(at)) : at
  return events.map((event, index) => ({ event, index })).sort((a, b) => {
    const day = dayOf(b.event.at).localeCompare(dayOf(a.event.at))
    if (day) return day
    const rank = (at: string) => at.includes('T') ? Date.parse(at) : Date.parse(at) + 86_399_999
    return rank(b.event.at) - rank(a.event.at) || b.index - a.index
  }).map(({ event }) => event)
}

export function snapshotAge(at: string, now = Date.now()) {
  const timestamp = Date.parse(at)
  if (!Number.isFinite(timestamp) || timestamp > now + 60_000) return 'unknown'
  return now - timestamp > 24 * 60 * 60 * 1000 ? 'stale' : 'recent'
}
