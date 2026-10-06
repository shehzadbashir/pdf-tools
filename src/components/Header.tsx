import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, History, Menu, Search, X, LogOut, UserRound, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CATEGORY_ORDER, TOOLS } from '@/tools/registry'
import { LanguageSwitch } from './LanguageSwitch'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/auth/AuthProvider'

function Logo(): ReactNode {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,0.9)]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 3.5h7.2L18 8.4V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 20V5a1.5 1.5 0 0 1 1-1.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M13 3.6V8.5h4.9" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M8.4 14.2h7M8.4 17.4h4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export function Header(): ReactNode {
  const { t } = useTranslation()
  const { user, enabled, attachButton, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get('q') ?? '',
  )
  const toolsRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)
  const buttonHost = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMenuOpen(false)
    setToolsOpen(false)
    setAccountOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (buttonHost.current && enabled && !user) attachButton(buttonHost.current)
  }, [enabled, user, attachButton])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node
      if (toolsRef.current && !toolsRef.current.contains(target)) setToolsOpen(false)
      if (accountRef.current && !accountRef.current.contains(target)) setAccountOpen(false)
      if (searchRef.current && !searchRef.current.contains(target)) setQuery('')
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const matches = query.trim()
    ? TOOLS.filter((tool) => {
        const haystack = [
          tool.slug,
          ...tool.keywords,
          t(`tools.${tool.slug}.name`),
          t(`tools.${tool.slug}.short`),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(query.trim().toLowerCase())
      })
    : []

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]/85 backdrop-blur-md">
      <div className="page-container flex h-16 items-center gap-3">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <Logo />
          <span className="text-[0.95rem] font-extrabold tracking-tight text-[var(--ink)]">
            PDF<span className="text-brand-600">Tools</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ms-2 hidden items-center gap-1 lg:flex">
          <div className="relative" ref={toolsRef}>
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--ink-2)] transition hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
              onClick={() => setToolsOpen((open) => !open)}
              aria-expanded={toolsOpen}
            >
              {t('common.allTools')}
              <ChevronDown size={14} className={toolsOpen ? 'rotate-180 transition' : 'transition'} />
            </button>

            {toolsOpen ? (
              <div className="absolute start-0 top-full mt-2 w-[46rem] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl shadow-black/10">
                <div className="grid grid-cols-4 gap-5">
                  {CATEGORY_ORDER.map((category) => (
                    <div key={category}>
                      <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-widest text-brand-600">
                        {t(`home.categories.${category}`)}
                      </p>
                      <ul className="space-y-1">
                        {TOOLS.filter((tool) => tool.category === category).map((tool) => (
                          <li key={tool.slug}>
                            <Link
                              to={tool.path}
                              className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--ink-2)] transition hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                            >
                              <tool.icon size={15} className="mt-0.5 shrink-0" />
                              <span className="min-w-0">
                                <span className="block truncate font-semibold text-[var(--ink)]">
                                  {t(`tools.${tool.slug}.name`)}
                                </span>
                                <span className="block text-xs leading-snug text-[var(--ink-2)]">
                                  {t(`tools.${tool.slug}.short`)}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'text-brand-600'
                  : 'text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
              }`
            }
          >
            <History size={15} />
            {t('common.history')}
          </NavLink>

          <NavLink
            to="/blog"
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'text-brand-600'
                  : 'text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
              }`
            }
          >
            <BookOpen size={15} />
            {t('common.blog')}
          </NavLink>
        </nav>

        {/* Search */}
        <div className="relative ms-auto hidden max-w-xs flex-1 lg:block" ref={searchRef}>
          <Search
            size={15}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--ink-2)]"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('common.searchPlaceholder')}
            className="field ps-9"
            aria-label={t('common.search')}
          />
          {query.trim() ? (
            <div className="absolute top-full mt-2 max-h-80 w-full overflow-auto rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-xl">
              {matches.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-[var(--ink-2)]">
                  {t('common.noResults')}
                </p>
              ) : (
                matches.map((tool) => (
                  <Link
                    key={tool.slug}
                    to={tool.path}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[var(--surface-2)]"
                  >
                    <tool.icon size={15} className="text-brand-600" />
                    <span className="truncate">{t(`tools.${tool.slug}.name`)}</span>
                  </Link>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 lg:ms-3">
          <div className="hidden sm:block">
            <LanguageSwitch />
          </div>
          <ThemeToggle />

          {enabled ? (
            user ? (
              <div className="relative hidden sm:block" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((open) => !open)}
                  className="flex h-9 items-center gap-2 rounded-lg border border-[var(--line)] ps-1 pe-2.5 text-sm font-semibold text-[var(--ink)] hover:border-brand-400"
                >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-500/15 text-brand-600">
                      <UserRound size={15} />
                    </span>
                  )}
                  <span className="hidden max-w-24 truncate md:inline">
                    {user.name.split(' ')[0]}
                  </span>
                </button>

                {accountOpen ? (
                  <div className="absolute end-0 top-full mt-2 w-64 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-xl">
                    <p className="truncate text-sm font-bold text-[var(--ink)]">{user.name}</p>
                    <p className="truncate text-xs text-[var(--ink-2)]">{user.email}</p>
                    <div className="my-2 h-px bg-[var(--line)]" />
                    <Link
                      to="/history"
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
                    >
                      <History size={14} />
                      {t('common.history')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-red-500 hover:bg-red-500/10"
                    >
                      <LogOut size={14} />
                      {t('auth.signOut')}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                ref={buttonHost}
                className="hidden min-h-9 items-center sm:flex"
                aria-label={t('auth.signIn')}
              />
            )
          ) : null}

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--ink-2)] lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="border-t border-[var(--line)] bg-[var(--surface)] lg:hidden">
          <div className="page-container max-h-[70vh] overflow-y-auto py-4">
            <div className="mb-4 sm:hidden">
              <LanguageSwitch />
            </div>
            <div className="mb-4 grid gap-2">
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => {
                  setMenuOpen(false)
                  void navigate('/merge-pdf')
                }}
              >
                {t('home.ctaMerge')}
              </button>
              <button
                type="button"
                className="btn btn-ghost w-full"
                onClick={() => {
                  setMenuOpen(false)
                  void navigate('/history')
                }}
              >
                <History size={15} />
                {t('common.history')}
              </button>
              <button
                type="button"
                className="btn btn-ghost w-full"
                onClick={() => {
                  setMenuOpen(false)
                  void navigate('/blog')
                }}
              >
                <BookOpen size={15} />
                {t('common.blog')}
              </button>
            </div>

            {CATEGORY_ORDER.map((category) => (
              <div key={category} className="mb-4">
                <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-widest text-brand-600">
                  {t(`home.categories.${category}`)}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TOOLS.filter((tool) => tool.category === category).map((tool) => (
                    <Link
                      key={tool.slug}
                      to={tool.path}
                      className="flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--ink-2)]"
                    >
                      <tool.icon size={15} className="shrink-0 text-brand-600" />
                      <span className="truncate">{t(`tools.${tool.slug}.name`)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  )
}
