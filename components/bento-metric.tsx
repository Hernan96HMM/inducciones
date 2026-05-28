'use client'

import { motion } from 'framer-motion'

interface BentoMetricProps {
  valor: number
  label: string
  color?: string
  icon?: React.ReactNode
}

export default function BentoMetric({ valor, label, color = '#1A9AD6', icon }: BentoMetricProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="card-glass p-5 flex flex-col gap-1"
    >
      <div className="flex items-start justify-between">
        <span
          className="text-4xl font-bold leading-none"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', color }}
        >
          {valor}
        </span>
        {icon && <span style={{ color: 'var(--sica-muted)' }}>{icon}</span>}
      </div>
      <span
        className="text-xs uppercase tracking-widest"
        style={{ color: 'var(--sica-muted)', fontFamily: 'JetBrains Mono, monospace' }}
      >
        {label}
      </span>
    </motion.div>
  )
}
