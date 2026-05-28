'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import type { Rol } from '@prisma/client'

const ROLES: Rol[] = ['rrhh', 'hygiene', 'calidad', 'encargado']
const ROL_LABEL: Record<Rol, string> = { superadmin: 'Superadmin', rrhh: 'RRHH', hygiene: 'H&S', calidad: 'Calidad', encargado: 'Encargado' }

type UserRow = { id: string; email: string; nombre: string; rol: Rol; activo: boolean }

type ModalData = Partial<UserRow> & { password?: string }

export default function AdminUsuariosPage() {
  const [users, setUsers]   = useState<UserRow[]>([])
  const [modal, setModal]   = useState<ModalData | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function load() {
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    setError('')
    try {
      const isNew = !modal?.id
      const url   = isNew ? '/api/admin/users' : `/api/admin/users/${modal!.id}`
      const res   = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modal),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error'); return }
      setModal(null)
      await load()
    } finally { setSaving(false) }
  }

  async function toggleActivo(user: UserRow) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !user.activo }),
    })
    await load()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--sica-white)' }}>
          Usuarios del Sistema
        </h1>
        <button onClick={() => setModal({ rol: 'rrhh' })} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Plus size={14} /> Nuevo Usuario
        </button>
      </div>

      <div className="card-glass overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(46,66,114,0.5)', borderBottom: '1px solid rgba(138,155,190,0.2)' }}>
              {['Nombre', 'Email', 'Rol', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sica-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(138,155,190,0.1)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--sica-white)' }}>{u.nombre}</td>
                <td className="px-4 py-3" style={{ color: 'var(--sica-muted)' }}>{u.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(26,154,214,0.15)', color: 'var(--sica-blue)', border: '1px solid rgba(26,154,214,0.3)' }}>
                    {ROL_LABEL[u.rol]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs" style={{ color: u.activo ? '#10b981' : '#f87171' }}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 flex items-center gap-3">
                  <button onClick={() => setModal(u)} style={{ color: 'var(--sica-blue)' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => toggleActivo(u)} style={{ color: u.activo ? '#10b981' : '#f87171' }}>
                    {u.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card-glass p-6 w-full max-w-md flex flex-col gap-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--sica-white)' }}>
              {modal.id ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>

            {(['nombre', 'email'] as const).map((k) => (
              <div key={k}>
                <label className="block text-xs mb-1 font-medium capitalize" style={{ color: 'var(--sica-muted)' }}>{k}</label>
                <input type={k === 'email' ? 'email' : 'text'} className="input-sica text-sm"
                  value={(modal as Record<string, string>)[k] ?? ''}
                  onChange={(e) => setModal((m) => ({ ...m, [k]: e.target.value }))}
                />
              </div>
            ))}

            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--sica-muted)' }}>Rol</label>
              <select className="input-sica text-sm" value={modal.rol ?? 'rrhh'}
                onChange={(e) => setModal((m) => ({ ...m, rol: e.target.value as Rol }))}>
                {ROLES.map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--sica-muted)' }}>
                Contraseña {modal.id ? '(dejar vacío para no cambiar)' : ''}
              </label>
              <input type="password" className="input-sica text-sm"
                value={modal.password ?? ''}
                onChange={(e) => setModal((m) => ({ ...m, password: e.target.value }))}
              />
            </div>

            {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="btn-ghost text-sm flex-1 py-2">Cancelar</button>
              <button onClick={save} disabled={saving} className="btn-primary text-sm flex-1 py-2 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
