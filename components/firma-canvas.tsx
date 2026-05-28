'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { RotateCcw } from 'lucide-react'

interface FirmaCanvasProps {
  onCapture: (svg: string) => void
  strokeColor?: string
  width?: number
  height?: number
}

export default function FirmaCanvas({
  onCapture,
  strokeColor = '#2E4272',
  width = 500,
  height = 160,
}: FirmaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing   = useRef(false)
  const paths     = useRef<Array<Array<[number, number]>>>([])
  const current   = useRef<Array<[number, number]>>([])
  const [isEmpty, setIsEmpty] = useState(true)

  function getCtx() {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.strokeStyle = strokeColor
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    return ctx
  }

  function getPos(e: MouseEvent | Touch, canvas: HTMLCanvasElement): [number, number] {
    const rect  = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    return [
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top)  * scaleY,
    ]
  }

  const exportSvg = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || paths.current.length === 0) return

    const allPaths = paths.current
    const pathStrings = allPaths.map((pts) => {
      if (pts.length < 2) return ''
      const [start, ...rest] = pts
      const d = `M ${start[0].toFixed(1)} ${start[1].toFixed(1)} ` +
        rest.map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
      return `<path d="${d}" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
    }).join('\n')

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">\n${pathStrings}\n</svg>`
    onCapture(svg)
  }, [onCapture, strokeColor])

  function redraw() {
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const pts of paths.current) {
      if (pts.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
      ctx.stroke()
    }
  }

  function startDraw(x: number, y: number) {
    drawing.current = true
    current.current = [[x, y]]
  }

  function moveDraw(x: number, y: number) {
    if (!drawing.current) return
    const ctx = getCtx()
    if (!ctx) return
    current.current.push([x, y])
    const pts = current.current
    ctx.beginPath()
    ctx.moveTo(pts[pts.length - 2][0], pts[pts.length - 2][1])
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function endDraw() {
    if (!drawing.current) return
    drawing.current = false
    if (current.current.length > 1) {
      paths.current.push(current.current)
      setIsEmpty(false)
      exportSvg()
    }
    current.current = []
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Mouse events
    const onMouseDown = (e: MouseEvent) => { const [x, y] = getPos(e, canvas); startDraw(x, y) }
    const onMouseMove = (e: MouseEvent) => { const [x, y] = getPos(e, canvas); moveDraw(x, y) }
    const onMouseUp   = () => endDraw()

    // Touch events
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const [x, y] = getPos(e.touches[0], canvas)
      startDraw(x, y)
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const [x, y] = getPos(e.touches[0], canvas)
      moveDraw(x, y)
    }
    const onTouchEnd = () => endDraw()

    canvas.addEventListener('mousedown',  onMouseDown)
    canvas.addEventListener('mousemove',  onMouseMove)
    canvas.addEventListener('mouseup',    onMouseUp)
    canvas.addEventListener('mouseleave', onMouseUp)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false })
    canvas.addEventListener('touchend',   onTouchEnd)

    return () => {
      canvas.removeEventListener('mousedown',  onMouseDown)
      canvas.removeEventListener('mousemove',  onMouseMove)
      canvas.removeEventListener('mouseup',    onMouseUp)
      canvas.removeEventListener('mouseleave', onMouseUp)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove',  onTouchMove)
      canvas.removeEventListener('touchend',   onTouchEnd)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportSvg])

  function clear() {
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    paths.current   = []
    current.current = []
    setIsEmpty(true)
    onCapture('')
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative rounded-lg overflow-hidden"
        style={{ border: '2px solid rgba(138,155,190,0.3)' }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full touch-none"
          style={{ background: '#fff', cursor: 'crosshair', display: 'block' }}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
            <span className="text-xs" style={{ color: 'rgba(46,66,114,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>
              Firmar aquí
            </span>
          </div>
        )}
        {/* Línea guía */}
        <div
          className="absolute bottom-8 left-6 right-6 border-b pointer-events-none"
          style={{ borderColor: 'rgba(46,66,114,0.2)', borderStyle: 'dashed' }}
        />
      </div>

      <button
        type="button"
        onClick={clear}
        className="btn-ghost flex items-center gap-2 text-sm self-start px-3 py-1.5"
      >
        <RotateCcw size={14} />
        Limpiar firma
      </button>
    </div>
  )
}
