import { Suspense, lazy, type ComponentType, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { TOOLS } from '@/tools/registry'
import { ToolRoute } from '@/tools/ToolLayout'

const Home = lazy(() => import('@/pages/Home'))
const HistoryPage = lazy(() => import('@/pages/History'))
const LegalPage = lazy(() => import('@/pages/Legal'))
const NotFoundPage = lazy(() => import('@/pages/NotFound'))
const BlogPage = lazy(() => import('@/pages/Blog'))
const BlogPostPage = lazy(() => import('@/pages/BlogPost'))
const AboutPage = lazy(() => import('@/pages/About'))
const ContactPage = lazy(() => import('@/pages/Contact'))
const DmcaPage = lazy(() => import('@/pages/Dmca'))

function lazy_(Component: ComponentType): ReactNode {
  return (
    <Suspense
      fallback={
        <div className="page-container py-20">
          <div className="card flex min-h-72 items-center justify-center text-sm text-[var(--ink-2)]">
            &hellip;
          </div>
        </div>
      }
    >
      <Component />
    </Suspense>
  )
}

export default function App(): ReactNode {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={lazy_(Home)} />
        {TOOLS.map((tool) => (
          <Route
            key={tool.slug}
            path={tool.path}
            element={<ToolRoute slug={tool.slug} />}
          />
        ))}
        <Route path="/history" element={lazy_(HistoryPage)} />
        <Route path="/blog" element={lazy_(BlogPage)} />
        <Route path="/blog/:slug" element={lazy_(BlogPostPage)} />
        <Route path="/about" element={lazy_(AboutPage)} />
        <Route path="/contact" element={lazy_(ContactPage)} />
        <Route path="/dmca" element={lazy_(DmcaPage)} />
        <Route path="/privacy" element={<LegalPage kind="privacy" />} />
        <Route path="/terms" element={<LegalPage kind="terms" />} />
        <Route path="*" element={lazy_(NotFoundPage)} />
      </Route>
    </Routes>
  )
}
