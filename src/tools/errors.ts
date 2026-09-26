import type { TFunction } from 'i18next'
import { PdfPasswordError } from '@/lib/pdfjs'

/**
 * Maps the many low-level errors the PDF libraries throw onto a short,
 * user-facing sentence from the active translation.
 */
export function describeError(error: unknown, t: TFunction): string {
  const raw =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : typeof error === 'string'
        ? error
        : ''

  const lower = raw.toLowerCase()

  if (error instanceof PdfPasswordError || /passwordexception|password required/.test(lower)) {
    return t('ui.needsPassword')
  }
  if (/wrong password|incorrect password|invalid password/.test(lower)) {
    return t('ui.wrongPassword')
  }
  if (/already_encrypted|already encrypted/.test(lower)) {
    return t('ui.alreadyEncrypted')
  }
  if (/encryptedpdferror|is encrypted|encrypted document/.test(lower)) {
    return t('ui.alreadyEncrypted')
  }
  if (/not_encrypted|not encrypted/.test(lower)) {
    return t('ui.notEncrypted')
  }
  if (/unsupported|object streams|security handler|no_subtle|insecure/.test(lower)) {
    return t('ui.unsupported')
  }
  if (/nothing_configured/.test(lower)) {
    return t('tools.watermark-pdf.ui.nothing')
  }
  if (/memory|allocation|out of/.test(lower)) {
    return t('common.error')
  }
  if (/network|failed to fetch|load failed/.test(lower)) {
    return t('common.error')
  }

  return t('common.error')
}
