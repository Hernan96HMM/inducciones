'use client'

import { Check } from 'lucide-react'

interface ChecklistItemProps {
  label: string
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}

export default function ChecklistItem({ label, checked, onChange, disabled = false }: ChecklistItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className="w-full flex items-start gap-4 py-3 px-4 rounded-lg text-left transition-colors"
      style={{
        background: checked ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${checked ? 'rgba(16,185,129,0.3)' : 'rgba(138,155,190,0.15)'}`,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {/* Checkbox visual */}
      <span
        className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-md flex items-center justify-center transition-colors"
        style={{
          background: checked ? '#10b981' : 'transparent',
          border: `2px solid ${checked ? '#10b981' : 'var(--sica-blue)'}`,
        }}
      >
        {checked && <Check size={14} color="#fff" strokeWidth={3} />}
      </span>

      <span
        className="text-sm leading-relaxed"
        style={{ color: checked ? 'var(--sica-muted)' : 'var(--sica-white)' }}
      >
        {label}
      </span>
    </button>
  )
}
