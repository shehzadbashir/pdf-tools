import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { writeFileSync, existsSync, rmSync } from 'node:fs'
import { SITE, TOOL_SLUGS } from './src/config/site.ts'

/**
 * Emits robots.txt + sitemap.xml into the build output so that the URLs are
 * always absolute and always in sync with the routing table.
 */
function searchEnginePlugin(): Plugin {
  return {
    name: 'search-engine-files',
    apply: 'build',
    closeBundle() {
      const out = path.resolve(import.meta.dirname, 'dist')
      if (!existsSync(out)) return

      const url = SITE.url.replace(/\/$/, '')
      const routes = ['/', ...TOOL_SLUGS.map((slug) => `/${slug}`), '/privacy', '/terms']

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
