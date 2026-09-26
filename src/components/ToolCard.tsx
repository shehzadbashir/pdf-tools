import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ToolDefinition } from '@/tools/registry'

export function ToolCard({ tool }: { tool: ToolDefinition }): ReactNode {
  const { t } = useTranslation()
  const Icon = tool.icon

  return (
    <Link
      to={tool.path}
      className="group relative flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:border-brand-400/60 hover:shadow-[0_16px_40px_-24px_rgba(79,70,229,0.6)]"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white dark:text-brand-300 dark:group-hover:text-white">
        <Icon size={21} />
      </span>

      <span className="block">
        <span className="flex items-center gap-1.5 text-[0.95rem] font-bold text-[var(--ink)]">
          {t(`tools.${tool.slug}.name`)}
          <ArrowRight
            size={14}
            className="opacity-0 transition group-hover:opacity-100 rtl:rotate-180"
          />
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-[var(--ink-2)]">
          {t(`tools.${tool.slug}.short`)}
        </span>
      </span>
    </Link>
  )
}
