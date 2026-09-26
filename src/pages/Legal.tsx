import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Home } from 'lucide-react'
import { useHead } from '@/lib/head'

const UPDATED = '2026-09-26'

export default function Legal({ kind }: { kind: 'privacy' | 'terms' }): ReactNode {
  const { t } = useTranslation()
  const title = t(`legal.${kind}Title`)

  useHead({
    title,
    description: t(`legal.${kind}1`),
    path: kind === 'privacy' ? '/privacy' : '/terms',
  })

  const sections = ['1', '2', '3', '4'].map((index) => ({
    title: t(`legal.${kind}${index}Title`),
    body: t(`legal.${kind}${index}`),
  }))

  return (
    <div className="page-container py-12">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[var(--ink-2)]">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-brand-600">
          <Home size={12} />
          {t('common.home')}
        </Link>
        <ChevronRight size={12} className="rtl:rotate-180" />
        <span className="font-semibold text-[var(--ink)]">{title}</span>
      </nav>

      <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">{title}</h1>
      <p className="mt-2 text-sm text-[var(--ink-2)]">
        {t('legal.updated')} {UPDATED}
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {sections.map((section) => (
          <section key={section.title} className="card p-6">
            <h2 className="text-lg font-bold text-[var(--ink)]">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/privacy" className="btn btn-ghost">
          {t('common.privacyPolicy')}
        </Link>
        <Link to="/terms" className="btn btn-ghost">
          {t('common.terms')}
        </Link>
      </div>
    </div>
  )
}
