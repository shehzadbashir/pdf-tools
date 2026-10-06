import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, FileQuestion } from 'lucide-react'
import { useHead } from '@/lib/head'

export function NotFoundPageContent(): ReactNode {
  const { t } = useTranslation()

  return (
    <div className="page-container flex flex-col items-center justify-center gap-5 py-24 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-3xl bg-brand-500/10 text-brand-600">
        <FileQuestion size={34} />
      </span>
      <h1 className="text-4xl font-black tracking-tight text-[var(--ink)]">
        {t('notFound.title')}
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-[var(--ink-2)]">
        {t('notFound.desc')}
      </p>
      <Link to="/" className="btn btn-primary">
        <ArrowLeft size={16} className="rtl:rotate-180" />
        {t('notFound.cta')}
      </Link>
    </div>
  )
}

export default function NotFound(): ReactNode {
  const { t } = useTranslation()
  useHead({ title: t('notFound.title'), description: t('notFound.desc') })
  return <NotFoundPageContent />
}
