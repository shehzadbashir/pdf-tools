import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  Eraser,
  Highlighter,
  PenTool,
  Stamp,
  Type as TypeIcon,
  Download,
} from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { ErrorBox, Field, Notice, SectionTitle } from '@/components/ui'
import { ProgressBar } from '@/components/Progress'
import { Results, type OutputFile } from '@/components/Results'
import { FileChip } from '@/components/FileChip'
import { useToolRunner, singleSummary } from '../job'
import {
  applyAnnotations,
  formatDateStamp,
  newId,
  renderPreview,
  textToPng,
  trimSignatureCanvas,
  totalPageCount,
  type PlacedElement,
  type StampKind,
} from '@/lib/esign'
import { withExtension } from '@/lib/files'
import { recordHistory } from '@/lib/history'

const PAD_W = 520
const PAD_H = 190

export default function SignPdf(): ReactNode {
  const { t } = useTranslation()
  const runner = useToolRunner()

  const [file, setFile] = useState<File | null>(null)
  const [bytes, setBytes] = useState<Uint8Array | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [page, setPage] = useState(1)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [size, setSize] = useState({ w: 600, h: 850 })
  const [annotations, setAnnotations] = useState<Record<number, PlacedElement[]>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [tool, setTool] = useState<StampKind>('signature')
  const [textValue, setTextValue] = useState('')
  const [color, setColor] = useState('#111111')
  const [opacity, setOpacity] = useState(100)
  const [output, setOutput] = useState<OutputFile[]>([])

  const padRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const drawing = useRef(false)

  /* ---------------------------------------------------------- file load */

  const loadFile = useCallback(
    async (input: File) => {
      setFile(input)
      setAnnotations({})
      setPage(1)
      setSelected(null)
      setOutput([])
      const buffer = new Uint8Array(await input.arrayBuffer())
      setBytes(buffer)
      setPageCount(await totalPageCount(buffer))
      setPreviewUrl(await renderPreview(buffer, 1, 900))
    },
    [],
  )

  const goToPage = useCallback(
    async (next: number) => {
      if (!bytes || next < 1 || next > pageCount) return
      setPage(next)
      setSelected(null)
      setPreviewUrl(await renderPreview(bytes, next, 900))
    },
    [bytes, pageCount],
  )

  useEffect(() => {
    const canvas = padRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = color
  }, [color, tool])

  /* ------------------------------------------------------ signature pad */

  const padPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = padRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const startDrawing = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
    if (tool !== 'signature') return
    drawing.current = true
    const canvas = padRef.current!
    canvas.setPointerCapture(event.pointerId)
    const ctx = canvas.getContext('2d')!
    const point = padPoint(event)
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  const draw = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
    if (!drawing.current) return
    const ctx = padRef.current?.getContext('2d')
    if (!ctx) return
    const point = padPoint(event)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  const stopDrawing = (): void => {
    drawing.current = false
  }

  const clearPad = (): void => {
    const canvas = padRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  /* -------------------------------------------------------- add element */

  const pushElement = (element: Omit<PlacedElement, 'id' | 'pageNumber'>): void => {
    const withId: PlacedElement = { ...element, id: newId() }
    setAnnotations((current) => ({
      ...current,
      [page]: [...(current[page] ?? []), withId],
    }))
    setSelected(withId.id)
  }

  const addSignature = (): void => {
    const canvas = padRef.current
    if (!canvas) return
    const dataUrl = trimSignatureCanvas(canvas)
    if (!dataUrl) {
      runner.setError(t('tools.sign-pdf.ui.needElement'))
      return
    }
    const ratio = canvas.height / canvas.width
    const w = 0.32
    const h = (w * size.w * ratio) / Math.max(1, size.h)
    pushElement({
      kind: 'signature',
      x: 0.34,
      y: 0.6,
      w,
      h: Math.min(h, 0.4),
      rotation: 0,
      opacity: opacity / 100,
      color,
      src: dataUrl,
    })
    clearPad()
  }

  const addText = (): void => {
    if (!textValue.trim()) {
      runner.setError(t('tools.sign-pdf.ui.needElement'))
      return
    }
    pushElement({
      kind: 'text',
      x: 0.25,
      y: 0.45,
      w: 0.4,
      h: 0.07,
      rotation: 0,
      opacity: opacity / 100,
      color,
      text: textValue.trim(),
    })
    setTextValue('')
  }

  const addHighlight = (): void => {
    pushElement({
      kind: 'highlight',
      x: 0.15,
      y: 0.35,
      w: 0.5,
      h: 0.06,
      rotation: 0,
      opacity: 60,
      color: '#fde047',
      text: '',
    })
  }

  const addStamp = async (): Promise<void> => {
    const label = formatDateStamp()
    const url = await textToPng(label, { fontSize: 56, color, fontWeight: 700 })
    pushElement({
      kind: 'stamp',
      x: 0.55,
      y: 0.78,
      w: 0.28,
      h: 0.06,
      rotation: 0,
      opacity: opacity / 100,
      color,
      src: url,
      text: label,
    })
  }

  const current = annotations[page] ?? []
  const selectedElement = current.find((element) => element.id === selected) ?? null

  const updateSelected = (patch: Partial<PlacedElement>): void => {
    if (!selected) return
    setAnnotations((document_) => ({
      ...document_,
      [page]: (document_[page] ?? []).map((element) =>
        element.id === selected ? { ...element, ...patch } : element,
      ),
    }))
  }

  const deleteSelected = (): void => {
    if (!selected) return
    setAnnotations((document_) => ({
      ...document_,
      [page]: (document_[page] ?? []).filter((element) => element.id !== selected),
    }))
    setSelected(null)
  }

  /* -------------------------------------------------------- drag/resize */

  const dragState = useRef<{
    mode: 'move' | 'resize'
    id: string
    startX: number
    startY: number
    origin: { x: number; y: number; w: number; h: number }
  } | null>(null)

  const onElementPointerDown = (
    event: ReactPointerEvent<HTMLElement>,
    element: PlacedElement,
    mode: 'move' | 'resize',
  ): void => {
    event.preventDefault()
    event.stopPropagation()
    ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
    setSelected(element.id)
    dragState.current = {
      mode,
      id: element.id,
      startX: event.clientX,
      startY: event.clientY,
      origin: { x: element.x, y: element.y, w: element.w, h: element.h },
    }
  }

  const onElementPointerMove = (event: ReactPointerEvent<HTMLElement>): void => {
    const state = dragState.current
    if (!state) return
    const dx = (event.clientX - state.startX) / Math.max(1, size.w)
    const dy = (event.clientY - state.startY) / Math.max(1, size.h)

    if (state.mode === 'move') {
      updateSelected({
        x: Math.min(Math.max(0, state.origin.x + dx), 1 - state.origin.w),
        y: Math.min(Math.max(0, state.origin.y + dy), 1 - state.origin.h),
      })
    } else {
      const nextW = Math.min(Math.max(0.04, state.origin.w + dx), 1 - state.origin.x)
      const nextH = Math.min(Math.max(0.02, state.origin.h + dy), 1 - state.origin.y)
      updateSelected({ w: nextW, h: nextH })
    }
  }

  const onElementPointerUp = (): void => {
    dragState.current = null
  }

  /* ------------------------------------------------------------- export */

  const exportPdf = (): void => {
    if (!bytes) return
    const total = Object.values(annotations).reduce((sum, list) => sum + list.length, 0)
    if (total === 0) {
      runner.setError(t('tools.sign-pdf.ui.needElement'))
      return
    }
    void runner.run(async () => {
      runner.setLabel(t('common.processing'))
      const plan = Object.entries(annotations)
        .map(([pageNumber, elements]) => ({ pageNumber: Number(pageNumber), elements }))
        .filter((entry) => entry.elements.length > 0)
      const result = await applyAnnotations(bytes, plan)
      setOutput([{ name: withExtension(file?.name ?? 'document.pdf', 'pdf'), data: result }])
      if (file) {
        await recordHistory({
          slug: 'sign-pdf',
          toolName: t('tools.sign-pdf.name'),
          files: singleSummary(file),
        })
      }
    })
  }

  const reset = (): void => {
    setFile(null)
    setBytes(null)
    setAnnotations({})
    setOutput([])
    setPageCount(0)
    runner.reset()
  }

  if (output.length > 0) {
    return <Results files={output} onReset={reset} resetLabel={t('common.retry')} />
  }

  const tools: { kind: StampKind; icon: typeof PenTool; label: string }[] = [
    { kind: 'signature', icon: PenTool, label: t('tools.sign-pdf.ui.draw') },
    { kind: 'text', icon: TypeIcon, label: t('tools.sign-pdf.ui.type') },
    { kind: 'highlight', icon: Highlighter, label: t('tools.sign-pdf.ui.highlight') },
    { kind: 'stamp', icon: Stamp, label: t('tools.sign-pdf.ui.stamp') },
  ]

  return (
    <div className="space-y-5">
      {!file ? (
        <Dropzone
          accept="application/pdf,.pdf"
          onFiles={(files) => void loadFile(files[0])}
          title={t('ui.dropHere')}
          subtitle={t('ui.onlyPdf')}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FileChip file={file} onRemove={reset} />
            <span className="chip">
              {t('common.page')} {page} / {pageCount}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => void goToPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft size={15} className="rtl:rotate-180" />
            </button>
            <span className="text-sm font-semibold text-[var(--ink)]">
              {t('ui.pageOf', { current: page, total: pageCount })}
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => void goToPage(page + 1)}
              disabled={page >= pageCount}
            >
              <ChevronRight size={15} className="rtl:rotate-180" />
            </button>
          </div>

          <div>
            <SectionTitle>{t('tools.sign-pdf.ui.tool')}</SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {tools.map((item) => (
                <button
                  key={item.kind}
                  type="button"
                  onClick={() => setTool(item.kind)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    tool === item.kind
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600'
                      : 'border-[var(--line)] text-[var(--ink-2)] hover:border-brand-400'
                  }`}
                >
                  <item.icon size={15} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {tool === 'signature' ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--ink-2)]">
                {t('tools.sign-pdf.ui.signaturePad')}
              </p>
              <canvas
                ref={padRef}
                width={PAD_W}
                height={PAD_H}
                className="w-full cursor-crosshair rounded-xl border-2 border-dashed border-[var(--line)] bg-white touch-none"
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary" onClick={addSignature}>
                  {t('tools.sign-pdf.ui.apply')}
                </button>
                <button type="button" className="btn btn-ghost" onClick={clearPad}>
                  <Eraser size={15} />
                  {t('tools.sign-pdf.ui.clearPad')}
                </button>
              </div>
            </div>
          ) : null}

          {tool === 'text' ? (
            <div className="space-y-3">
              <Field label={t('tools.sign-pdf.ui.textPh')}>
                <textarea
                  className="field min-h-20 resize-y"
                  value={textValue}
                  onChange={(event) => setTextValue(event.target.value)}
                  placeholder={t('tools.sign-pdf.ui.textPh')}
                />
              </Field>
              <button type="button" className="btn btn-primary" onClick={addText}>
                {t('tools.sign-pdf.ui.apply')}
              </button>
            </div>
          ) : null}

          {tool === 'highlight' ? (
            <button type="button" className="btn btn-primary w-full" onClick={addHighlight}>
              <Highlighter size={15} />
              {t('tools.sign-pdf.ui.highlight')}
            </button>
          ) : null}

          {tool === 'stamp' ? (
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => void addStamp()}
            >
              <Stamp size={15} />
              {t('tools.sign-pdf.ui.stamp')} — {formatDateStamp()}
            </button>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('tools.sign-pdf.ui.color')}>
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-9 w-full cursor-pointer rounded-lg border border-[var(--line)] bg-transparent p-1"
              />
            </Field>
            <Field label={`${t('tools.sign-pdf.ui.opacity')} — ${opacity}%`}>
              <input
                type="range"
                min={20}
                max={100}
                value={opacity}
                onChange={(event) => setOpacity(Number(event.target.value))}
                className="mt-2 w-full accent-[var(--color-brand-600)]"
              />
            </Field>
          </div>

          <Notice>{t('tools.sign-pdf.ui.dragHint')}</Notice>

          {previewUrl ? (
            <div
              ref={previewRef}
              className="relative mx-auto w-full max-w-xl touch-none select-none overflow-hidden rounded-xl border border-[var(--line)] bg-white"
              onPointerMove={onElementPointerMove}
              onPointerUp={onElementPointerUp}
            >
              <img
                src={previewUrl}
                alt={`page ${page}`}
                className="block w-full"
                draggable={false}
                onLoad={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  setSize({ w: rect.width, h: rect.height })
                }}
              />

              {current.map((element) => {
                const isSelected = element.id === selected
                if (element.kind === 'highlight') {
                  return (
                    <div
                      key={element.id}
                      onPointerDown={(event) => onElementPointerDown(event, element, 'move')}
                      className="absolute cursor-move"
                      style={{
                        left: `${element.x * 100}%`,
                        top: `${element.y * 100}%`,
                        width: `${element.w * 100}%`,
                        height: `${element.h * 100}%`,
                        background: element.color,
                        opacity: element.opacity / 100,
                        outline: isSelected ? '2px solid #4f46e5' : undefined,
                      }}
                    />
                  )
                }

                if (element.src) {
                  return (
                    <img
                      key={element.id}
                      src={element.src}
                      alt=""
                      draggable={false}
                      onPointerDown={(event) => onElementPointerDown(event, element, 'move')}
                      className="absolute cursor-move"
                      style={{
                        left: `${element.x * 100}%`,
                        top: `${element.y * 100}%`,
                        width: `${element.w * 100}%`,
                        height: `${element.h * 100}%`,
                        opacity: element.opacity / 100,
                        outline: isSelected ? '2px solid #4f46e5' : undefined,
                      }}
                    />
                  )
                }

                return (
                  <div
                    key={element.id}
                    onPointerDown={(event) => onElementPointerDown(event, element, 'move')}
                    className="absolute flex cursor-move items-center whitespace-pre-wrap break-words px-1"
                    style={{
                      left: `${element.x * 100}%`,
                      top: `${element.y * 100}%`,
                      width: `${element.w * 100}%`,
                      height: `${element.h * 100}%`,
                      color: element.color,
                      opacity: element.opacity / 100,
                      fontSize: `clamp(10px, ${element.h * 100 * 0.7}vw, 48px)`,
                      lineHeight: 1.2,
                      outline: isSelected ? '2px solid #4f46e5' : undefined,
                    }}
                  >
                    {element.text}
                    {isSelected ? (
                      <span
                        onPointerDown={(event) => onElementPointerDown(event, element, 'resize')}
                        className="absolute -bottom-1 -right-1 h-3.5 w-3.5 cursor-nwse-resize rounded-sm border border-white bg-brand-600"
                      />
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card flex min-h-40 items-center justify-center">
              <ProgressBar label={t('ui.rendering')} />
            </div>
          )}

          <p className="text-center text-xs text-[var(--ink-2)]">
            {t('tools.sign-pdf.ui.placed', { count: current.length })}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={exportPdf}
              disabled={runner.busy}
            >
              <Download size={16} />
              {t('tools.sign-pdf.ui.exportAll')}
            </button>
            {selectedElement ? (
              <button type="button" className="btn btn-ghost" onClick={deleteSelected}>
                {t('common.remove')}
              </button>
            ) : null}
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
