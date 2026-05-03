import { useEffect, useRef } from 'react'
import './Confetti.css'

const COLORS = [
  'var(--accent-primary)',
  'var(--success)',
  '#8b5cf6', // focus purple
  '#fbbf24',
  '#34d399',
  '#f87171',
]

const PARTICLE_COUNT = 60

function randomBetween(a, b) {
  return a + Math.random() * (b - a)
}

export default function Confetti({ active }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: canvas.width / 2 + randomBetween(-100, 100),
      y: canvas.height * 0.4,
      vx: randomBetween(-8, 8),
      vy: randomBetween(-14, -4),
      size: randomBetween(6, 12),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: randomBetween(-0.2, 0.2),
      opacity: 1,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }))

    let frame
    let startTime = Date.now()
    const duration = 3000

    const animate = () => {
      const elapsed = Date.now() - startTime
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        cancelAnimationFrame(frame)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const progress = elapsed / duration
      const fadeStart = 0.6

      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.4 // gravity
        p.vx *= 0.99 // drag
        p.rotation += p.rotationSpeed

        if (progress > fadeStart) {
          p.opacity = Math.max(0, 1 - (progress - fadeStart) / (1 - fadeStart))
        }

        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      })

      frame = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(frame)
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="confetti-canvas"
      aria-hidden="true"
    />
  )
}
