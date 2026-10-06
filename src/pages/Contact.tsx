import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useHead } from '@/lib/head'
import { CONTACT_EMAIL, CONTACT_INTRO } from '@/content/static'

export default function Contact(): ReactNode {
  const { t } = useTranslation()

  useHead({
    title: t('contact.title'),
    description: t('contact.subtitle'),
    path: '/contact',
  })

  return (
    <div className="page-container py-12">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[var(--ink-2)]">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-brand-600">
          <Home size={12} />
          {t('common.home')}
        </Link>
        <ChevronRight size={12} className="rtl:rotate-180" />
        <span className="font-semibold text-[var(--ink)]">{t('common.contact')}</span>
      </nav>

      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
          <Mail size={20} />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">
            {t('contact.title')}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)]">
            {t('contact.subtitle')}
          </p>
        </div>
      </div>

      <div className="mt-10 max-w-2xl space-y-6">
        {CONTACT_INTRO.map((paragraph) => (
          <p key={paragraph} className="text-sm leading-relaxed text-[var(--ink-2)]">
            {paragraph}
          </p>
        ))}

        <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-2)]">
              Email
            </h2>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 block text-lg font-extrabold text-brand-600 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </div>
          <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn-primary shrink-0">
            <Mail size={15} />
            {t('common.contact')}
          </a>
        </div>

        <p className="text-xs text-[var(--ink-2)]">{t('contact.emailNote')}</p>
      </div>
    </div>
  )
}