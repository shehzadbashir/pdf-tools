import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, ChevronRight, Home, PenLine } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useHead } from '@/lib/head'
import { BLOG_POSTS } from '@/content/blog'

export default function Blog(): ReactNode {
  const { t } = useTranslation()

  useHead({
    title: t('blog.title'),
    description: t('blog.subtitle'),
    path: '/blog',
  })

  return (
    <div className="page-container py-12">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[var(--ink-2)]">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-brand-600">
          <Home size={12} />
          {t('common.home')}
        </Link>
        <ChevronRight size={12} className="rtl:rotate-180" />
        <span className="font-semibold text-[var(--ink)]">{t('common.blog')}</span>
      </nav>

      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
          <PenLine size={20} />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">
            {t('blog.title')}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)]">
            {t('blog.subtitle')}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {BLOG_POSTS.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            className="group flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:border-brand-400/60 hover:shadow-[0_16px_40px_-24px_rgba(79,70,229,0.6)]"
          >
            <span className="flex items-center gap-2 text-xs text-[var(--ink-2)]">
              <CalendarDays size={13} />
              {t('common.publishedOn')} {post.published}
              <span aria-hidden="true">·</span>
              {post.readTime}
            </span>
            <h2 className="text-base font-bold leading-snug text-[var(--ink)] transition group-hover:text-brand-600">
              {post.title}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--ink-2)]">{post.excerpt}</p>
            <span className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-brand-600">
              {t('common.readMore')}
              <ArrowRight size={14} className="transition group-hover:translate-x-0.5 rtl:rotate-180" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}