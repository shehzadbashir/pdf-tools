import { useEffect, type ReactNode } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Analytics } from '@/components/Analytics'
import { applyDocumentLanguage, normaliseLanguage } from '@/i18n'
import { useTranslation } from 'react-i18next'

export function Layout(): ReactNode {
  const { i18n } = useTranslation()
  const location = useLocation()

  useEffect(() => {
    applyDocumentLanguage(normaliseLanguage(i18n.resolvedLanguage ?? i18n.language))
  }, [i18n.resolvedLanguage, i18n.language])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Analytics />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  )
}
