import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { FileType } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { ErrorBox, Field, RadioGroup } from '@/components/ui'
import { ProgressBar } from '@/components/Progress'
import { Results, type OutputFile } from '@/components/Results'
import { FileChip } from '@/components/FileChip'
import { useToolRunner, singleSummary } from '../job'
import { docxToPdf, type PageLayout } from '@/lib/convert'
import { withExtension } from '@/lib/files'
import { recordHistory } from '@/lib/history'

const MARGINS = [
  { value: 0, label: '0 mm' },
  { value: 10, label: '10 mm' },
  { value: 25, label: '25 mm' },
]

export default function WordToPdf(): ReactNode {
  const { t } = useTranslation()
  const runner = useToolRunner()
  const [file, setFile] = useState<File | null>(null)
  const [layout, setLayout] = useState<PageLayout>('a4')
  const [marginMm, setMarginMm] = useState(25)
  const [output, setOutput] = useState<OutputFile[]>([])

  const accept = (files: File[]): void => {
    const next = files[0]
    if (!next) return
    if (!/\.(docx|doc)$/i.test(next.name) && !next.type.includes('word')) return
    setFile(next)
    setOutput([])
  }

  const start = (): void => {
    if (!file) return
    void runner.run(async () => {
      runner.setLabel(t('common.processing'))
      const pdf = await docxToPdf(file, {
        layout,
        marginMm,
        onProgress: (fraction) => runner.setProgress(fraction),
      })
      setOutput([{ name: withExtension(file.name, 'pdf'), data: pdf }])
      await recordHistory({
        slug: 'word-to-pdf',
        toolName: t('tools.word-to-pdf.name'),
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
          accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onFiles={accept}
          title={t('ui.dropHere')}
          subtitle={t('ui.wordFiles')}
        />
      ) : (
        <>
          <FileChip file={file} onRemove={reset} />

          <div>
            <RadioGroup<PageLayout>
              name="page-layout"
              value={layout}
              onChange={setLayout}
              options={[
                { value: 'a4', label: t('tools.word-to-pdf.ui.a4') },
                { value: 'letter', label: t('tools.word-to-pdf.ui.letter') },
              ]}
            />
          </div>

          <Field label={t('tools.word-to-pdf.ui.margin')}>
            <div className="flex gap-2">
              {MARGINS.map((margin) => (
                <button
                  key={margin.value}
                  type="button"
                  onClick={() => setMarginMm(margin.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    marginMm === margin.value
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600'
                      : 'border-[var(--line)] text-[var(--ink-2)] hover:border-brand-400'
                  }`}
                >
                  {margin.label}
                </button>
              ))}
            </div>
          </Field>

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
