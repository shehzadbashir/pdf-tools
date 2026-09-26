import { PDFDocument } from 'pdf-lib'
import * as pdfLib from 'pdf-lib'
import { configure, lock, unlockInPlace } from 'pdf-lib-encrypt'
import { openPdf } from './pdfjs'

configure(pdfLib)

export interface PermissionFlags {
  print: boolean
  modify: boolean
  copy: boolean
  annotate: boolean
  forms: boolean
}

/** Builds the raw signed 32-bit PDF /P bitfield from user-facing flags. */
function permissionsBitfield(flags: Partial<PermissionFlags>): number {
  let p = -4 // everything allowed, reserved bits 1-2 clear
  if (flags.print === false) p &= ~(1 << 2)
  if (flags.modify === false) p &= ~(1 << 3)
  if (flags.copy === false) p &= ~(1 << 4)
  if (flags.annotate === false) p &= ~(1 << 5)
  if (flags.forms === false) p &= ~(1 << 8)
  return p | 0
}

export async function isEncrypted(bytes: Uint8Array): Promise<boolean> {
  try {
    await PDFDocument.load(bytes, { ignoreEncryption: false })
    return false
  } catch (err) {
    if (err instanceof Error && /encrypt/i.test(err.name + err.message)) return true
    return false
  }
}

export interface ProtectOptions {
  password: string
  ownerPassword?: string
  permissions?: Partial<PermissionFlags>
}

export async function protectPdf(bytes: Uint8Array, opts: ProtectOptions): Promise<Uint8Array> {
  if (!opts.password) throw new Error('PASSWORD_REQUIRED')
  if (await isEncrypted(bytes)) throw new Error('ALREADY_ENCRYPTED')

  const permissions = permissionsBitfield(opts.permissions ?? {})
  try {
    return await lock(bytes, opts.password, { algo: 'aes256', permissions })
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'NO_SUBTLE') throw new Error('INSECURE_CONTEXT')
    throw err
  }
}

export type UnlockFailure =
  | 'wrong-password'
  | 'not-encrypted'
  | 'unsupported'
  | 'unknown'

export interface UnlockResult {
  ok: boolean
  bytes?: Uint8Array
  reason?: UnlockFailure
  message?: string
}

/**
 * Removes password protection.
 *
 * Two strategies are tried, because each covers cases the other cannot:
 *  1. pdf-lib-encrypt — precise, but refuses documents that use compressed
 *     object streams (very common in files written by Acrobat).
 *  2. pdf.js — decrypts for rendering and re-serialises the whole document,
 *     which handles those files but cannot always strip the security handler.
 *
 * The candidate is always re-loaded without `ignoreEncryption` to prove it really
 * came out unencrypted before we hand it to the user.
 */
export async function unlockPdf(bytes: Uint8Array, password: string): Promise<UnlockResult> {
  if (!(await isEncrypted(bytes))) return { ok: false, reason: 'not-encrypted' }

  let sawWrongPassword = false
  let sawUnsupported = false

  // ── Strategy 1: pdf-lib-encrypt ────────────────────────────────────────
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false })
    await unlockInPlace(doc, password)
    const plain = await doc.save({ useObjectStreams: false })
    await PDFDocument.load(plain, { ignoreEncryption: false })
    return { ok: true, bytes: plain }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/wrong password/i.test(message)) sawWrongPassword = true
    if (/object streams|unsupported security handler/i.test(message)) sawUnsupported = true
  }

  // ── Strategy 2: pdf.js re-serialisation ────────────────────────────────
  try {
    const doc = await openPdf(bytes, password)
    const saved = await doc.saveDocument()
    await doc.cleanup()
    await PDFDocument.load(saved, { ignoreEncryption: false })
    return { ok: true, bytes: saved }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (err instanceof Error && err.name === 'PdfPasswordError') sawWrongPassword = true
    if (/password/i.test(message)) sawWrongPassword = true
  }

  if (sawWrongPassword) return { ok: false, reason: 'wrong-password' }
  if (sawUnsupported) return { ok: false, reason: 'unsupported' }
  return { ok: false, reason: 'unknown' }
}
