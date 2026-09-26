import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, applyDocumentLanguage, normaliseLanguage } from '@/i18n'

export function LanguageSwitch(): ReactNode {
  const { i18n } = useTranslation()
  const current = normaliseLanguage(i18n.resolvedLanguage ?? i18n.language)

  const change = (code: string): void => {
    void i18n.changeLanguage(code)
    applyDocumentLanguage(code)
  }

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg border border-[var(--line)] p-0.5"
      role="group"
      aria-label="Language"
    >
      {SUPPORTED_LANGUAGES.map((lang) => {
        const active = lang.code === current
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => change(lang.code)}
            aria-pressed={active}
            title={lang.label}
            className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
              active
                ? 'bg-brand-600 text-white'
                : 'text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
            }`}
          >
            {lang.short}
          </button>
        )
      })}
    </div>
  )
}
