'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { evaluate, type CurrentBlob, type EngineOutput } from '@tractionfi/engine'

export type EngineStateStatus =
  | 'loading'
  | 'ready'
  | 'saving'
  | 'conflict'
  | 'offline'

export interface EngineState {
  blob: CurrentBlob
  version: number
  status: EngineStateStatus
  conflictBlob?: CurrentBlob
  conflictVersion?: number
}

interface GetResponse {
  blob: CurrentBlob
  version: number
}

interface PutOkResponse {
  version: number
}

interface PutConflictResponse {
  error: 'conflict'
  current: { blob: CurrentBlob; version: number }
}

const AUTOSAVE_DEBOUNCE_MS = 500

export function useEngineState() {
  const [state, setState] = useState<EngineState>({
    blob: null as never,
    version: 0,
    status: 'loading',
  })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initial load.
  useEffect(() => {
    let cancelled = false
    fetch('/api/user_state')
      .then((r) => {
        if (!r.ok) throw new Error(`GET /api/user_state ${r.status}`)
        return r.json() as Promise<GetResponse>
      })
      .then((data) => {
        if (cancelled) return
        setState({ blob: data.blob, version: data.version, status: 'ready' })
      })
      .catch(() => {
        if (cancelled) return
        setState((s) => ({ ...s, status: 'offline' }))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const output: EngineOutput | null = useMemo(
    () =>
      state.blob
        ? evaluate(state.blob.userData, {
            skippedMilestones: state.blob.settings.skippedMilestones as never,
          })
        : null,
    [state.blob],
  )

  const save = useCallback(async (blob: CurrentBlob, version: number) => {
    setState((s) => ({ ...s, status: 'saving' }))
    try {
      const res = await fetch('/api/user_state', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ blob, version }),
      })
      if (res.ok) {
        const { version: newVersion } = (await res.json()) as PutOkResponse
        setState({ blob, version: newVersion, status: 'ready' })
      } else if (res.status === 409) {
        const { current } = (await res.json()) as PutConflictResponse
        setState({
          blob,
          version,
          status: 'conflict',
          conflictBlob: current.blob,
          conflictVersion: current.version,
        })
      } else {
        setState((s) => ({ ...s, status: 'offline' }))
      }
    } catch {
      setState((s) => ({ ...s, status: 'offline' }))
    }
  }, [])

  const updateBlob = useCallback(
    (mutator: (b: CurrentBlob) => CurrentBlob) => {
      setState((s) => {
        const next = mutator(s.blob)
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(
          () => save(next, s.version),
          AUTOSAVE_DEBOUNCE_MS,
        )
        return { ...s, blob: next }
      })
    },
    [save],
  )

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const acceptServer = useCallback(() => {
    setState((s) => {
      if (s.status !== 'conflict' || !s.conflictBlob || s.conflictVersion == null) {
        return s
      }
      return {
        blob: s.conflictBlob,
        version: s.conflictVersion,
        status: 'ready',
      }
    })
  }, [])

  const keepMine = useCallback(() => {
    setState((s) => {
      if (s.status !== 'conflict' || s.conflictVersion == null) return s
      void save(s.blob, s.conflictVersion)
      return s
    })
  }, [save])

  return { state, output, updateBlob, acceptServer, keepMine }
}
