import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { en } from './en'
import { ur } from './ur'
import { ar } from './ar'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ur', label: 'اردو', short: 'UR' },
  { code: 'ar', label: 'العربية', short: 'AR' },
] as const

export type LanguageCode = 'en' | 'ur' | 'ar'

export function directionOf(language: string): 'ltr' | 'rtl' {
  return language.startsWith('en') ? 'ltr' : 'rtl'
}

export function normaliseLanguage(value: string | undefined | null): LanguageCode {
  const code = (value ?? 'en').toLowerCase().slice(0, 2)
  return code === 'ur' || code === 'ar' ? code : 'en'
}

if (!i18n.isInitialized) {
  void i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
      resources: {
        en: { translation: en },
        ur: { translation: ur },
        ar: { translation: ar },
      },
      fallbackLng: 'en',
      supportedLngs: ['en', 'ur', 'ar'],
      load: 'languageOnly',
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
        lookupLocalStorage: 'pt.lang',
        htmlTag: undefined,
      },
      returnObjects: true,
      saveMissing: false,
    })
}

/** Applies lang/dir to <html> so Tailwind logical properties and text align correctly. */
export function applyDocumentLanguage(language: string): void {
  const lang = normaliseLanguage(language)
  const dir = directionOf(lang)
  document.documentElement.lang = lang
  document.documentElement.dir = dir
}

export default i18n
