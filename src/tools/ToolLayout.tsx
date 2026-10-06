import { Suspense, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, Home, ShieldCheck, HelpCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CATEGORY_ORDER, TOOLS, toolBySlug, type ToolCategory, type ToolDefinition } from './registry'
import { useHead } from '@/lib/head'
import { SITE, type ToolSlug } from '@/config/site'
import { AdSlot } from '@/components/AdSlot'
import { TOOL_CONTENT } from '@/content/tools'

function useToolJsonLd(
  tool: ToolDefinition,
  name: string,
  description: string,
  steps: string[],
  faq: { q: string; a: string }[],
): void {
  useEffect(() => {
    const nodes = [
      {
        id: `ld-${tool.slug}`,
        data: {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name,
          description,
          step: steps.map((text, index) => ({
            '@type': 'HowToStep',
            name: `Step ${index + 1}`,
            text,
          })),
        },
      },
      ...(faq.length > 0
        ? [
            {
              id: `ld-faq-${tool.slug}`,
              data: {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faq.map((entry) => ({
                  '@type': 'Question',
                  name: entry.q,
                  acceptedAnswer: { '@type': 'Answer', text: entry.a },
                })),
              },
            },
          ]
        : []),
    ]
    const appended = nodes.map((node) => {
      const el = document.createElement('script')
      el.type = 'application/ld+json'
      el.id = node.id
      el.textContent = JSON.stringify(node.data)
      document.head.appendChild(el)
      return el
    })
    return () => {
      appended.forEach((el) => el.remove())
    }
  }, [tool.slug, name, description, steps, faq])
}

function ToolSkeleton(): ReactNode {
  return (
    <div className="card flex min-h-72 items-center justify-center text-sm text-[var(--ink-2)]">
      …
    </div>
  )
}

function relatedTools(current: ToolDefinition): ToolDefinition[] {
  const sameCategory = TOOLS.filter(
    (tool) => tool.category === current.category && tool.slug !== current.slug,
  )
  const rest = TOOLS.filter(
    (tool) => tool.category !== current.category && tool.slug !== current.slug,
  )
  return [...sameCategory, ...rest].slice(0, 3)
}

