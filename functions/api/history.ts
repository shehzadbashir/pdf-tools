import {
  getSession,
  json,
  normaliseFiles,
  type HistoryRecord,
  type PagesHandler,
} from '../../server/shared'

interface Row {
  id: string
  slug: string
  tool_name: string
  files: string
  at: number
}

function toRecord(row: Row): HistoryRecord {
  let files: { name: string; size: number }[] = []
  try {
    files = normaliseFiles(JSON.parse(row.files))
  } catch {
    files = []
  }
  return {
    id: row.id,
    slug: row.slug,
    toolName: row.tool_name,
    files,
    at: row.at,
    synced: true,
  }
}

export const onRequestGet: PagesHandler = async ({ request, env }) => {
  const user = await getSession(request, env)
  if (!user) return json({ entries: [] })

  try {
    const result = await env.DB.prepare(
      `SELECT id, slug, tool_name, files, at
         FROM history
        WHERE sub = ?
        ORDER BY at DESC
        LIMIT 100`,
    )
      .bind(user.sub)
      .all<Row>()
    return json({ entries: (result.results ?? []).map(toRecord) })
  } catch {
    return json({ entries: [] }, { status: 503 })
  }
}

export const onRequestPost: PagesHandler = async ({ request, env }) => {
  const user = await getSession(request, env)
  if (!user) return json({ error: 'unauthorized' }, { status: 401 })

  let body: { slug?: unknown; toolName?: unknown; files?: unknown; at?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return json({ error: 'bad request' }, { status: 400 })
  }

  const slug = typeof body.slug === 'string' ? body.slug.slice(0, 48) : ''
  const toolName = typeof body.toolName === 'string' ? body.toolName.slice(0, 120) : ''
  const files = normaliseFiles(body.files)
  const at = Number.isFinite(body.at) ? Number(body.at) : Date.now()

  if (!slug || !toolName) return json({ error: 'bad request' }, { status: 400 })

  const id = crypto.randomUUID()
  try {
    await env.DB.prepare(
      `INSERT INTO history (id, sub, slug, tool_name, files, at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, user.sub, slug, toolName, JSON.stringify(files), at)
      .run()

    // Keep the log bounded so one account cannot grow the table without limit.
    await env.DB.prepare(
      `DELETE FROM history
        WHERE sub = ?
          AND id NOT IN (
            SELECT id FROM history WHERE sub = ? ORDER BY at DESC LIMIT 200
          )`,
    )
      .bind(user.sub, user.sub)
      .run()

    return json({ ok: true, id })
  } catch {
    return json({ error: 'storage unavailable' }, { status: 503 })
  }
}

export const onRequestDelete: PagesHandler = async ({ request, env }) => {
  const user = await getSession(request, env)
  if (!user) return json({ error: 'unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return json({ error: 'bad request' }, { status: 400 })

  try {
    await env.DB.prepare('DELETE FROM history WHERE sub = ? AND id = ?')
      .bind(user.sub, id.slice(0, 64))
      .run()
    return json({ ok: true })
  } catch {
    return json({ error: 'storage unavailable' }, { status: 503 })
  }
}
