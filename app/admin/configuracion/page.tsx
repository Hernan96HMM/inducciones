'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AdminConfigPage() {
  const [smtp, setSmtp] = useState({ host: '', port: '587', user: '', pass: '' })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function testConnection() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtp),
      })
      const d = await res.json()
      setTestResult({ ok: d.ok, msg: d.ok ? 'Conexión exitosa' : d.error })
    } finally { setTesting(false) }
  }

  const set = (k: string, v: string) => setSmtp((s) => ({ ...s, [k]: v }))

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <h1 className="text-3xl font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--sica-white)' }}>
        Configuración
      </h1>

      <div className="card-glass p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--sica-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            Notificaciones Email (SMTP)
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--sica-muted)' }}>
            Para activar email, configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD y EMAIL_ENABLED=true en el archivo <code>.env</code> y reinicie el contenedor.
          </p>
        </div>

        {[
          { key: 'host', label: 'Servidor SMTP', placeholder: 'smtp.gmail.com' },
          { key: 'port', label: 'Puerto', placeholder: '587' },
          { key: 'user', label: 'Usuario', placeholder: 'usuario@empresa.com' },
          { key: 'pass', label: 'Contraseña', placeholder: '••••••••', type: 'password' },
        ].map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--sica-muted)' }}>{label}</label>
            <input
              type={type ?? 'text'}
              className="input-sica text-sm"
              placeholder={placeholder}
              value={(smtp as Record<string, string>)[key]}
              onChange={(e) => set(key, e.target.value)}
            />
          </div>
        ))}

        {testResult && (
          <div className="flex items-center gap-2 text-sm" style={{ color: testResult.ok ? '#10b981' : '#f87171' }}>
            {testResult.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {testResult.msg}
          </div>
        )}

        <button
          onClick={testConnection}
          disabled={testing || !smtp.host}
          className="btn-ghost flex items-center justify-center gap-2 text-sm py-2.5"
        >
          {testing ? <Loader2 size={14} className="animate-spin" /> : null}
          Probar Conexión SMTP
        </button>
      </div>
    </div>
  )
}
