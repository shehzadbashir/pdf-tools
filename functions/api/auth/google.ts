import {
  createSession,
  json,
  sessionCookie,
  verifyGoogleCredential,
  type PagesHandler,
} from '../../../server/shared'
import { SITE } from '../../../src/config/site'

export const onRequestPost: PagesHandler = async ({ request, env }) => {
  const clientId = env.GOOGLE_CLIENT_ID || SITE.googleOAuthClientId
  if (!clientId) return json({ error: 'sign-in disabled' }, { status: 503 })

  let credential: unknown
  try {
    const body = (await request.json()) as { credential?: unknown }
    credential = body.credential
  } catch {
    return json({ error: 'bad request' }, { status: 400 })
  }
  if (typeof credential !== 'string' || credential.length > 4096) {
    return json({ error: 'bad request' }, { status: 400 })
  }

  let user
  try {
    user = await verifyGoogleCredential(credential, clientId)
  } catch {
    return json({ error: 'invalid credential' }, { status: 401 })
  }

  try {
    await env.DB.prepare(
      `INSERT INTO users (sub, name, email, picture, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(sub) DO UPDATE SET
         name = excluded.name,
         email = excluded.email,
         picture = excluded.picture`,
    )
      .bind(user.sub, user.name, user.email, user.picture ?? null, Date.now())
      .run()
  } catch {
    return json({ error: 'storage unavailable' }, { status: 503 })
  }

  const token = await createSession(env, user)
  return json(
    { user },
    { headers: { 'set-cookie': sessionCookie(token) } },
  )
}
