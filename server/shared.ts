import { SignJWT, createRemoteJWKSet, jwtVerify } from 'jose'

/** Bindings declared for the Pages project (see wrangler.toml). */
export interface Env {
  DB: D1Database
  SESSION_SECRET: string
  /** Optional: sign-in stays disabled when this is missing. */
  GOOGLE_CLIENT_ID?: string
}

export interface SessionUser {
  sub: string
  name: string
  email: string
  picture?: string
}

/**
 * Minimal shape of the Pages Functions invocation context. Declared locally so
 * the API stays type-checkable without pulling in framework type packages.
 */
export interface PagesContext {
  request: Request
  env: Env
  params: Record<string, string>
  next: (error?: Error | Response) => Promise<Response>
  data: Record<string, unknown>
}

export type PagesHandler = (context: PagesContext) => Response | Promise<Response>


export interface HistoryRecord {
  id: string
  slug: string
  toolName: string
  files: { name: string; size: number }[]
  at: number
  synced: boolean
}

const COOKIE = 'pt.session'
const ISSUER = 'pdf-tools'
const AUDIENCE = 'session'
const THIRTY_DAYS = 60 * 60 * 24 * 30

const GOOGLE_JWKS = new URL('https://www.googleapis.com/oauth2/v3/certs')

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

export function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...init.headers },
  })
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim())
    }
  }
  return null
}

/** Mint a signed session token for a user. */
export async function createSession(env: Env, user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, email: user.email, picture: user.picture ?? null })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + THIRTY_DAYS)
    .sign(secretKey(env.SESSION_SECRET))
}

export function sessionCookie(token: string): string {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${THIRTY_DAYS}`
}

export function clearedCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

/** Returns the signed-in user, or null when the cookie is missing or expired. */
export async function getSession(request: Request, env: Env): Promise<SessionUser | null> {
  const token = readCookie(request, COOKIE)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(env.SESSION_SECRET), {
      issuer: ISSUER,
      audience: AUDIENCE,
    })
    if (!payload.sub || typeof payload.name !== 'string' || typeof payload.email !== 'string') {
      return null
    }
    return {
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: typeof payload.picture === 'string' ? payload.picture : undefined,
    }
  } catch {
    return null
  }
}

/** Verifies a Google ID token issued by Sign in with Google. */
export async function verifyGoogleCredential(
  credential: string,
  clientId: string,
): Promise<SessionUser> {
  const jwks = createRemoteJWKSet(GOOGLE_JWKS)
  const { payload } = await jwtVerify(credential, jwks, {
    issuer: 'https://accounts.google.com',
    audience: clientId,
  })
  if (!payload.sub || !payload.email || typeof payload.name !== 'string') {
    throw new Error('token missing claims')
  }
  return {
    sub: payload.sub,
    name: payload.name,
    email: String(payload.email),
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
  }
}

/** Shapes an arbitrary JSON payload as the history rows stored in D1. */
export function normaliseFiles(input: unknown): { name: string; size: number }[] {
  if (!Array.isArray(input)) return []
  return input
    .slice(0, 20)
    .map((entry) => {
      const record = entry as { name?: unknown; size?: unknown }
      return {
        name: String(record.name ?? 'file').slice(0, 180),
        size: Number(record.size) > 0 ? Number(record.size) : 0,
      }
    })
}
