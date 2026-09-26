import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { describeError } from './errors'
import type { HistoryFile } from '@/lib/history'

export interface ToolRunner {
  busy: boolean
  progress: number | undefined
  label: string | undefined
  error: string | null
  setProgress: (value: number | undefined) => void
  setLabel: (value: string | undefined) => void
  setError: (value: string | null) => void
  run: (task: () => Promise<void>) => Promise<void>
  reset: () => void
}

/** Compact file list payload stored in the activity history. */
export function summaries(files: File[] | FileList): HistoryFile[] {
  return Array.from(files)
    .slice(0, 20)
    .map((file) => ({ name: file.name, size: file.size }))
}

export function singleSummary(file: File): HistoryFile[] {
  return [{ name: file.name, size: file.size }]
}

/** Shared busy / progress / error state for every tool widget. */
export function useToolRunner(): ToolRunner {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<number | undefined>(undefined)
  const [label, setLabel] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (task: () => Promise<void>) => {
      setError(null)
      setBusy(true)
      setProgress(undefined)
      try {
        await task()
      } catch (err) {
        setError(describeError(err, t))
      } finally {
        setBusy(false)
        setProgress(undefined)
        setLabel(undefined)
      }
    },
    [t],
  )

  const reset = useCallback(() => {
    setError(null)
    setProgress(undefined)
    setLabel(undefined)
  }, [])

  return { busy, progress, label, error, setProgress, setLabel, setError, run, reset }
}
