import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ChevronDown, ShieldCheck, Sparkles } from 'lucide-react'
import { CATEGORY_ORDER, TOOLS } from '@/tools/registry'
import { ToolCard } from '@/components/ToolCard'
import { AdSlot } from '@/components/AdSlot'
import { useHead } from '@/lib/head'
import { SITE } from '@/config/site'

const FAQ_KEYS = ['faq1', 'faq2', 'faq3', 'faq4'] as const

export default function Home(): ReactNode {
  const { t } = useTranslation()

  useHead({ fullTitle: SITE.homeTitle, description: SITE.homeDescription, path: '/' })

  useEffect(() => {
    const payloads: Record<string, unknown>[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE.name,
        url: SITE.url,
        description: SITE.homeDescription,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_KEYS.map((key) => ({
          '@type': 'Question',
          name: t(`home.${key}q`),
          acceptedAnswer: { '@type': 'Answer', text: t(`home.${key}a`) },
        })),
      },
    ]
    const nodes = payloads.map((data, index) => {
      const node = document.createElement('script')
      node.type = 'application/ld+json'
      node.id = `ld-home-${index}`
      node.textContent = JSON.stringify(data)
      document.head.appendChild(node)
      return node
    })
    return () => {
      nodes.forEach((node) => node.remove())
    }
  }, [t])

  const popular = TOOLS.filter((tool) =>
    ['merge-pdf', 'split-pdf', 'compress-pdf', 'pdf-to-word'].includes(tool.slug),
  )

  const how = [
    { key: 'how1', title: 'how1Title' },
    { key: 'how2', title: 'how2Title' },
    { key: 'how3', title: 'how3Title' },
  ]

  const why = ['why1', 'why2', 'why3', 'why4']

  const faq = FAQ_KEYS

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--surface)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(79,70,229,0.16),transparent_55%),radial-gradient(circle_at_85%_20%,rgba(139,92,246,0.14),transparent_50%)]"
        />
        <div className="page-container relative py-16 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/40 bg-brand-500/10 px-3.5 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-300">
            <Sparkles size={13} />
            {t('common.tagline')}
          </span>

          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-[var(--ink)] sm:text-6xl">
            {t('home.heroTitle')}{' '}
            <span className="bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent">
              {t('home.heroTitleAccent')}
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--ink-2)] sm:text-lg">
            {t('home.heroSubtitle')}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/merge-pdf" className="btn btn-primary">
              {t('home.ctaMerge')}
              <ArrowRight size={16} className="rtl:rotate-180" />
            </Link>
            <a href="#tools" className="btn btn-ghost">
              {t('home.ctaBrowse')}
              <ChevronDown size={16} />
            </a>
          </div>

          <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-4">
            {[
              { value: String(TOOLS.length), label: t('home.statsTools') },
              { value: t('home.statsFree'), label: t('common.tagline') },
              { value: t('home.statsPrivate'), label: t('common.privacy') },
            ].map((stat, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/70 p-4 backdrop-blur"
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-xl font-extrabold text-[var(--ink)]">{stat.value}</dd>
                <dd className="mt-0.5 text-xs text-[var(--ink-2)]">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="page-container pt-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">
              {t('home.popular')}
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{t('home.heroSubtitle')}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>

        <AdSlot label="Advertisement" format="horizontal" className="mt-8" />

        {CATEGORY_ORDER.map((category) => (
          <div key={category} className="mt-12">
            <h2 className="mb-4 text-xl font-extrabold tracking-tight text-[var(--ink)]">
              {t(`home.categories.${category}`)}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TOOLS.filter((tool) => tool.category === category).map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="mt-16 border-y border-[var(--line)] bg-[var(--surface)]">
        <div className="page-container py-14">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">
            {t('home.howTitle')}
          </h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {how.map((step, index) => (
              <li
                key={step.key}
                className="relative rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-black text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-bold text-[var(--ink)]">
                  {t(`home.${step.title}`)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-2)]">
                  {t(`home.${step.key}`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why */}
      <section className="page-container py-14">
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">
          {t('home.whyTitle')}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {why.map((key) => (
            <div key={key} className="card flex gap-4 p-5">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={17} />
              </span>
              <div>
                <h3 className="text-base font-bold text-[var(--ink)]">{t(`home.${key}`)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ink-2)]">
                  {t(`home.${key}d`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="page-container">
        <AdSlot label="Advertisement" format="rectangle" />
      </div>

      {/* FAQ */}
      <section className="page-container py-14">
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">
          {t('home.faqTitle')}
        </h2>
        <div className="mt-6 grid gap-3">
          {faq.map((key) => (
            <details key={key} className="card group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-[var(--ink)] sm:text-base">
                {t(`home.${key}q`)}
                <ChevronDown
                  size={16}
                  className="shrink-0 text-[var(--ink-2)] transition group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">
                {t(`home.${key}a`)}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
