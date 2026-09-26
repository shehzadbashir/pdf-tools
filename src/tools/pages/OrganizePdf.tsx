import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Grid2x2Plus, RotateCcw, RotateCw, Trash2 } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { ErrorBox, Notice } from '@/components/ui'
import { ProgressBar } from '@/components/Progress'
import { Results, type OutputFile } from '@/components/Results'
import { FileChip } from '@/components/FileChip'
import { useToolRunner, singleSummary } from '../job'
import { applyPagePlan, type PagePlan } from '@/lib/ops'
import { openPdf, renderPage } from '@/lib/pdfjs'
import { recordHistory } from '@/lib/history'

interface Sheet {
  id: string
  source: number
  rotation: number
  thumb: string
}

const MAX_THUMBNAILS = 120

export default function OrganizePdf(): ReactNode {
  const { t } = useTranslation()
  const runner = useToolRunner()
  const [file, setFile] = useState<File | null>(null)
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [previewBusy, setPreviewBusy] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [output, setOutput] = useState<OutputFile[]>([])

  const load = useCallback(
    async (input: File) => {
      setPreviewBusy(true)
      setSheets([])
      try {
        const bytes = new Uint8Array(await input.arrayBuffer())
        const doc = await openPdf(bytes)
        const count = Math.min(doc.numPages, MAX_THUMBNAILS)
        const built: Sheet[] = []
        for (let i = 1; i <= count; i++) {
          const canvas = await renderPage(doc, i, { width: 200 })
          built.push({
            id: `${i}-${Math.random().toString(36).slice(2, 6)}`,
            source: i,
            rotation: 0,
            thumb: canvas.toDataURL('image/jpeg', 0.7),
          })
          if (i % 6 === 0) {
            runner.setProgress(i / count)
            await new Promise((r) => requestAnimationFrame(r))
          }
        }
        setSheets(built)
        await doc.cleanup()
      } catch {
        runner.setError(t('common.error'))
      } finally {
        runner.setProgress(undefined)
        setPreviewBusy(false)
      }
    },
    [runner, t],
  )

  useEffect(() => {
    if (file) void load(file)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  const rotate = (id: string, delta: number): void => {
    setSheets((current) =>
      current.map((sheet) =>
        sheet.id === id ? { ...sheet, rotation: (sheet.rotation + delta + 360) % 360 } : sheet,
      ),
    )
  }

  const remove = (id: string): void => {
    setSheets((current) => {
      if (current.length <= 1) {
        runner.setError(t('tools.organize-pdf.ui.empty'))
        return current
      }
      return current.filter((sheet) => sheet.id !== id)
    })
  }

  const onDrop = (targetIndex: number): void => {
    if (dragIndex === null || dragIndex === targetIndex) return
    setSheets((current) => {
      const next = [...current]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    setDragIndex(null)
  }

  const start = (): void => {
    if (!file) return
    void runner.run(async () => {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const plan: PagePlan[] = sheets.map((sheet) => ({
        source: sheet.source,
        rotation: sheet.rotation,
      }))
      runner.setLabel(t('common.processing'))
      const result = await applyPagePlan(bytes, plan)
      setOutput([{ name: file.name.replace(/\.pdf$/i, '') + '-organised.pdf', data: result }])
      await recordHistory({
        slug: 'organize-pdf',
        toolName: t('tools.organize-pdf.name'),
        files: singleSummary(file),
      })
    })
  }

  const reset = (): void => {
    setFile(null)
    setSheets([])
    setOutput([])
    runner.reset()
  }

  if (output.length > 0) {
    return (
      <Results
        files={output}
        onReset={reset}
        resetLabel={t('common.retry')}
        summary={t('tools.organize-pdf.ui.kept', { count: sheets.length })}
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FileChip file={file} onRemove={reset} />
            <span className="chip">{t('ui.totalPages')}: {sheets.length}</span>
          </div>

          <Notice>{t('tools.organize-pdf.ui.dragHint')}</Notice>

          {previewBusy || runner.progress !== undefined ? (
            <ProgressBar value={runner.progress} label={t('ui.rendering')} />
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {sheets.map((sheet, index) => (
                <li
                  key={sheet.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => onDrop(index)}
                  onDragEnd={() => setDragIndex(null)}
                  className={`group relative cursor-grab rounded-xl border bg-[var(--surface)] p-2 transition active:cursor-grabbing ${
                    dragIndex === index
                      ? 'border-brand-500 opacity-60'
                      : 'border-[var(--line)] hover:border-brand-400'
                  }`}
                >
                  <div className="relative overflow-hidden rounded-lg bg-white">
                    <img
                      src={sheet.thumb}
                      alt={`page ${sheet.source}`}
                      draggable={false}
                      className="w-full"
                      style={{ transform: `rotate(${sheet.rotation}deg) scale(${sheet.rotation % 180 ? 0.72 : 1})` }}
                    />
                    <span className="absolute start-1.5 top-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
                      {index + 1}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => rotate(sheet.id, -90)}
                      className="grid h-7 w-7 place-items-center rounded-md text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-brand-600"
                      aria-label={t('ui.rotateLeft')}
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => rotate(sheet.id, 90)}
                      className="grid h-7 w-7 place-items-center rounded-md text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-brand-600"
                      aria-label={t('ui.rotateRight')}
                    >
                      <RotateCw size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(sheet.id)}
                      className="grid h-7 w-7 place-items-center rounded-md text-[var(--ink-2)] hover:bg-red-500/10 hover:text-red-500"
                      aria-label={t('ui.deletePage')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={start}
            disabled={runner.busy || previewBusy || sheets.length === 0}
          >
            <Grid2x2Plus size={16} />
            {t('common.start')}
          </button>
        </>
      )}

      {runner.busy && !previewBusy ? (
        <ProgressBar value={runner.progress} label={runner.label ?? t('common.processing')} />
      ) : null}
      <ErrorBox>{runner.error}</ErrorBox>
    </div>
  )
}
