import { useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, Combine, FileText, Plus, Trash2 } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { ErrorBox } from '@/components/ui'
import { ProgressBar } from '@/components/Progress'
import { Results, type OutputFile } from '@/components/Results'
import { FileChip } from '@/components/FileChip'
import { useToolRunner, summaries } from '../job'
import { mergePdfs, type MergeSource } from '@/lib/ops'
import { downloadBytes } from '@/lib/files'
import { recordHistory } from '@/lib/history'

export default function MergePdf(): ReactNode {
  const { t } = useTranslation()
  const runner = useToolRunner()
  const pickerRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [output, setOutput] = useState<OutputFile[]>([])

  const add = (incoming: File[]): void => {
    setOutput([])
    setFiles((current) => [...current, ...incoming.filter((f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name))])
  }

  const move = (index: number, delta: number): void => {
    setFiles((current) => {
      const next = [...current]
      const target = index + delta
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const start = (): void => {
    void runner.run(async () => {
      const sources: MergeSource[] = []
      for (const file of files) {
        runner.setLabel(`${t('ui.readingFile')} ${file.name}`)
        sources.push({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) })
      }
      runner.setLabel(t('common.processing'))
      const merged = await mergePdfs(sources, (done, total) => {
        runner.setProgress(done / total)
        runner.setLabel(`${t('ui.pageOf', { current: done, total })}`)
      })
      setOutput([{ name: 'merged.pdf', data: merged }])
      await recordHistory({
        slug: 'merge-pdf',
        toolName: t('tools.merge-pdf.name'),
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
    return (
      <div className="space-y-4">
        <Results files={output} onReset={reset} resetLabel={t('common.retry')} />
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={() => downloadBytes(output[0].data as Uint8Array, output[0].name)}
        >
          {t('common.download')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {files.length === 0 ? (
        <Dropzone
          accept="application/pdf,.pdf"
          multiple
          onFiles={add}
          title={t('ui.dropHere')}
          subtitle={t('ui.multipleAllowed')}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--ink)]">
              {t('tools.merge-pdf.ui.title')} — {files.length}
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => pickerRef.current?.click()}
            >
              <Plus size={15} />
              {t('ui.addFiles')}
            </button>
            <input
              ref={pickerRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="sr-only"
              onChange={(event) => {
                if (event.target.files) add(Array.from(event.target.files))
                event.target.value = ''
              }}
            />
          </div>

          <p className="text-xs text-[var(--ink-2)]">{t('tools.merge-pdf.ui.hint')}</p>

          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center gap-2">
                <span className="hidden w-8 shrink-0 text-center text-xs font-bold text-[var(--ink-2)] sm:block">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <FileChip file={file} onRemove={() => setFiles((c) => c.filter((_, i) => i !== index))} />
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-md border border-[var(--line)] text-[var(--ink-2)] hover:text-brand-600 disabled:opacity-30"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={t('ui.moveUp')}
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-md border border-[var(--line)] text-[var(--ink-2)] hover:text-brand-600 disabled:opacity-30"
                    onClick={() => move(index, 1)}
                    disabled={index === files.length - 1}
                    aria-label={t('ui.moveDown')}
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>
                <button
                  type="button"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[var(--ink-2)] hover:text-red-500"
                  onClick={() => setFiles((c) => c.filter((_, i) => i !== index))}
                  aria-label={t('common.remove')}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>

          <p className="flex items-center gap-2 text-xs text-[var(--ink-2)]">
            <FileText size={13} />
            {t('ui.orderHint')}
          </p>

          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={start}
            disabled={runner.busy || files.length < 2}
          >
            <Combine size={16} />
            {t('tools.merge-pdf.ui.merge', { count: files.length })}
          </button>
        </div>
      )}

      {runner.busy ? <ProgressBar value={runner.progress} label={runner.label ?? t('common.processing')} /> : null}
      <ErrorBox>{runner.error}</ErrorBox>
    </div>
  )
}
