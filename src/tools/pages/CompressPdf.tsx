import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Minimize2 } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { CheckRow, ErrorBox, Field, RadioGroup, RangeRow, SectionTitle } from '@/components/ui'
import { ProgressBar } from '@/components/Progress'
import { Results, type OutputFile } from '@/components/Results'
import { FileChip } from '@/components/FileChip'
import { useToolRunner, singleSummary } from '../job'
import { compressPdf, LEVEL_PRESETS, type CompressionLevel } from '@/lib/compress'
import { formatBytes, withExtension } from '@/lib/files'
import { recordHistory } from '@/lib/history'

interface Outcome {
  bytes: Uint8Array
  originalSize: number
  outputSize: number
  savedPercent: number
}

export default function CompressPdf(): ReactNode {
  const { t } = useTranslation()
  const runner = useToolRunner()
  const [file, setFile] = useState<File | null>(null)
  const [level, setLevel] = useState<CompressionLevel>('balanced')
  const [rasterise, setRasterise] = useState(LEVEL_PRESETS.balanced.rasterise)
  const [quality, setQuality] = useState(LEVEL_PRESETS.balanced.quality * 100)
  const [dpi, setDpi] = useState(LEVEL_PRESETS.balanced.dpi)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [output, setOutput] = useState<OutputFile[]>([])

  const pickLevel = (next: CompressionLevel): void => {
    setLevel(next)
    setRasterise(LEVEL_PRESETS[next].rasterise)
    setQuality(Math.round(LEVEL_PRESETS[next].quality * 100))
    setDpi(LEVEL_PRESETS[next].dpi)
  }

  const start = (): void => {
    if (!file) return
    void runner.run(async () => {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const result = await compressPdf(bytes, {
        level,
        rasterise,
        quality: quality / 100,
        dpi,
        onProgress: (fraction) => runner.setProgress(fraction),
      })
      setOutcome(result)
      setOutput([
        {
          name: withExtension(file.name, 'pdf'),
          data: result.bytes,
          size: result.outputSize,
        },
      ])
      await recordHistory({
        slug: 'compress-pdf',
        toolName: t('tools.compress-pdf.name'),
        files: singleSummary(file),
      })
    })
  }

  const reset = (): void => {
    setFile(null)
    setOutcome(null)
    setOutput([])
    runner.reset()
  }

  if (output.length > 0 && outcome) {
    const smaller = outcome.outputSize < outcome.originalSize
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">
              {t('tools.compress-pdf.ui.original')}
            </p>
            <p className="mt-1 text-lg font-extrabold text-[var(--ink)]">
              {formatBytes(outcome.originalSize)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">
              {t('common.size')}
            </p>
            <p className="mt-1 text-lg font-extrabold text-[var(--ink)]">
              {formatBytes(outcome.outputSize)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              {t('tools.compress-pdf.ui.reduced')}
            </p>
            <p className="mt-1 text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              {Math.max(0, outcome.savedPercent).toFixed(0)}%
            </p>
          </div>
        </div>

        {!smaller ? (
          <p className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            {t('tools.compress-pdf.ui.tooLarge')}
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

          <div>
            <SectionTitle>{t('common.start')}</SectionTitle>
            <RadioGroup<CompressionLevel>
              name="compress-level"
              value={level}
              onChange={pickLevel}
              options={[
                {
                  value: 'light',
                  label: t('tools.compress-pdf.ui.levelLight'),
                  description: t('tools.compress-pdf.ui.levelLightDesc'),
                },
                {
                  value: 'balanced',
                  label: t('tools.compress-pdf.ui.levelBalanced'),
                  description: t('tools.compress-pdf.ui.levelBalancedDesc'),
                },
                {
                  value: 'strong',
                  label: t('tools.compress-pdf.ui.levelStrong'),
                  description: t('tools.compress-pdf.ui.levelStrongDesc'),
                },
              ]}
            />
          </div>

          <CheckRow
            label={t('tools.compress-pdf.ui.rasterise')}
            checked={rasterise}
            onChange={setRasterise}
          />

          {rasterise ? (
            <div className="space-y-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
              <RangeRow
                label={t('tools.compress-pdf.ui.targetQuality')}
                value={quality}
                min={30}
                max={95}
                suffix="%"
                onChange={setQuality}
              />
              <Field label={t('tools.pdf-to-jpg.ui.resolution')}>
                <select className="field" value={dpi} onChange={(e) => setDpi(Number(e.target.value))}>
                  <option value={72}>{t('tools.pdf-to-jpg.ui.dpi72')}</option>
                  <option value={150}>{t('tools.pdf-to-jpg.ui.dpi150')}</option>
                  <option value={300}>{t('tools.pdf-to-jpg.ui.dpi300')}</option>
                </select>
              </Field>
            </div>
          ) : null}

          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={start}
            disabled={runner.busy}
          >
            <Minimize2 size={16} />
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
