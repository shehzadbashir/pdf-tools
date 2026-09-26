import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ScanText } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { ErrorBox, Field, Notice, RadioGroup, SectionTitle } from '@/components/ui'
import { ProgressBar } from '@/components/Progress'
import { Results, type OutputFile } from '@/components/Results'
import { FileChip } from '@/components/FileChip'
import { useToolRunner, singleSummary } from '../job'
import {
  OCR_LANGUAGES,
  ocrToDocx,
  ocrToSearchablePdf,
  runOcr,
  supportsSearchablePdf,
  type OcrLanguage,
  type OcrResult,
} from '@/lib/ocr'
import { imagesToPdf } from '@/lib/convert'
import { downloadBlob } from '@/lib/files'
import { recordHistory } from '@/lib/history'

type Output = 'text' | 'docx' | 'searchable'

export default function OcrPdf(): ReactNode {
  const { t } = useTranslation()
  const runner = useToolRunner()
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState<OcrLanguage>('eng')
  const [output, setOutput] = useState<Output>('text')
  const [result, setResult] = useState<OcrResult | null>(null)
  const [results, setResults] = useState<OutputFile[]>([])
  const [notice, setNotice] = useState<string | null>(null)

  const isImage = (f: File): boolean => f.type.startsWith('image/')

  const start = (): void => {
    if (!file) return
    setNotice(null)
    setResults([])
    void runner.run(async () => {
      runner.setLabel(t('common.processing'))
      let source: Uint8Array = new Uint8Array(await file.arrayBuffer())

      if (isImage(file)) {
        runner.setLabel(t('ui.readingFile'))
        source = await imagesToPdf([file], { pageSize: 'auto', marginMm: 0 })
      }

      runner.setProgress(0.05)
      const ocr = await runOcr(source, {
        language,
        onProgress: (fraction, message) => {
          runner.setProgress(fraction)
          if (message) runner.setLabel(message)
        },
      })
      setResult(ocr)

      if (output === 'text') {
        setResults([
          {
            name: file.name.replace(/\.[^.]+$/, '') + '.txt',
            data: new Blob([ocr.text], { type: 'text/plain;charset=utf-8' }),
          },
        ])
      } else if (output === 'docx') {
        runner.setLabel(t('common.processing'))
        const docx = await ocrToDocx(ocr, file.name)
        setResults([
          {
            name: file.name.replace(/\.[^.]+$/, '') + '.docx',
            data: docx,
            mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        ])
      } else {
        if (!supportsSearchablePdf(language)) {
          setNotice(t('tools.ocr-pdf.ui.searchableOnlyLatin'))
          setResults([
            {
              name: file.name.replace(/\.[^.]+$/, '') + '.txt',
              data: new Blob([ocr.text], { type: 'text/plain;charset=utf-8' }),
            },
          ])
        } else {
          const pdf = await ocrToSearchablePdf(source, ocr, 200)
          setResults([
            {
              name: file.name.replace(/\.[^.]+$/, '') + '-searchable.pdf',
              data: pdf,
            },
          ])
        }
      }

      await recordHistory({
        slug: 'ocr-pdf',
        toolName: t('tools.ocr-pdf.name'),
        files: singleSummary(file),
      })
    })
  }

  const reset = (): void => {
    setFile(null)
    setResult(null)
    setResults([])
    setNotice(null)
    runner.reset()
  }

  if (results.length > 0) {
    const showText = output === 'text' || !supportsSearchablePdf(language)
    return (
      <div className="space-y-4">
        {result ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">
                {t('tools.ocr-pdf.ui.confidence')}
              </p>
              <p className="mt-1 text-lg font-extrabold text-[var(--ink)]">
                {result.confidence.toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">
                {t('common.words')}
              </p>
              <p className="mt-1 text-lg font-extrabold text-[var(--ink)]">
                {result.text.trim().split(/\s+/).filter(Boolean).length}
              </p>
            </div>
          </div>
        ) : null}

        <Results files={results} onReset={reset} resetLabel={t('common.retry')} />

        {showText && result ? (
          <div className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-[var(--ink)]">{t('tools.ocr-pdf.ui.outText')}</p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() =>
                  downloadBlob(
                    new Blob([result.text], { type: 'text/plain;charset=utf-8' }),
                    'ocr-text.txt',
                  )
                }
              >
                {t('common.download')}
              </button>
            </div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--surface-2)] p-3 text-xs leading-relaxed text-[var(--ink-2)]">
              {result.text}
            </pre>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {!file ? (
        <Dropzone
          accept="application/pdf,image/*,.pdf,.png,.jpg,.jpeg"
          onFiles={(files) => setFile(files[0] ?? null)}
          title={t('ui.dropHere')}
          subtitle={`${t('ui.onlyPdf')} · ${t('ui.imageFiles')}`}
        />
      ) : (
        <>
          <FileChip file={file} onRemove={reset} />

          <div>
            <SectionTitle>{t('tools.ocr-pdf.ui.output')}</SectionTitle>
            <RadioGroup<Output>
              name="ocr-output"
              value={output}
              onChange={setOutput}
              options={[
                { value: 'text', label: t('tools.ocr-pdf.ui.outText') },
                { value: 'docx', label: t('tools.ocr-pdf.ui.outDocx') },
                { value: 'searchable', label: t('tools.ocr-pdf.ui.outSearchable') },
              ]}
            />
          </div>

          {output === 'searchable' && !supportsSearchablePdf(language) ? (
            <Notice>{t('tools.ocr-pdf.ui.searchableOnlyLatin')}</Notice>
          ) : null}

          <Field
            label={t('tools.ocr-pdf.ui.language')}
            hint={t('tools.ocr-pdf.ui.pageLangNote')}
          >
            <select
              className="field"
              value={language}
              onChange={(event) => setLanguage(event.target.value as OcrLanguage)}
            >
              {OCR_LANGUAGES.map((code) => (
                <option key={code} value={code}>
                  {t(`tools.ocr-pdf.ui.${code}`)}
                </option>
              ))}
            </select>
          </Field>

          <Notice>{t('ui.keepOpen')}</Notice>

          <button type="button" className="btn btn-primary w-full" onClick={start} disabled={runner.busy}>
            <ScanText size={16} />
            {t('tools.ocr-pdf.ui.ocrRun')}
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
      <ErrorBox>{runner.error}</ErrorBox>
    </div>
  )
}
