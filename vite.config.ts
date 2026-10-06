import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { writeFileSync, existsSync, rmSync, mkdirSync, readFileSync } from 'node:fs'
import { SITE, TOOL_SLUGS } from './src/config/site.ts'
import { en } from './src/i18n/en.ts'
import { TOOL_CONTENT } from './src/content/tools.ts'
import { BLOG_POSTS } from './src/content/blog.ts'
import { CONTACT_EMAIL } from './src/content/static.ts'

/** Escapes text for use inside an HTML attribute or element body. */
const esc = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

interface RouteMeta {
  /** Directory name in the build output, `''` for the home page. */
  dir: string
  /** Absolute URL of the page. */
  url: string
  title: string
  description: string
  robots: string
  jsonLd: Record<string, unknown>[]
}

const full = (title: string): string => `${title} | ${SITE.name}`

function buildRoutes(): RouteMeta[] {
  const base = SITE.url.replace(/\/$/, '')
  const home = en.home as unknown as Record<string, string>
  const faqEntries = ['faq1', 'faq2', 'faq3', 'faq4'].map((key) => ({
    '@type': 'Question',
    name: home[`${key}q`] ?? '',
    acceptedAnswer: { '@type': 'Answer', text: home[`${key}a`] ?? '' },
  }))

  const routes: RouteMeta[] = [
    {
      dir: '',
      url: `${base}/`,
      title: SITE.homeTitle,
      description: SITE.homeDescription,
      robots: 'index, follow',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE.name,
          url: `${base}/`,
          description: SITE.homeDescription,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: SITE.name,
          url: `${base}/`,
          logo: `${base}/favicon.svg`,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqEntries,
        },
      ],
    },
  ]

  for (const slug of TOOL_SLUGS) {
    const tool = en.tools[slug]
    const name = tool.name
    const short = tool.short
    const content = TOOL_CONTENT[slug]
    const jsonLd: Record<string, unknown>[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name,
        description: tool.long,
        step: tool.steps.map((text, index) => ({
          '@type': 'HowToStep',
          name: `Step ${index + 1}`,
          text,
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
          { '@type': 'ListItem', position: 2, name, item: `${base}/${slug}` },
        ],
      },
    ]
    if (content && content.faq.length > 0) {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: content.faq.map((entry) => ({
          '@type': 'Question',
          name: entry.q,
          acceptedAnswer: { '@type': 'Answer', text: entry.a },
        })),
      })
    }
    routes.push({
      dir: slug,
      url: `${base}/${slug}`,
      title: full(`${name} — ${short.replace(/\.$/, '')}`),
      description: short,
      robots: 'index, follow',
      jsonLd,
    })
  }

  routes.push(
    {
      dir: 'blog',
      url: `${base}/blog`,
      title: full(en.blog.title),
      description: en.blog.subtitle,
      robots: 'index, follow',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: en.blog.title,
          description: en.blog.subtitle,
          url: `${base}/blog`,
        },
      ],
    },
    {
      dir: 'about',
      url: `${base}/about`,
      title: full(en.about.title),
      description: en.about.subtitle,
      robots: 'index, follow',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: en.about.title,
          description: en.about.subtitle,
          url: `${base}/about`,
        },
      ],
    },
    {
      dir: 'contact',
      url: `${base}/contact`,
      title: full(en.contact.title),
      description: en.contact.subtitle,
      robots: 'index, follow',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: en.contact.title,
          url: `${base}/contact`,
          mainEntity: {
            '@type': 'Organization',
            name: SITE.name,
            email: CONTACT_EMAIL,
            url: `${base}/`,
          },
        },
      ],
    },
    {
      dir: 'dmca',
      url: `${base}/dmca`,
      title: full(en.dmca.title),
      description: en.dmca.subtitle,
      robots: 'index, follow',
      jsonLd: [],
    },
    {
      dir: 'privacy',
      url: `${base}/privacy`,
      title: full(en.legal.privacyTitle),
      description: en.legal.privacy1,
      robots: 'index, follow',
      jsonLd: [],
    },
    {
      dir: 'terms',
      url: `${base}/terms`,
      title: full(en.legal.termsTitle),
      description: en.legal.terms1,
      robots: 'index, follow',
      jsonLd: [],
    },
    {
      dir: 'history',
      url: `${base}/history`,
      title: full(en.history.title),
      description: en.history.subtitle,
      robots: 'noindex, nofollow',
      jsonLd: [],
    },
  )

  for (const post of BLOG_POSTS) {
    routes.push({
      dir: `blog/${post.slug}`,
      url: `${base}/blog/${post.slug}`,
      title: full(post.title),
      description: post.excerpt,
      robots: 'index, follow',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          datePublished: post.published,
          dateModified: post.updated,
          author: { '@type': 'Organization', name: SITE.name, url: `${base}/` },
          publisher: { '@type': 'Organization', name: SITE.name, url: `${base}/` },
          mainEntityOfPage: `${base}/blog/${post.slug}`,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
            { '@type': 'ListItem', position: 2, name: en.blog.title, item: `${base}/blog` },
            { '@type': 'ListItem', position: 3, name: post.title, item: `${base}/blog/${post.slug}` },
          ],
        },
      ],
    })
  }

  return routes
}