export function ToolShell({
  tool,
  children,
}: {
  tool: ToolDefinition
  children: ReactNode
}): ReactNode {
  const { t } = useTranslation()
  const slug = tool.slug
  const name = t(`tools.${slug}.name`)
  const short = t(`tools.${slug}.short`)
  const long = t(`tools.${slug}.long`)
  const rawSteps = t(`tools.${slug}.steps`, { returnObjects: true })
  const steps = Array.isArray(rawSteps) ? (rawSteps as string[]) : []
  const categoryName = t(`home.categories.${tool.category as ToolCategory}`)

  const content = TOOL_CONTENT[slug]

  const related = (content?.related ?? [])
    .map((relatedSlug) => toolBySlug(relatedSlug))
    .filter((entry): entry is ToolDefinition => Boolean(entry))

  useHead({ title: `${name} — ${short.replace(/\.$/, '')}`, description: short, path: tool.path })
  useToolJsonLd(tool, name, long, steps, content?.faq ?? [])

  return (
    <div className="pb-16">
      <div className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="page-container py-5">
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-[var(--ink-2)]">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-brand-600">
              <Home size={12} />
              {t('common.home')}
            </Link>
            <ChevronRight size={12} className="rtl:rotate-180" />
            <span>{categoryName}</span>
            <ChevronRight size={12} className="rtl:rotate-180" />
            <span className="font-semibold text-[var(--ink)]">{name}</span>
          </nav>

          <div className="flex flex-wrap items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
              <tool.icon size={26} />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
                {name}
              </h1>
              <div className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[var(--ink-2)] sm:text-[0.95rem]">
                <p>{long}</p>
                {content?.brief.map((paragraph) => <p key={paragraph} className="mt-2">{paragraph}</p>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container grid gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-6">
          <AdSlot label={`Advertisement — ${name}`} format="horizontal" />

          <div className="card p-4 sm:p-6">{children}</div>

          <AdSlot label="Advertisement" format="horizontal" />

          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 text-base font-bold text-[var(--ink)]">{t('common.learnMore')}</h2>
            <ol className="prose-steps">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={14} />
              {t('common.privacy')}
            </p>
          </section>

          {content ? (
            <>
              <section className="card p-6 sm:p-7">
                <h2 className="text-xl font-extrabold tracking-tight text-[var(--ink)]">
                  {name}: {t('common.guides')}
                </h2>
                <div className="mt-5 space-y-7">
                  {content.sections.map((section) => (
                    <div key={section.heading}>
                      <h3 className="text-base font-bold text-[var(--ink)]">{section.heading}</h3>
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="mt-2 text-sm leading-relaxed text-[var(--ink-2)] sm:text-[0.95rem]">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </section>

              <section className="card p-6 sm:p-7">
                <h2 className="text-xl font-extrabold tracking-tight text-[var(--ink)]">
                  {t('common.tips')}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {content.tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--ink-2)]">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500/10 text-[0.65rem] font-black text-brand-600">
                        ✓
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {content.faq.length > 0 ? (
                <section className="card p-6 sm:p-7">
                  <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-[var(--ink)]">
                    <HelpCircle size={19} className="text-brand-600" />
                    {t('common.faq')}
                  </h2>
                  <div className="mt-4 grid gap-3">
                    {content.faq.map((entry) => (
                      <details key={entry.q} className="group rounded-xl border border-[var(--line)] p-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-[var(--ink)]">
                          {entry.q}
                          <ChevronRight size={15} className="shrink-0 text-[var(--ink-2)] transition group-open:rotate-90 rtl:rotate-180" />
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">{entry.a}</p>
                      </details>
                    ))}
                  </div>
                </section>
              ) : null}

              {related.length > 0 ? (
                <section className="card p-6 sm:p-7">
                  <h2 className="text-xl font-extrabold tracking-tight text-[var(--ink)]">
                    {t('common.relatedTools')}
                  </h2>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                    {related.map((relatedTool) => (
                      <li key={relatedTool.slug}>
                        <Link
                          to={relatedTool.path}
                          className="group flex items-center gap-2.5 rounded-xl border border-[var(--line)] p-3 text-sm font-semibold text-[var(--ink)] transition hover:border-brand-400/60 hover:text-brand-600"
                        >
                          <relatedTool.icon size={16} className="shrink-0 text-brand-600" />
                          <span className="min-w-0 flex-1 truncate">
                            {t(`tools.${relatedTool.slug}.name`)}
                          </span>
                          <ArrowRight size={14} className="opacity-0 transition group-hover:opacity-100 rtl:rotate-180" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          ) : null}
        </div>

        <aside className="space-y-6">
          <AdSlot label="Advertisement" format="rectangle" />
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--ink-2)]">
              {t('common.allTools')}
            </h2>
            <ul className="space-y-2.5">
              {relatedTools(tool).map((related) => (
                <li key={related.slug}>
                  <Link
                    to={related.path}
                    className="flex items-center gap-2.5 text-sm text-[var(--ink-2)] transition hover:text-brand-600"
                  >
                    <related.icon size={15} className="shrink-0" />
                    <span className="truncate">{t(`tools.${related.slug}.name`)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-[var(--line)] pt-3 text-xs text-[var(--ink-2)]">
              {SITE.name} — {t('common.tagline')}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

export function ToolRoute({ slug }: { slug: ToolSlug }): ReactNode {
  const tool = toolBySlug(slug)
  if (!tool) return null
  const Component = tool.component

  return (
    <ToolShell tool={tool}>
      <Suspense fallback={<ToolSkeleton />}>
        <Component />
      </Suspense>
    </ToolShell>
  )
}

export { CATEGORY_ORDER }
