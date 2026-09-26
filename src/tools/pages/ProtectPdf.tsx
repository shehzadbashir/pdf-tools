import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { CheckRow, ErrorBox, Field, SectionTitle } from '@/components/ui'
import { ProgressBar } from '@/components/Progress'
import { Results, type OutputFile } from '@/components/Results'
import { FileChip } from '@/components/FileChip'
import { useToolRunner, singleSummary } from '../job'
import { protectPdf, type PermissionFlags } from '@/lib/secure'
import { withExtension } from '@/lib/files'
import { recordHistory } from '@/lib/history'

export default function ProtectPdf(): ReactNode {
  const { t } = useTranslation()
  const runner = useToolRunner()
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<PermissionFlags>({
    print: true,
    copy: false,
    modify: false,
    annotate: false,
    forms: true,
  })
  const [output, setOutput] = useState<OutputFile[]>([])

  const toggle = (key: keyof PermissionFlags): void => {
    setPermissions((current) => ({ ...current, [key]: !current[key] }))
  }

  const start = (): void => {
    if (!file) return
    setLocalError(null)
    if (password.length < 6) {
      setLocalError(t('ui.passwordTooShort'))
      return
    }
    if (password !== confirm) {
      setLocalError(t('ui.passwordMismatch'))
      return
    }

    void runner.run(async () => {
      const bytes = new Uint8Array(await file.arrayBuffer())
      runner.setLabel(t('common.processing'))
      const encrypted = await protectPdf(bytes, {
        password,
        ownerPassword: ownerPassword.trim() || undefined,
        permissions,
      })
      setOutput([{ name: withExtension(file.name, 'pdf'), data: encrypted }])
      await recordHistory({
        slug: 'protect-pdf',
        toolName: t('tools.protect-pdf.name'),
        files: singleSummary(file),
      })
    })
  }

  const reset = (): void => {
    setFile(null)
    setPassword('')
    setConfirm('')
    setOwnerPassword('')
    setOutput([])
    setLocalError(null)
    runner.reset()
  }

  if (output.length > 0) {
    return <Results files={output} onReset={reset} resetLabel={t('common.retry')} />
  }

  return (
    <div className="space-y-5">
      {!file ? (
        <Dropzone
          accept="application/pdf,.pdf"
          onFiles={(files) => setFile(files[0] ?? null)}
          title={t('ui.dropHere')}
          subtitle={t('ui.onlyPdf')}
        />
      ) : (
        <>
          <FileChip file={file} onRemove={reset} />

          <Field label={t('tools.protect-pdf.ui.openPassword')}>
            <input
              type="password"
              className="field"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          <Field label={t('tools.protect-pdf.ui.confirmPassword')}>
            <input
              type="password"
              className="field"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </Field>

          <Field
            label={`${t('tools.protect-pdf.ui.ownerPassword')} (${t('common.optional')})`}
            hint={t('tools.protect-pdf.ui.ownerHint')}
          >
            <input
              type="password"
              className="field"
              autoComplete="new-password"
              value={ownerPassword}
              onChange={(event) => setOwnerPassword(event.target.value)}
            />
          </Field>

          <div>
            <SectionTitle>{t('tools.protect-pdf.ui.permissions')}</SectionTitle>
            <div className="grid gap-0.5 sm:grid-cols-2">
              <CheckRow
                label={t('tools.protect-pdf.ui.allowPrint')}
                checked={permissions.print}
                onChange={() => toggle('print')}
              />
              <CheckRow
                label={t('tools.protect-pdf.ui.allowCopy')}
                checked={permissions.copy}
                onChange={() => toggle('copy')}
              />
              <CheckRow
                label={t('tools.protect-pdf.ui.allowModify')}
                checked={permissions.modify}
                onChange={() => toggle('modify')}
              />
              <CheckRow
                label={t('tools.protect-pdf.ui.allowAnnotate')}
                checked={permissions.annotate}
                onChange={() => toggle('annotate')}
              />
            </div>
          </div>

          <p className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-xs leading-relaxed text-[var(--ink-2)]">
            {t('tools.protect-pdf.ui.hint')}
          </p>

          <button type="button" className="btn btn-primary w-full" onClick={start} disabled={runner.busy}>
            <Lock size={16} />
            {t('tools.protect-pdf.ui.protect')}
          </button>
        </>
      )}

      {runner.busy ? (
        <ProgressBar value={runner.progress} label={runner.label ?? t('common.processing')} />
      ) : null}
      <ErrorBox>{localError ?? runner.error}</ErrorBox>
    </div>
  )
}
