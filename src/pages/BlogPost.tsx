import { useEffect, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, ChevronRight, Home, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useHead } from '@/lib/head'
import { SITE } from '@/config/site'
import { BLOG_POSTS, postBySlug } from '@/content/blog'
import { toolBySlug } from '@/tools/registry'
import { NotFoundPageContent } from '@/pages/NotFound'
import { AdSlot } from '@/components/AdSlot'

function postJsonLd(
  post: (typeof BLOG_POSTS)[number],
): Record<string, unknown> {
  const base = SITE.url.replace(/\/$/, '')
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published,
    dateModified: post.updated,
    image: `${base}/og-image.png`,
    author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
      logo: { '@type': 'ImageObject', url: `${base}/favicon.svg` },
    },
    mainEntityOfPage: `${base}/blog/${post.slug}`,
  }
}

export function BlogPostPage({ slug }: { slug: string }): ReactNode {
  const { t } = useTranslation()
  const post = postBySlug(slug)

  useHead(
    post
      ? {
          title: post.title,
          description: post.excerpt,
          path: `/blog/${post.slug}`,
          type: 'article',
          publishedTime: post.published,
          updatedTime: post.updated,
        }
      : { title: 'Page not found', description: t('notFound.desc'), robots: 'noindex, nofollow' },
  )

  useEffect(() => {
    if (!post) return
    const node = document.createElement('script')
    node.type = 'application/ld+json'
    node.id = `ld-post-${post.slug}`
    node.textContent = JSON.stringify(postJsonLd(post))
    document.head.appendChild(node)
    return () => {
      node.remove()
    }
  }, [post])

  if (!post) return <NotFoundPageContent />

  const relatedTools = post.relatedTools
    .map(toolBySlug)
    .filter((tool): tool is NonNullable<ReturnType<typeof toolBySlug>> => Boolean(tool))

  return (
    <article className="page-container py-12">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[var(--ink-2)]">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-brand-600">
          <Home size={12} />
          {t('common.home')}
        </Link>
        <ChevronRight size={12} className="rtl:rotate-180" />
        <Link to="/blog" className="hover:text-brand-600">
          {t('common.blog')}
        </Link>
        <ChevronRight size={12} className="rtl:rotate-180" />
        <span className="line-clamp-1 font-semibold text-[var(--ink)]">{post.title}</span>
      </nav>

      <div className="mx-auto max-w-3xl">
        <header>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[var(--ink)] sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[var(--ink-2)]">{post.excerpt}</p>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ink-2)]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} />
              {t('common.publishedOn')} {post.published}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw size={13} />
              {t('common.updatedOn')} {post.updated}
            </span>
            <span>{post.readTime}</span>
          </p>
        </header>

        <AdSlot label="Advertisement" slot="horizontal" format="horizontal" className="mb-8 mt-8" />

        <div className="space-y-8 border-t border-[var(--line)] pt-8">
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-extrabold tracking-tight text-[var(--ink)]">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-2)]"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        {relatedTools.length > 0 ? (
              <section className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
                <h2 className="text-lg font-extrabold tracking-tight text-[var(--ink)]">
                  {t('common.relatedTools')}
                </h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                  {relatedTools.map((tool) => (
                    <li key={tool.slug}>
                      <Link
                        to={tool.path}
                        className="flex items-center gap-2.5 rounded-xl border border-[var(--line)] p-3 text-sm font-semibold text-[var(--ink)] transition hover:border-brand-400/60 hover:text-brand-600"
                      >
                        <tool.icon size={16} className="shrink-0 text-brand-600" />
                        <span className="min-w-0 flex-1 truncate">{t(`tools.${tool.slug}.name`)}</span>
                        <ChevronRight size={14} className="rtl:rotate-180" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

        <nav className="mt-10">
          <Link to="/blog" className="btn btn-ghost">
            {t('common.backToBlog')}
          </Link>
        </nav>
      </div>
    </article>
  )
}

export default function BlogPost(): ReactNode {
  const { slug } = useParams<{ slug: string }>()
  return <BlogPostPage slug={slug ?? ''} />
}