declare module 'pdf-lib-encrypt' {
  import type { PDFDocument } from 'pdf-lib'

  /** Injects the pdf-lib module instance the library should operate on. */
  export function configure(pdfLib: unknown): void

  export interface LockOptions {
    /** AES-256 (default) or legacy RC4-128. */
    algo?: 'aes256' | 'rc4'
    /** Raw signed 32-bit PDF /P permissions bitfield. Defaults to -4 (allow everything). */
    permissions?: number
  }

  /** Encrypts a plaintext PDF. Throws when the input is already encrypted. */
  export function lock(plainBytes: Uint8Array, password: string, opts?: LockOptions): Promise<Uint8Array>

  /**
   * Decrypts a document that was loaded with `{ ignoreEncryption: true }`.
   * Resolves `true` when it was encrypted and is now unlocked, `false` when the
   * document was not encrypted at all. Throws on a wrong password or on an
   * encryption mode it cannot handle.
   */
  export function unlockInPlace(doc: PDFDocument, password: string): Promise<boolean>
}
