import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CATEGORY_ORDER, TOOLS } from '@/tools/registry'
import { SITE } from '@/config/site'

export function Footer(): ReactNode {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="page-container grid gap-8 py-12 md:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
<div className="max-w-sm">
            <p className="text-lg font-extrabold tracking-tight text-[var(--ink)]">
              PDF<span className="text-brand-600">Tools</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
              {t('home.heroSubtitle')}
            </p>
            <p className="mt-4 inline-flex rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {t('common.privacy')}
            </p>
            <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--ink-2)]">
              <Link to="/blog" className="transition hover:text-brand-600">
                {t('common.blog')}
              </Link>
              <Link to="/about" className="transition hover:text-brand-600">
                {t('common.about')}
              </Link>
              <Link to="/contact" className="transition hover:text-brand-600">
                {t('common.contact')}
              </Link>
              <Link to="/dmca" className="transition hover:text-brand-600">
                {t('common.dmca')}
              </Link>
            </nav>
          </div>

        {CATEGORY_ORDER.map((category) => (
          <nav key={category} aria-label={t(`home.categories.${category}`)}>
            <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-widest text-[var(--ink-2)]">
              {t(`home.categories.${category}`)}
            </p>
            <ul className="space-y-2">
              {TOOLS.filter((tool) => tool.category === category).map((tool) => (
                <li key={tool.slug}>
                  <Link
                    to={tool.path}
                    className="text-sm text-[var(--ink-2)] transition hover:text-brand-600"
                  >
                    {t(`tools.${tool.slug}.name`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-[var(--line)]">
        <div className="page-container flex flex-col items-center justify-between gap-3 py-5 text-xs text-[var(--ink-2)] sm:flex-row">
          <p>
            © {year} {SITE.name}. {t('common.tagline')}.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-brand-600">
              {t('common.privacyPolicy')}
            </Link>
            <Link to="/terms" className="hover:text-brand-600">
              {t('common.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
