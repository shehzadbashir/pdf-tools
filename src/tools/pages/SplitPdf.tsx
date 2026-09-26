import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Scissors } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { ErrorBox, Field, RadioGroup, SectionTitle } from '@/components/ui'
import { ProgressBar } from '@/components/Progress'
import { Results, type OutputFile } from '@/components/Results'
import { FileChip } from '@/components/FileChip'
import { useToolRunner, singleSummary } from '../job'
import { parsePageRanges } from '@/lib/files'
import { splitEveryN, splitIntoRanges, splitSinglePages } from '@/lib/ops'
import { openPdf } from '@/lib/pdfjs'
import { recordHistory } from '@/lib/history'

type Mode = 'range' | 'every' | 'single'

export default function SplitPdf(): ReactNode {
  const { t } = useTranslation()
  const runner = useToolRunner()
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<Mode>('range')
  const [ranges, setRanges] = useState('')
  const [every, setEvery] = useState(1)
  const [total, setTotal] = useState<number | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [output, setOutput] = useState<OutputFile[]>([])

  const accept = async (incoming: File[]): Promise<void> => {
    const next = incoming[0]
    if (!next) return
    setFile(next)
    setOutput([])
    setLocalError(null)
    runner.setProgress(undefined)
    runner.setLabel(t('ui.readingFile'))
    try {
      const doc = await openPdf(await next.arrayBuffer())
      setTotal(doc.numPages)
      await doc.cleanup()
    } catch {
      setTotal(null)
      setLocalError(t('common.error'))
    } finally {
      runner.setLabel(undefined)
    }
  }

  const start = (): void => {
    if (!file) return
    setLocalError(null)
    void runner.run(async () => {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const stem = file.name.replace(/\.pdf$/i, '') || 'document'
      let parts: { name: string; bytes: Uint8Array }[] = []

      if (mode === 'range') {
        const parsed = parsePageRanges(ranges, total ?? Number.MAX_SAFE_INTEGER)
        if (!parsed || parsed.length === 0) {
          setLocalError(t('tools.split-pdf.ui.invalidRange'))
          throw new Error('INVALID_RANGE')
        }
        parts = await splitIntoRanges(bytes, [parsed], stem)
      } else if (mode === 'every') {
        const n = Math.max(1, Math.floor(every))
        parts = await splitEveryN(bytes, n, stem)
      } else {
        parts = await splitSinglePages(bytes, stem)
      }

      setOutput(parts.map((part) => ({ name: part.name, data: part.bytes })))
      await recordHistory({
        slug: 'split-pdf',
        toolName: t('tools.split-pdf.name'),
        files: singleSummary(file),
      })
    })
  }

  const reset = (): void => {
    setFile(null)
    setTotal(null)
    setOutput([])
    setRanges('')
    setLocalError(null)
    runner.reset()
  }

  if (output.length > 0) {
    return (
      <Results
        files={output}
        onReset={reset}
        resetLabel={t('common.retry')}
        summary={`${output.length} ${t('common.files')}`}
      />
    )
  }

  return (
    <div className="space-y-5">
      {!file ? (
        <Dropzone
          accept="application/pdf,.pdf"
          onFiles={(files) => void accept(files)}
          title={t('ui.dropHere')}
          subtitle={t('ui.onlyPdf')}
        />
      ) : (
        <>
          <FileChip file={file} onRemove={reset} />

          {total !== null ? (
            <p className="text-xs text-[var(--ink-2)]">
              {t('ui.totalPages')}: <strong>{total}</strong>
            </p>
          ) : null}

          <div>
            <SectionTitle>{t('common.start')}</SectionTitle>
            <RadioGroup<Mode>
              name="split-mode"
              value={mode}
              onChange={(next) => {
                setMode(next)
                setLocalError(null)
              }}
              options={[
                { value: 'range', label: t('tools.split-pdf.ui.modeRange') },
                { value: 'every', label: t('tools.split-pdf.ui.modeEvery') },
                { value: 'single', label: t('tools.split-pdf.ui.modeSingle') },
              ]}
            />
          </div>

          {mode === 'range' ? (
            <Field label={t('tools.split-pdf.ui.ranges')}>
              <input
                className="field"
                value={ranges}
                placeholder={t('tools.split-pdf.ui.rangesPh')}
                onChange={(event) => setRanges(event.target.value)}
              />
            </Field>
          ) : null}

          {mode === 'every' ? (
            <Field label={t('tools.split-pdf.ui.everyN')}>
              <input
                className="field"
                type="number"
                min={1}
                max={total ?? 9999}
                value={every}
                onChange={(event) => setEvery(Number(event.target.value))}
              />
            </Field>
          ) : null}

          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={start}
            disabled={runner.busy}
          >
            <Scissors size={16} />
            {mode === 'range' ? t('tools.split-pdf.ui.extract') : t('common.start')}
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
