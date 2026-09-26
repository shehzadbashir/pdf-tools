export interface HistoryFile {
  name: string
  size: number
}

export interface HistoryEntry {
  id: string
  slug: string
  toolName: string
  files: HistoryFile[]
  at: number
  synced: boolean
}

const LOCAL_KEY = 'pt.history'
const MAX_LOCAL = 60

function safeParse(raw: string | null): HistoryEntry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : []
  } catch {
    return []
  }
}

export function loadHistory(): HistoryEntry[] {
  try {
    return safeParse(localStorage.getItem(LOCAL_KEY))
  } catch {
    return []
  }
}

function persist(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(entries.slice(0, MAX_LOCAL)))
  } catch {
    /* storage full or unavailable — history is a convenience, not critical */
  }
}

export interface RecordInput {
  slug: string
  toolName: string
  files: HistoryFile[]
}

export async function recordHistory(input: RecordInput): Promise<HistoryEntry> {
  const entry: HistoryEntry = {
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    slug: input.slug,
    toolName: input.toolName,
    files: input.files.slice(0, 20),
    at: Date.now(),
    synced: false,
  }

  const entries = [entry, ...loadHistory()]
  persist(entries)

  try {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        slug: input.slug,
        toolName: input.toolName,
        files: entry.files,
        at: entry.at,
      }),
    })
    if (res.ok) {
      entry.synced = true
      persist([entry, ...loadHistory().filter((e) => e.id !== entry.id)])
    }
  } catch {
    /* offline or signed out — the local copy is enough */
  }

  return entry
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(LOCAL_KEY)
  } catch {
    /* ignore */
  }
}

export function removeHistoryEntry(id: string): void {
  persist(loadHistory().filter((entry) => entry.id !== id))
}
