import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { ErrorBox, Field, RangeRow } from '@/components/ui'
import { ProgressBar } from '@/components/Progress'
import { Results, type OutputFile } from '@/components/Results'
import { FileChip } from '@/components/FileChip'
import { useToolRunner, singleSummary } from '../job'
import { pdfToImages, type ImageFormat } from '@/lib/convert'
import { recordHistory } from '@/lib/history'

export default function PdfToJpg(): ReactNode {
  const { t } = useTranslation()
  const runner = useToolRunner()
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<ImageFormat>('image/jpeg')
  const [dpi, setDpi] = useState(150)
  const [quality, setQuality] = useState(88)
  const [output, setOutput] = useState<OutputFile[]>([])

  const start = (): void => {
    if (!file) return
    void runner.run(async () => {
      const bytes = new Uint8Array(await file.arrayBuffer())
      runner.setLabel(t('ui.rendering'))
      const images = await pdfToImages(bytes, file.name, {
        format,
        dpi,
        quality: quality / 100,
        onProgress: (fraction) => runner.setProgress(fraction),
      })
      setOutput(
        images.map((image) => ({
          name: image.name,
          data: image.blob,
          size: image.blob.size,
          mime: image.blob.type,
        })),
      )
      await recordHistory({
        slug: 'pdf-to-jpg',
        toolName: t('tools.pdf-to-jpg.name'),
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
    return (
      <Results
        files={output}
        onReset={reset}
        resetLabel={t('common.retry')}
        summary={t('tools.pdf-to-jpg.ui.pagesOut', { count: output.length })}
      />
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('tools.pdf-to-jpg.ui.format')}>
              <select
                className="field"
                value={format}
                onChange={(event) => setFormat(event.target.value as ImageFormat)}
              >
                <option value="image/jpeg">JPG</option>
                <option value="image/png">PNG</option>
              </select>
            </Field>

            <Field label={t('tools.pdf-to-jpg.ui.resolution')}>
              <select className="field" value={dpi} onChange={(event) => setDpi(Number(event.target.value))}>
                <option value={72}>{t('tools.pdf-to-jpg.ui.dpi72')}</option>
                <option value={150}>{t('tools.pdf-to-jpg.ui.dpi150')}</option>
                <option value={300}>{t('tools.pdf-to-jpg.ui.dpi300')}</option>
              </select>
            </Field>
          </div>

          {format === 'image/jpeg' ? (
            <RangeRow
              label={t('tools.pdf-to-jpg.ui.quality')}
              value={quality}
              min={30}
              max={100}
              suffix="%"
              onChange={setQuality}
            />
          ) : null}

          <button type="button" className="btn btn-primary w-full" onClick={start} disabled={runner.busy}>
            <Image size={16} />
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
