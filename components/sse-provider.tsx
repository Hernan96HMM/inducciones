'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'

interface SSEEvent {
  type: 'estado_changed' | 'pendientes_count'
  ingresoId?: string
  estado?: string
  pendientes?: number
}

interface SSECtx {
  lastEvent: SSEEvent | null
  pendientes: number
}

const Ctx = createContext<SSECtx>({ lastEvent: null, pendientes: 0 })

export function useSSE() {
  return useContext(Ctx)
}

export default function SSEProvider({ children, initialPendientes = 0 }: {
  children: React.ReactNode
  initialPendientes?: number
}) {
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null)
  const [pendientes, setPendientes] = useState(initialPendientes)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    function connect() {
      const es = new EventSource('/api/events')
      esRef.current = es

      es.onmessage = (e) => {
        try {
          const data: SSEEvent = JSON.parse(e.data)
          setLastEvent(data)
          if (data.type === 'pendientes_count' && data.pendientes !== undefined) {
            setPendientes(data.pendientes)
          }
        } catch { /* ignore malformed */ }
      }

      es.onerror = () => {
        es.close()
        // Reconnect after 5s
        setTimeout(connect, 5000)
      }
    }

    connect()
    return () => esRef.current?.close()
  }, [])

  return <Ctx.Provider value={{ lastEvent, pendientes }}>{children}</Ctx.Provider>
}
