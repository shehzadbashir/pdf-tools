import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { FileType } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { ErrorBox, RadioGroup, SectionTitle } from '@/components/ui'
import { ProgressBar } from '@/components/Progress'
import { Results, type OutputFile } from '@/components/Results'
import { FileChip } from '@/components/FileChip'
import { useToolRunner, singleSummary } from '../job'
import { pdfToDocx, type DocxMode } from '@/lib/convert'
import { withExtension } from '@/lib/files'
import { recordHistory } from '@/lib/history'

export default function PdfToWord(): ReactNode {
  const { t } = useTranslation()
  const runner = useToolRunner()
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<DocxMode>('editable')
  const [output, setOutput] = useState<OutputFile[]>([])

  const start = (): void => {
    if (!file) return
    void runner.run(async () => {
      const bytes = new Uint8Array(await file.arrayBuffer())
      runner.setLabel(t('common.processing'))
      const docx = await pdfToDocx(bytes, file.name, {
        mode,
        onProgress: (fraction) => runner.setProgress(fraction),
      })
      setOutput([{ name: withExtension(file.name, 'docx'), data: docx, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }])
      await recordHistory({
        slug: 'pdf-to-word',
        toolName: t('tools.pdf-to-word.name'),
        files: singleSummary(file),
      })
    })
  }

  const reset = (): void => {
    setFile(null)
    setOutput([])
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

          <div>
            <SectionTitle>{t('tools.pdf-to-word.ui.mode')}</SectionTitle>
            <RadioGroup<DocxMode>
              name="docx-mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'editable', label: t('tools.pdf-to-word.ui.editable') },
                { value: 'faithful', label: t('tools.pdf-to-word.ui.faithful') },
              ]}
            />
          </div>

          <button type="button" className="btn btn-primary w-full" onClick={start} disabled={runner.busy}>
            <FileType size={16} />
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
