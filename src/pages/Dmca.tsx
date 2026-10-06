import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useHead } from '@/lib/head'
import { CONTACT_EMAIL, DMCA_NOTES, DMCA_SECTIONS } from '@/content/static'

export default function Dmca(): ReactNode {
  const { t } = useTranslation()

  useHead({
    title: t('dmca.title'),
    description: t('dmca.subtitle'),
    path: '/dmca',
  })

  return (
    <div className="page-container py-12">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[var(--ink-2)]">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-brand-600">
          <Home size={12} />
          {t('common.home')}
        </Link>
        <ChevronRight size={12} className="rtl:rotate-180" />
        <span className="font-semibold text-[var(--ink)]">{t('common.dmca')}</span>
      </nav>

      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
          <ShieldAlert size={20} />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">
            {t('dmca.title')}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)]">
            {t('dmca.subtitle')}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {DMCA_SECTIONS.map((section) => (
          <section key={section.heading} className="card p-6">
            <h2 className="text-lg font-bold text-[var(--ink)]">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="mt-6 max-w-3xl space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-2)]">
          {t('contact.emailNote')}
        </h2>
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=DMCA%20Notice`}
          className="text-base font-extrabold text-brand-600 hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
        {DMCA_NOTES.map((note) => (
          <p key={note} className="text-xs leading-relaxed text-[var(--ink-2)]">
            {note}
          </p>
        ))}
      </div>
    </div>
  )
}