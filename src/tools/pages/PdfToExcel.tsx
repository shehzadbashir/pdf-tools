import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Table2 } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { ErrorBox, Field } from '@/components/ui'
import { ProgressBar } from '@/components/Progress'
import { Results, type OutputFile } from '@/components/Results'
import { FileChip } from '@/components/FileChip'
import { useToolRunner, singleSummary } from '../job'
import { pdfToXlsx } from '@/lib/convert'
import { baseName, withExtension } from '@/lib/files'
import { recordHistory } from '@/lib/history'

export default function PdfToExcel(): ReactNode {
  const { t } = useTranslation()
  const runner = useToolRunner()
  const [file, setFile] = useState<File | null>(null)
  const [sheetName, setSheetName] = useState('')
  const [output, setOutput] = useState<OutputFile[]>([])
  const [info, setInfo] = useState<string | null>(null)

  const start = (): void => {
    if (!file) return
    void runner.run(async () => {
      const bytes = new Uint8Array(await file.arrayBuffer())
      runner.setLabel(t('common.processing'))
      const result = await pdfToXlsx(bytes, file.name, {
        sheetName: sheetName.trim() || baseName(file.name),
        onProgress: (fraction) => runner.setProgress(fraction),
      })
      setOutput([
        {
          name: withExtension(file.name, 'xlsx'),
          data: result.bytes,
          mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ])
      setInfo(
        result.rowCount > 0
          ? t('tools.pdf-to-excel.ui.rowsFound', { count: result.rowCount })
          : t('tools.pdf-to-excel.ui.noTable'),
      )
      await recordHistory({
        slug: 'pdf-to-excel',
        toolName: t('tools.pdf-to-excel.name'),
        files: singleSummary(file),
      })
    })
  }

  const reset = (): void => {
    setFile(null)
    setOutput([])
    setInfo(null)
    runner.reset()
  }

  if (output.length > 0) {
    return (
      <div className="space-y-4">
        {info ? (
          <p className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--ink-2)]">
            {info}
          </p>
        ) : null}
        <Results files={output} onReset={reset} resetLabel={t('common.retry')} />
      </div>
    )
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

          <Field label={t('tools.pdf-to-excel.ui.sheetName')}>
            <input
              className="field"
              value={sheetName}
              placeholder={baseName(file.name)}
              onChange={(event) => setSheetName(event.target.value)}
            />
          </Field>

          <button type="button" className="btn btn-primary w-full" onClick={start} disabled={runner.busy}>
            <Table2 size={16} />
            {t('common.start')}
          </button>
        </>
      )}

      {runner.busy ? (
        <ProgressBar value={runner.progress} label={runner.label ?? t('common.processing')} />
      ) : null}
      <ErrorBox>{runner.error}</ErrorBox>
    </div>
  )
}
