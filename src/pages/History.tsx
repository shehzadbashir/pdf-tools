import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CheckCircle2, History as HistoryIcon, Trash2 } from 'lucide-react'
import { TOOLS } from '@/tools/registry'
import { clearHistory, loadHistory, removeHistoryEntry, type HistoryEntry } from '@/lib/history'
import { useAuth } from '@/auth/AuthProvider'
import { useHead } from '@/lib/head'

function formatWhen(at: number): string {
  return new Date(at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function HistoryPage(): ReactNode {
  const { t } = useTranslation()
  const { user, enabled } = useAuth()
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistory())

  useHead({
    title: t('history.title'),
    description: t('history.subtitle'),
    robots: 'noindex, nofollow',
    path: '/history',
  })

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetch('/api/history', { credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) return
        const payload = (await res.json()) as { entries?: HistoryEntry[] }
        if (cancelled || !Array.isArray(payload.entries)) return
        const merged = new Map<string, HistoryEntry>()
        for (const entry of [...payload.entries, ...loadHistory()]) {
          if (entry?.id) merged.set(entry.id, { ...entry, synced: true })
        }
        setEntries([...merged.values()].sort((a, b) => b.at - a.at))
      })
      .catch(() => {
        /* offline — local list stays */
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const toolPath = (slug: string): string =>
    TOOLS.find((tool) => tool.slug === slug)?.path ?? '/'

  return (
    <div className="page-container py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">
            {t('history.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)]">
            {t('history.subtitle')}
          </p>
        </div>
        {entries.length > 0 ? (
          <button
            type="button"
            className="btn btn-ghost text-red-500"
            onClick={() => {
              clearHistory()
              setEntries([])
            }}
          >
            <Trash2 size={15} />
            {t('history.clearAll')}
          </button>
        ) : null}
      </div>

      {enabled && !user ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-400/40 bg-brand-500/10 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-[var(--ink)]">{t('history.note')}</p>
            <p className="text-xs text-[var(--ink-2)]">{t('history.localBadge')}</p>
          </div>
          <a
            href="#signin"
            className="btn btn-primary"
            onClick={(event) => {
              event.preventDefault()
              document.querySelector<HTMLButtonElement>('header button')?.focus()
            }}
          >
            {t('history.signInCta')}
          </a>
        </div>
      ) : null}

      <div className="mt-8">
        {entries.length === 0 ? (
          <div className="card flex flex-col items-center gap-4 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
              <HistoryIcon size={24} />
            </span>
            <p className="text-base font-bold text-[var(--ink)]">{t('history.empty')}</p>
            <Link to="/merge-pdf" className="btn btn-primary">
              {t('history.emptyCta')}
              <ArrowRight size={16} className="rtl:rotate-180" />
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="hidden border-b border-[var(--line)] bg-[var(--surface-2)] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] sm:grid sm:grid-cols-[1fr_1.4fr_1.2fr_auto] sm:gap-4">
              <span>{t('history.when')}</span>
              <span>{t('history.tool')}</span>
              <span>{t('history.files')}</span>
              <span className="sr-only">{t('common.remove')}</span>
            </div>

            <ul className="divide-y divide-[var(--line)]">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_1.4fr_1.2fr_auto] sm:items-center sm:gap-4"
                >
                  <span className="text-xs text-[var(--ink-2)]">{formatWhen(entry.at)}</span>

                  <Link
                    to={toolPath(entry.slug)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink)] hover:text-brand-600"
                  >
                    {entry.toolName}
                    <ArrowRight size={13} className="rtl:rotate-180" />
                  </Link>

                  <span className="min-w-0">
                    <span className="block truncate text-sm text-[var(--ink-2)]">
                      {entry.files.map((file) => file.name).join(', ')}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[0.7rem]">
                      <span className="text-[var(--ink-2)]/70">
                        {entry.files.length} {t('common.files')} ·{' '}
                        {formatSize(entry.files.reduce((sum, file) => sum + file.size, 0))}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold ${
                          entry.synced
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-[var(--surface-2)] text-[var(--ink-2)]'
                        }`}
                      >
                        {entry.synced ? <CheckCircle2 size={11} /> : null}
                        {entry.synced ? t('history.cloudBadge') : t('history.localBadge')}
                      </span>
                    </span>
                  </span>

                  <button
                    type="button"
                    className="justify-self-start rounded-lg p-2 text-[var(--ink-2)] transition hover:bg-red-500/10 hover:text-red-500 sm:justify-self-end"
                    aria-label={t('common.remove')}
                    onClick={() => {
                      removeHistoryEntry(entry.id)
                      setEntries((current) => current.filter((item) => item.id !== entry.id))
                      void fetch(`/api/history?id=${encodeURIComponent(entry.id)}`, {
                        method: 'DELETE',
                        credentials: 'same-origin',
                      }).catch(() => undefined)
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
