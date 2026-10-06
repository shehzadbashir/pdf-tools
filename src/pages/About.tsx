import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useHead } from '@/lib/head'
import { SITE } from '@/config/site'
import { ABOUT } from '@/content/static'

export default function About(): ReactNode {
  const { t } = useTranslation()

  useHead({
    title: t('about.title'),
    description: t('about.subtitle'),
    path: '/about',
  })

  return (
    <div className="page-container py-12">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[var(--ink-2)]">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-brand-600">
          <Home size={12} />
          {t('common.home')}
        </Link>
        <ChevronRight size={12} className="rtl:rotate-180" />
        <span className="font-semibold text-[var(--ink)]">{t('common.about')}</span>
      </nav>

      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
          <Info size={20} />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">
            {t('about.title')}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)]">
            {t('about.subtitle')}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {ABOUT.map((section) => (
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

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/contact" className="btn btn-primary">
          {t('common.contact')}
        </Link>
        <Link to="/blog" className="btn btn-ghost">
          {t('common.blog')}
        </Link>
      </div>

      <p className="mt-10 text-xs text-[var(--ink-2)]">
        {SITE.name} — {SITE.url.replace(/\/$/, '')}
      </p>
    </div>
  )
}