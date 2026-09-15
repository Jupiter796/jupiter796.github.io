import { useEffect, useRef } from 'react'

/**
 * 浪漫页的星空背景：Canvas 画的浮动光点 + 闪烁星光。
 *
 * 几个刻意的取舍：
 *   - **不用 class 组件、不加依赖**，就是一个固定铺满视口的 canvas，纯装饰（aria-hidden）。
 *   - 视口变化、被 R 缩小或放大时按 devicePixelRatio 重建粒子，不做拉伸，避免发虚。
 *   - 标签页切到后台就停掉 rAF，不白烧 CPU/电。
 *   - 用户在系统里开了「减少动态效果」就一个粒子都不画，交给 CSS 的静态渐变背景。
 */

type Particle = {
  x: number
  y: number
  r: number
  /** 每秒漂移速度 */
  vx: number
  vy: number
  /** 亮度 */
  a: number
  /** 色相：粉白 / 星蓝 / 金 */
  hue: [number, number, number]
  /** 闪烁相位 */
  phase: number
  /** 闪烁频率 */
  speed: number
  /** 是否带光晕（大一点的才画光晕，省算力） */
  halo: boolean
}

/** 粉白 / 星蓝 / 金 —— 和页面 --ro-glow-* 三个色值对齐 */
const HUES: Array<[number, number, number]> = [
  [255, 240, 250],
  [186, 214, 255],
  [255, 226, 178],
]

function createParticles(width: number, height: number): Particle[] {
  // 数量跟着面积走，但封顶，别在 4K 屏上画爆
  const count = Math.min(190, Math.round((width * height) / 12000))
  const list: Particle[] = []

  for (let i = 0; i < count; i++) {
    const r = Math.random() * 1.5 + 0.35
    list.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r,
      vx: (Math.random() - 0.5) * 0.09,
      vy: -(Math.random() * 0.16 + 0.02),
      a: Math.random() * 0.6 + 0.22,
      hue: HUES[Math.floor(Math.random() * HUES.length)],
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.0011 + 0.0003,
      halo: r > 1.05,
    })
  }

  return list
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 尊重「减少动态效果」：不启动动画，只留 CSS 的静态夜空
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduced.matches) return

    let width = 0
    let height = 0
    let particles: Particle[] = []
    let rafId = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      // 之后所有绘制都用 CSS 像素坐标，由 transform 负责放大
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      particles = createParticles(width, height)
    }

    const draw = (stamp: number) => {
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        // 出界就绕回另一侧，粒子永远填满视口
        if (p.y < -8) {
          p.y = height + 8
          p.x = Math.random() * width
        }
        if (p.x < -8) p.x = width + 8
        else if (p.x > width + 8) p.x = -8

        const twinkle = 0.68 + 0.32 * Math.sin(stamp * p.speed + p.phase)
        const alpha = Math.min(1, p.a * twinkle)
        const [r, g, b] = p.hue

        if (p.halo) {
          const halo = p.r * 6
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, halo)
          grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`)
          grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(p.x, p.y, halo, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      rafId = window.requestAnimationFrame(draw)
    }

    const start = () => {
      if (!rafId) rafId = window.requestAnimationFrame(draw)
    }
    const stop = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
        rafId = 0
      }
    }

    // 切到后台停动画，回来再接着画
    const onVisibility = () => (document.hidden ? stop() : start())
    // 系统里中途改了「减少动态效果」也生效
    const onReducedChange = () => {
      if (reduced.matches) {
        stop()
        ctx.clearRect(0, 0, width, height)
      } else {
        resize()
        start()
      }
    }

    resize()
    start()

    const observer = new ResizeObserver(() => {
      resize()
    })
    observer.observe(canvas)
    document.addEventListener('visibilitychange', onVisibility)
    reduced.addEventListener('change', onReducedChange)

    return () => {
      stop()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      reduced.removeEventListener('change', onReducedChange)
    }
  }, [])

  return <canvas className="romance-canvas" ref={canvasRef} aria-hidden="true" />
}
