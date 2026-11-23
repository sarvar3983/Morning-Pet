/** Local-time date key, e.g. "2026-11-23". Avoids UTC drift from toISOString(). */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function yesterdayKey(d: Date = new Date()): string {
  const y = new Date(d)
  y.setDate(y.getDate() - 1)
  return dateKey(y)
}

export function greeting(d: Date = new Date()): string {
  const h = d.getHours()
  if (h < 5) return 'Up early'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