/**
 * Rewrites the built HTML head so every route ships a unique title,
 * description, canonical URL and JSON-LD payload in the *static* markup.
 * Crawlers that do not run JavaScript still index each page correctly.
 */
function applyRouteHead(html: string, route: RouteMeta): string {
  let out = html
  const replace = (pattern: RegExp, replacement: string): void => {
    out = out.replace(pattern, replacement)
  }

  replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(route.title)}</title>`)
  replace(
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${esc(route.description)}" />`,
  )
  replace(
    /<meta\s+name="robots"[\s\S]*?\/>/,
    `<meta name="robots" content="${esc(route.robots)}" />`,
  )
  replace(
    /<meta\s+property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${esc(route.title)}" />`,
  )
  replace(
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${esc(route.description)}" />`,
  )

  const head: string[] = []
  if (route.url) {
    head.push(
      `<link rel="canonical" href="${route.url}" />`,
      `<meta property="og:url" content="${route.url}" />`,
    )
  }
  head.push(
    `<meta name="twitter:title" content="${esc(route.title)}" />`,
    `<meta name="twitter:description" content="${esc(route.description)}" />`,
  )
  if (SITE.googleSearchConsoleVerification) {
    head.push(
      `<meta name="google-site-verification" content="${esc(SITE.googleSearchConsoleVerification)}" />`,
    )
  }
  for (const payload of route.jsonLd) {
    head.push(`<script type="application/ld+json">${JSON.stringify(payload)}</script>`)
  }

  return out.replace('</head>', `    ${head.join('\n    ')}\n  </head>`)
}

/**
 * Emits robots.txt, sitemap.xml and a statically-headed HTML file for every
 * route so the URLs are always absolute and always in sync with routing.
 */
function searchEnginePlugin(): Plugin {
  return {
    name: 'search-engine-files',
    apply: 'build',
    closeBundle() {
      const out = path.resolve(import.meta.dirname, 'dist')
      if (!existsSync(out)) return

      const url = SITE.url.replace(/\/$/, '')
      const routes = [
        '/',
        ...TOOL_SLUGS.map((slug) => `/${slug}`),
        '/blog',
        ...BLOG_POSTS.map((post) => `/blog/${post.slug}`),
        '/about',
        '/contact',
        '/dmca',
        '/privacy',
        '/terms',
      ]

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...routes.map((route, i) =>
          [
            '  <url>',
            `    <loc>${url}${route === '/' ? '/' : route}</loc>`,
            `    <changefreq>${i === 0 ? 'daily' : 'weekly'}</changefreq>`,
            `    <priority>${i === 0 ? '1.0' : '0.8'}</priority>`,
            '  </url>',
          ].join('\n'),
        ),
        '</urlset>',
        '',
      ].join('\n')

      const robots = [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${url}/sitemap.xml`,
        '',
      ].join('\n')

      writeFileSync(path.join(out, 'sitemap.xml'), xml, 'utf8')
      writeFileSync(path.join(out, 'robots.txt'), robots, 'utf8')
      rmSync(path.join(out, 'vite.svg'), { force: true })

      const routeMeta = buildRoutes()

      // Per-route static head (title / description / canonical / JSON-LD).
      const template = readFileSync(path.join(out, 'index.html'), 'utf8')
      for (const route of routeMeta) {
        const dir = route.dir ? path.join(out, route.dir) : out
        mkdirSync(dir, { recursive: true })
        writeFileSync(path.join(dir, 'index.html'), applyRouteHead(template, route), 'utf8')
      }

      // Real 404s: unknown URLs return status 404 with the app shell, so the
      // router can render the not-found page instead of soft-404ing as home.
      writeFileSync(
        path.join(out, '404.html'),
        applyRouteHead(template, {
          dir: '',
          url: '',
          title: full('Page not found'),
          description: en.notFound.desc,
          robots: 'noindex, nofollow',
          jsonLd: [],
        }),
        'utf8',
      )

      // Serve every tool URL directly instead of letting Pages issue a 308 to
      // the trailing-slash form, so the canonical URL and the served URL match.
      const redirects = [
        ...routeMeta.filter((route) => route.dir).map((route) => `/${route.dir}  /${route.dir}/  200`),
        '/*  /404.html  404',
        '',
      ]
      writeFileSync(path.join(out, '_redirects'), redirects.join('\n'), 'utf8')
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), searchEnginePlugin()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('pdfjs-dist')) return 'pdfjs'
            if (id.includes('tesseract')) return 'ocr'
            if (id.includes('mammoth') || id.includes('docx') || id.includes('xlsx')) return 'office'
            if (id.includes('react-router')) return 'router'
            if (id.includes('i18next')) return 'i18n'
            return 'vendor'
          }
        },
      },
    },
  },
})
