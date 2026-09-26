import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Droplets, ImagePlus, X } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { CheckRow, ErrorBox, Field, RadioGroup, RangeRow, SectionTitle } from '@/components/ui'
import { ProgressBar } from '@/components/Progress'
import { Results, type OutputFile } from '@/components/Results'
import { FileChip } from '@/components/FileChip'
import { useToolRunner, singleSummary } from '../job'
import {
  applyWatermark,
  type NumberFormat,
  type NumberPosition,
  type WatermarkPlacement,
} from '@/lib/ops'
import { withExtension } from '@/lib/files'
import { recordHistory } from '@/lib/history'

const POSITION_VALUES: NumberPosition[] = [
  'bottom-center',
  'bottom-right',
  'bottom-left',
  'top-right',
]

export default function WatermarkPdf(): ReactNode {
  const { t } = useTranslation()
  const runner = useToolRunner()
  const [file, setFile] = useState<File | null>(null)

  const [text, setText] = useState('')
  const [placement, setPlacement] = useState<WatermarkPlacement>('diagonal')
  const [angle, setAngle] = useState(45)
  const [opacity, setOpacity] = useState(18)
  const [fontSize, setFontSize] = useState(48)
  const [color, setColor] = useState('#111111')
  const [logo, setLogo] = useState<File | null>(null)

  const [addNumbers, setAddNumbers] = useState(false)
  const [numberFormat, setNumberFormat] = useState<NumberFormat>('plain')
  const [numberPosition, setNumberPosition] = useState<NumberPosition>('bottom-center')
  const [startAt, setStartAt] = useState(1)

  const [output, setOutput] = useState<OutputFile[]>([])

  const start = (): void => {
    if (!file) return
    void runner.run(async () => {
      const bytes = new Uint8Array(await file.arrayBuffer())
      let logoPayload: { bytes: Uint8Array; type: 'png' | 'jpg' } | null = null
      if (logo) {
        const buffer = new Uint8Array(await logo.arrayBuffer())
        logoPayload = { bytes: buffer, type: /\.png$/i.test(logo.name) ? 'png' : 'jpg' }
      }

      runner.setLabel(t('common.processing'))
      const result = await applyWatermark(bytes, {
        text: text.trim(),
        fontSize,
        angle,
        opacity: opacity / 100,
        color,
        placement,
        logo: logoPayload,
        numbers: {
          enabled: addNumbers,
          format: numberFormat,
          position: numberPosition,
          startAt,
          fontSize: 10,
          color: '#444444',
        },
      })

      setOutput([{ name: withExtension(file.name, 'pdf'), data: result }])
      await recordHistory({
        slug: 'watermark-pdf',
        toolName: t('tools.watermark-pdf.name'),
        files: singleSummary(file),
      })
    })
  }

  const reset = (): void => {
    setFile(null)
    setLogo(null)
    setOutput([])
    setText('')
    runner.reset()
  }

  if (output.length > 0) {
    return <Results files={output} onReset={reset} resetLabel={t('common.retry')} />
  }

  const nothingSelected = !text.trim() && !addNumbers && !logo

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
            <SectionTitle>{t('tools.watermark-pdf.ui.watermarkSection')}</SectionTitle>
            <div className="space-y-4">
              <Field label={t('tools.watermark-pdf.ui.text')}>
                <input
                  className="field"
                  value={text}
                  placeholder={t('tools.watermark-pdf.ui.textPh')}
                  onChange={(event) => setText(event.target.value)}
                />
              </Field>

              <RadioGroup<WatermarkPlacement>
                name="placement"
                value={placement}
                onChange={setPlacement}
                options={[
                  { value: 'diagonal', label: t('tools.watermark-pdf.ui.diagonal') },
                  { value: 'center', label: t('tools.watermark-pdf.ui.center') },
                  { value: 'tiled', label: t('tools.watermark-pdf.ui.tiled') },
                ]}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {placement === 'diagonal' ? (
                  <RangeRow
                    label={t('tools.watermark-pdf.ui.angle')}
                    value={angle}
                    min={0}
                    max={90}
                    suffix="°"
                    onChange={setAngle}
                  />
                ) : null}
                <RangeRow
                  label={t('tools.watermark-pdf.ui.opacity')}
                  value={opacity}
                  min={5}
                  max={100}
                  suffix="%"
                  onChange={setOpacity}
                />
                <RangeRow
                  label={t('tools.watermark-pdf.ui.fontSize')}
                  value={fontSize}
                  min={12}
                  max={140}
                  onChange={setFontSize}
                />
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-[var(--ink-2)]">
                    {t('tools.watermark-pdf.ui.color')}
                  </p>
                  <input
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="h-9 w-full cursor-pointer rounded-lg border border-[var(--line)] bg-transparent p-1"
                  />
                </div>
              </div>

              <div>
                <p className="label">{t('tools.watermark-pdf.ui.logo')}</p>
                {logo ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2">
                    <span className="truncate text-sm font-semibold">{logo.name}</span>
                    <button
                      type="button"
                      onClick={() => setLogo(null)}
                      className="text-[var(--ink-2)] hover:text-red-500"
                      aria-label={t('common.remove')}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost w-full"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/png,image/jpeg'
                      input.onchange = () => {
                        if (input.files?.[0]) setLogo(input.files[0])
                      }
                      input.click()
                    }}
                  >
                    <ImagePlus size={15} />
                    {t('tools.watermark-pdf.ui.logo')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--line)] pt-4">
            <SectionTitle>{t('tools.watermark-pdf.ui.numbersSection')}</SectionTitle>
            <div className="space-y-4">
              <CheckRow
                label={t('tools.watermark-pdf.ui.addNumbers')}
                checked={addNumbers}
                onChange={setAddNumbers}
              />

              {addNumbers ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('tools.watermark-pdf.ui.numberFormat')}>
                      <select
                        className="field"
                        value={numberFormat}
                        onChange={(event) => setNumberFormat(event.target.value as NumberFormat)}
                      >
                        <option value="plain">{t('tools.watermark-pdf.ui.fmtPlain')}</option>
                        <option value="of">{t('tools.watermark-pdf.ui.fmtOf')}</option>
                        <option value="dash">{t('tools.watermark-pdf.ui.fmtDash')}</option>
                      </select>
                    </Field>
                    <Field label={t('tools.watermark-pdf.ui.numberPos')}>
                      <select
                        className="field"
                        value={numberPosition}
                        onChange={(event) =>
                          setNumberPosition(event.target.value as NumberPosition)
                        }
                      >
                        {POSITION_VALUES.map((value) => (
                          <option key={value} value={value}>
                            {t(`tools.watermark-pdf.ui.${value === 'bottom-center' ? 'footerCenter' : value === 'bottom-right' ? 'footerRight' : value === 'bottom-left' ? 'footerLeft' : 'headerRight'}`)}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label={t('tools.watermark-pdf.ui.startAt')}>
                    <input
                      type="number"
                      min={0}
                      className="field"
                      value={startAt}
                      onChange={(event) => setStartAt(Math.max(0, Number(event.target.value)))}
                    />
                  </Field>
                </>
              ) : null}
            </div>
          </div>

          {nothingSelected ? (
            <p className="text-sm font-semibold text-amber-600">
              {t('tools.watermark-pdf.ui.nothing')}
            </p>
          ) : null}

          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={start}
            disabled={runner.busy || nothingSelected}
          >
            <Droplets size={16} />
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
