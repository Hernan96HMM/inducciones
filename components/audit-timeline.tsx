import type { AuditLog, User } from '@prisma/client'

type LogEntry = AuditLog & { usuario: Pick<User, 'nombre' | 'rol'> }

export default function AuditTimeline({ logs }: { logs: LogEntry[] }) {
  if (logs.length === 0) {
    return <p className="text-sm" style={{ color: 'var(--sica-muted)' }}>Sin actividad registrada.</p>
  }

  return (
    <ol className="relative flex flex-col gap-0">
      {logs.map((log, i) => (
        <li key={log.id} className="flex gap-4 pb-6 relative">
          {/* Línea vertical */}
          {i < logs.length - 1 && (
            <div
              className="absolute left-[11px] top-6 bottom-0 w-px"
              style={{ background: 'rgba(138,155,190,0.2)' }}
            />
          )}

          {/* Dot */}
          <div
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 z-10"
            style={{ background: 'var(--sica-navy)', border: '2px solid var(--sica-blue)' }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--sica-blue)' }} />
          </div>

          {/* Content */}
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--sica-white)' }}>
              {log.accion}
            </p>
            {log.detalle && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--sica-muted)' }}>
                {log.detalle}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: 'var(--sica-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              {log.usuario.nombre} · {new Date(log.timestamp).toLocaleString('es-AR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
