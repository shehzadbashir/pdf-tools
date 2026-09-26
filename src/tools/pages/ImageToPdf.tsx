import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Images, Plus, Trash2 } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { ErrorBox, Field, RadioGroup } from '@/components/ui'
import { ProgressBar } from '@/components/Progress'
import { Results, type OutputFile } from '@/components/Results'
import { FileChip } from '@/components/FileChip'
import { useToolRunner, summaries } from '../job'
import { imagesToPdf, type ImagePageSize } from '@/lib/convert'
import { formatBytes } from '@/lib/files'
import { recordHistory } from '@/lib/history'

export default function ImageToPdf(): ReactNode {
  const { t } = useTranslation()
  const runner = useToolRunner()
  const [files, setFiles] = useState<File[]>([])
  const [pageSize, setPageSize] = useState<ImagePageSize>('a4')
  const [marginMm, setMarginMm] = useState(10)
  const [output, setOutput] = useState<OutputFile[]>([])

  const add = (incoming: File[]): void => {
    setOutput([])
    setFiles((current) => [
      ...current,
      ...incoming.filter((f) => f.type.startsWith('image/')),
    ])
  }

  const start = (): void => {
    if (files.length === 0) return
    void runner.run(async () => {
      runner.setLabel(t('common.processing'))
      const pdf = await imagesToPdf(files, {
        pageSize,
        marginMm,
        onProgress: (fraction) => runner.setProgress(fraction),
      })
      setOutput([{ name: 'images.pdf', data: pdf }])
      await recordHistory({
        slug: 'image-to-pdf',
        toolName: t('tools.image-to-pdf.name'),
        files: summaries(files),
      })
    })
  }

  const reset = (): void => {
    setFiles([])
    setOutput([])
    runner.reset()
  }

  if (output.length > 0) {
    return <Results files={output} onReset={reset} resetLabel={t('common.retry')} />
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0)

  return (
    <div className="space-y-5">
      {files.length === 0 ? (
        <Dropzone
          accept="image/*"
          multiple
          onFiles={add}
          title={t('ui.dropHere')}
          subtitle={t('ui.imageFiles')}
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--ink)]">
              {files.length} {t('common.files')} · {formatBytes(totalBytes)}
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.multiple = true
                input.onchange = () => {
                  if (input.files) add(Array.from(input.files))
                }
                input.click()
              }}
            >
              <Plus size={15} />
              {t('ui.addFiles')}
            </button>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <FileChip file={file} onRemove={() => setFiles((c) => c.filter((_, i) => i !== index))} />
                </div>
              </li>
            ))}
          </ul>

          <RadioGroup<ImagePageSize>
            name="page-size"
            value={pageSize}
            onChange={setPageSize}
            options={[
              { value: 'auto', label: t('tools.image-to-pdf.ui.auto') },
              { value: 'a4', label: t('tools.image-to-pdf.ui.a4') },
              { value: 'letter', label: t('tools.image-to-pdf.ui.letter') },
            ]}
          />

          {pageSize !== 'auto' ? (
            <Field label={t('tools.image-to-pdf.ui.margin')}>
              <input
                type="range"
                min={0}
                max={30}
                step={5}
                value={marginMm}
                onChange={(event) => setMarginMm(Number(event.target.value))}
                className="w-full accent-[var(--color-brand-600)]"
              />
              <p className="mt-1 text-xs font-bold text-brand-600">{marginMm} mm</p>
            </Field>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary flex-1" onClick={start} disabled={runner.busy}>
              <Images size={16} />
              {t('common.start')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={reset}>
              <Trash2 size={15} />
              {t('common.clear')}
            </button>
          </div>
        </>
      )}

      {runner.busy ? (
        <ProgressBar value={runner.progress} label={runner.label ?? t('common.processing')} />
      ) : null}
      <ErrorBox>{runner.error}</ErrorBox>
    </div>
  )
}
