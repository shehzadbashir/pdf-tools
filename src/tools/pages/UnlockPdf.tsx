import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LockOpen } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { ErrorBox, Field, Notice } from '@/components/ui'
import { ProgressBar } from '@/components/Progress'
import { Results, type OutputFile } from '@/components/Results'
import { FileChip } from '@/components/FileChip'
import { useToolRunner, singleSummary } from '../job'
import { unlockPdf } from '@/lib/secure'
import { withExtension } from '@/lib/files'
import { recordHistory } from '@/lib/history'

export default function UnlockPdf(): ReactNode {
  const { t } = useTranslation()
  const runner = useToolRunner()
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [output, setOutput] = useState<OutputFile[]>([])

  const start = (): void => {
    if (!file) return
    setLocalError(null)
    setNotice(null)
    void runner.run(async () => {
      const bytes = new Uint8Array(await file.arrayBuffer())
      runner.setLabel(t('common.processing'))
      const result = await unlockPdf(bytes, password)

      if (!result.ok || !result.bytes) {
        if (result.reason === 'not-encrypted') {
          setNotice(t('ui.notEncrypted'))
          return
        }
        if (result.reason === 'wrong-password') {
          setLocalError(t('ui.wrongPassword'))
          return
        }
        setLocalError(t('ui.unsupported'))
        return
      }

      setOutput([{ name: withExtension(file.name, 'pdf'), data: result.bytes }])
      await recordHistory({
        slug: 'unlock-pdf',
        toolName: t('tools.unlock-pdf.name'),
        files: singleSummary(file),
      })
    })
  }

  const reset = (): void => {
    setFile(null)
    setPassword('')
    setOutput([])
    setLocalError(null)
    setNotice(null)
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

          <Field label={t('tools.unlock-pdf.ui.enterPassword')}>
            <input
              type="password"
              className="field"
              autoComplete="off"
              value={password}
              placeholder={t('common.password')}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && password) start()
              }}
            />
          </Field>

          <Notice>{t('common.secureNote')}</Notice>

          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={start}
            disabled={runner.busy || password.length === 0}
          >
            <LockOpen size={16} />
            {t('tools.unlock-pdf.ui.unlock')}
          </button>
        </>
      )}

      {runner.busy ? (
        <ProgressBar value={runner.progress} label={runner.label ?? t('common.processing')} />
      ) : null}
      {notice ? (
        <p className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {notice}
        </p>
      ) : null}
      <ErrorBox>{localError ?? runner.error}</ErrorBox>
    </div>
  )
}
