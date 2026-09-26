import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { SITE } from '@/config/site'

export interface AuthUser {
  sub: string
  name: string
  email: string
  picture?: string
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string
    callback: (response: { credential: string }) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
  }): void
  renderButton(
    element: HTMLElement,
    options: { theme?: string; size?: string; text?: string; shape?: string; width?: number },
  ): void
  disableAutoSelect(): void
}

interface GoogleNamespace {
  accounts: { id: GoogleAccountsId }
}

declare global {
  interface Window {
    google?: GoogleNamespace
  }
}

interface AuthContextValue {
  user: AuthUser | null
  ready: boolean
  /** False when no Google OAuth client id has been configured yet. */
  enabled: boolean
  error: string | null
  signInError: string | null
  attachButton: (element: HTMLElement | null) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const GIS_SRC = 'https://accounts.google.com/gsi/client'

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${GIS_SRC}"]`)) {
      if (window.google?.accounts?.id) return resolve()
      const existing = document.querySelector(`script[src="${GIS_SRC}"]`)
      existing?.addEventListener('load', () => resolve())
      existing?.addEventListener('error', () => reject(new Error('GIS failed to load')))
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('GIS failed to load'))
    document.head.appendChild(script)
  })
}

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signInError, setSignInError] = useState<string | null>(null)
  const buttonHost = useRef<HTMLElement | null>(null)
  const initialized = useRef(false)

  const enabled = Boolean(SITE.googleOAuthClientId)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me', { credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) return null
        return (await res.json()) as { user: AuthUser | null }
      })
      .then((payload) => {
        if (!cancelled && payload?.user) setUser(payload.user)
      })
      .catch(() => {
        /* not signed in / function not deployed yet */
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleCredential = useCallback(async (credential: string) => {
    setSignInError(null)
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ credential }),
      })
      if (!res.ok) throw new Error('sign-in rejected')
      const payload = (await res.json()) as { user: AuthUser }
      setUser(payload.user)
    } catch {
      setSignInError('failed')
    }
  }, [])

  const attachButton = useCallback(
    (element: HTMLElement | null) => {
      buttonHost.current = element
      if (!element || !enabled) return

      void (async () => {
        try {
          await loadGisScript()
          const google = (window as { google?: GoogleNamespace }).google
          if (!google?.accounts?.id) return
          if (!initialized.current) {
            google.accounts.id.initialize({
              client_id: SITE.googleOAuthClientId,
              callback: (response) => void handleCredential(response.credential),
              cancel_on_tap_outside: true,
            })
            initialized.current = true
          }
          element.innerHTML = ''
          google.accounts.id.renderButton(element, {
            theme: 'outline',
            size: 'medium',
            text: 'continue_with',
            width: Math.min(320, Math.max(200, element.clientWidth || 240)),
          })
        } catch (err) {
          setError(err instanceof Error ? err.message : 'auth failed')
        }
      })()
    },
    [enabled, handleCredential],
  )

  const signOut = useCallback(async () => {
    setUser(null)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    } catch {
      /* ignore */
    }
    try {
      const google = (window as { google?: GoogleNamespace }).google
      google?.accounts?.id.disableAutoSelect()
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, enabled, error, signInError, attachButton, signOut }),
    [user, ready, enabled, error, signInError, attachButton, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
