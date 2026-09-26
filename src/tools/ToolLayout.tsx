import { Suspense, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CATEGORY_ORDER, TOOLS, toolBySlug, type ToolCategory, type ToolDefinition } from './registry'
import { useHead } from '@/lib/head'
import { SITE, type ToolSlug } from '@/config/site'
import { AdSlot } from '@/components/AdSlot'

function useToolJsonLd(tool: ToolDefinition, name: string, description: string, steps: string[]): void {
  useEffect(() => {
    const node = document.createElement('script')
    node.type = 'application/ld+json'
    node.id = `ld-${tool.slug}`
    node.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name,
      description,
      step: steps.map((text, index) => ({
        '@type': 'HowToStep',
        name: `Step ${index + 1}`,
        text,
      })),
    })
    document.head.appendChild(node)
    return () => {
      node.remove()
    }
  }, [tool.slug, name, description, steps])
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

  useHead({ title: `${name} — ${short.replace(/\.$/, '')}`, description: short, path: tool.path })
  useToolJsonLd(tool, name, long, steps)

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
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[var(--ink-2)] sm:text-[0.95rem]">
                {long}
              </p>
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
