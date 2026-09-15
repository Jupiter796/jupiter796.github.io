import { useEffect, useRef } from 'react'

/**
 * 一束电子鲜花。
 *
 * **全部是代码画出来的**：没有任何图片、SVG 资源或第三方绘图库，每一片花瓣、
 * 叶子和包装纸都是每帧用 Canvas 2D 现算贝塞尔曲线描出来的。
 *
 * 一次「盛开」的过程（seed 决定花束长什么样，所以同一束每次看到的都一样）：
 *   环境星芒渐显 → 花茎从握把处生长 → 叶子依次舒展 → 花瓣由内向外一片片绽开
 *   → 常态下轻微摇曳，偶尔飘落几片花瓣。
 *
 * 几个刻意的取舍：
 *   - 画布内部用固定的 **1000×1250 设计坐标系**，按容器等比缩放（contain），
 *     所以版式在桌面和手机上都一样，只是整体大小不同。
 *   - 全部几何数据由种子随机数生成（mulberry32），不用 Math.random：
 *     刷新页面得到的是同一束花，点「再开一束」才换新的。
 *   - 系统开了「减少动态效果」就直接画一帧盛开态，不起动画循环。
 *   - 标签页切到后台停掉 rAF；改窗口大小用 ResizeObserver 重建画布分辨率。
 */

/* ------------------------------------------------------------------ */
/* 设计坐标与调色                                                       */
/* ------------------------------------------------------------------ */

const W = 1000
const H = 1250

/** 花束的握把（所有花茎的起点） */
const ANCHOR = { x: 500, y: 1000 }
const STEM_LEN = 470

const TIME = {
  /** 星芒淡入 */
  ambient: 0.9,
  /** 花茎生长 */
  stem: 1.6,
  /** 叶子舒展 */
  leaf: 1.1,
  /** 花瓣绽开 */
  petals: 1.5,
}

const STEM_HOLD = TIME.ambient + TIME.stem
const LEAF_HOLD = STEM_HOLD + TIME.leaf
const BLOOM_HOLD = LEAF_HOLD + TIME.petals

/** 三种花形。rose 是重瓣玫瑰（每层一圈花瓣），daisy 是单层雏菊，tulip 是杯状郁金香 */
type FlowerKind = 'rose' | 'daisy' | 'tulip'

type Layer = {
  count: number
  /** 该层花瓣长度相对花头半径的比例 */
  len: number
  /** 该层花瓣宽度相对长度的比例 */
  width: number
  /** 整层相对花头的缩放 */
  scale: number
}

const KIND_LAYERS: Record<FlowerKind, Layer[]> = {
  rose: [
    { count: 6, len: 0.96, width: 0.72, scale: 1 },
    { count: 5, len: 0.74, width: 0.7, scale: 0.64 },
    { count: 4, len: 0.52, width: 0.66, scale: 0.36 },
  ],
  daisy: [{ count: 11, len: 0.98, width: 0.34, scale: 1 }],
  tulip: [
    { count: 5, len: 1.02, width: 0.78, scale: 1 },
    { count: 3, len: 0.82, width: 0.72, scale: 0.72 },
  ],
}

/** 花瓣由外向内、由深到浅。也用来推花心颜色 */
const PALETTES: string[][] = [
  ['#8a1136', '#c9184a', '#e5386d', '#ff6f91', '#ffb3c6'],
  ['#a01a4c', '#d6226b', '#f45b8f', '#ff8fb1', '#ffc9dc'],
  ['#8c3b0a', '#d2591a', '#ef7d3a', '#ffa869', '#ffd0a8'],
  ['#6a11a3', '#8f34c9', '#b164e0', '#cf97f0', '#e7c8fb'],
  ['#9b6a06', '#d4a017', '#eec44a', '#f7dd8b', '#fdf0c4'],
  ['#a01a3c', '#d9455f', '#f06f7f', '#ff9aa6', '#ffcdd3'],
]

const LEAF_FILL = '#3c7d4b'
const LEAF_DARK = '#2a5c37'
const LEAF_LIGHT = '#5ea86a'
const STEM_FILL = '#356f43'

/** 背景与光晕按主题取色（canvas 不透明，自己铺底，所以要自己感知深浅色） */
type Palette = {
  sky: [string, string]
  glow: string
  halo: string
  sparkle: string
  shadow: string
  wrapLight: string
  wrapDark: string
  ribbon: string
}

const PALETTES_BY_THEME: Record<'dark' | 'light', Palette> = {
  dark: {
    sky: ['#0b1020', '#241238'],
    glow: 'rgba(255, 214, 232, 0.2)',
    halo: 'rgba(255, 226, 170, 0.11)',
    sparkle: 'rgba(255, 246, 224, 0.95)',
    shadow: 'rgba(0, 0, 0, 0.42)',
    wrapLight: '#7b8fd6',
    wrapDark: '#333d6b',
    ribbon: '#f0a6c0',
  },
  light: {
    sky: ['#fffaf6', '#ffe9f0'],
    glow: 'rgba(255, 176, 205, 0.34)',
    halo: 'rgba(255, 206, 120, 0.2)',
    sparkle: 'rgba(196, 140, 60, 0.75)',
    shadow: 'rgba(120, 80, 100, 0.22)',
    wrapLight: '#cbd6f5',
    wrapDark: '#8d9bd0',
    ribbon: '#e0779f',
  },
}

/* ------------------------------------------------------------------ */
/* 小工具                                                             */
/* ------------------------------------------------------------------ */

/** 种子随机数：同一个种子永远长出同一束花 */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = (rng: () => number, min: number, max: number) => min + rng() * (max - min)
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3)
/** 0 → 1 的平滑过渡，用于单朵花 / 单层花瓣的错峰出现 */
const easeInOut = (t: number) => {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/** 把 #rrggbb 按比例插值，用来给同一片花瓣做出"根部深、尖端浅"的渐变 */
function mixHex(from: string, to: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
  const a = parse(from)
  const b = parse(to)
  const k = clamp01(t)
  const mix = a.map((v, i) => Math.round(v + (b[i] - v) * k))
  const hex = (v: number) => v.toString(16).padStart(2, '0')
  return `#${hex(mix[0])}${hex(mix[1])}${hex(mix[2])}`
}

/* ------------------------------------------------------------------ */
/* 花束的几何数据                                                       */
/* ------------------------------------------------------------------ */

type Leaf = {
  /** 长在哪根茎上（索引） */
  stem: number
  /** 沿茎的位置 0..1 */
  at: number
  /** 朝向：-1 左 / 1 右 */
  side: number
  len: number
  width: number
  /** 舒展完成的时刻（秒） */
  delay: number
}

type Flower = {
  kind: FlowerKind
  palette: string[]
  /** 花头相对握把的角度（度，0 = 正上方）与距离 */
  angle: number
  dist: number
  /** 花头半径 */
  size: number
  /** 整朵开始绽放的时刻（秒） */
  delay: number
  /** 每根茎上叶子的摆动相位，避免所有花同步摇 */
  phase: number
  /** 花茎中段的横向弯曲量 */
  bow: number
  /** 花头自身的旋转 */
  tilt: number
}

type Bouquet = {
  flowers: Flower[]
  leaves: Leaf[]
}

function buildBouquet(seed: number): Bouquet {
  const rng = mulberry32(seed)

  // 朵数：5 朵打底，种子决定 5~7 朵
  const count = 5 + Math.floor(rng() * 3)
  const flowers: Flower[] = []
  const leaves: Leaf[] = []

  // 调色板轮流用，保证一束里有几种颜色而不是随机撞成一片同色
  const offset = Math.floor(rng() * PALETTES.length)

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    // 角度在 -36°~36° 之间均匀铺开，再加一点抖动
    const angle = -36 + 72 * t + rand(rng, -5, 5)
    // 中间的花稍高、两侧的花稍短，形成扇形
    const dist = STEM_LEN * (0.78 + 0.22 * (1 - Math.abs(angle) / 40)) * rand(rng, 0.96, 1.04)

    const kindRoll = t < 0.34 ? 'rose' : t > 0.68 ? rng() < 0.55 ? 'daisy' : 'rose' : 'rose'
    const kind: FlowerKind = rng() < 0.12 ? 'tulip' : (kindRoll as FlowerKind)

    const size =
      kind === 'daisy' ? rand(rng, 44, 54) : kind === 'tulip' ? rand(rng, 42, 50) : rand(rng, 50, 64)

    flowers.push({
      kind,
      palette: PALETTES[(offset + i) % PALETTES.length],
      angle,
      dist,
      size,
      // 中间的先开，两侧的后开
      delay: rand(rng, 0, TIME.petals * 0.42) + Math.abs(angle) / 150,
      phase: rand(rng, 0, Math.PI * 2),
      bow: rand(rng, -26, 26),
      tilt: rand(rng, -16, 16),
    })
  }

  // 叶子：挑几根茎，各自左/右伸一两片
  for (let i = 0; i < count; i++) {
    const n = 1 + Math.floor(rng() * 2)
    for (let k = 0; k < n; k++) {
      leaves.push({
        stem: i,
        at: rand(rng, 0.28, 0.8),
        side: rng() < 0.5 ? -1 : 1,
        len: rand(rng, 72, 116),
        width: rand(rng, 22, 34),
        delay: rand(rng, 0, TIME.leaf * 0.55),
      })
    }
  }

  return { flowers, leaves }
}

/** 花茎的中点：从握把到花头之间鼓一点，看起来像自然弯过去的 */
function stemControl(f: Flower, sway: number) {
  const rad = ((f.angle - 90) * Math.PI) / 180
  const ex = ANCHOR.x + Math.cos(rad) * f.dist
  const ey = ANCHOR.y + Math.sin(rad) * f.dist
  const mx = (ANCHOR.x + ex) / 2 + f.bow + sway * 10
  const my = (ANCHOR.y + ey) / 2 - 30
  return { ex, ey, mx, my }
}

/** 二阶贝塞尔取点，用来把叶子放到茎上 */
function pointOnStem(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  t: number,
) {
  const u = 1 - t
  return {
    x: u * u * x0 + 2 * u * t * cx + t * t * x1,
    y: u * u * y0 + 2 * u * t * cy + t * t * y1,
  }
}

/* ------------------------------------------------------------------ */
/* 绘制                                                               */
/* ------------------------------------------------------------------ */

type Speck = {
  x: number
  y: number
  r: number
  a: number
  phase: number
  speed: number
  /** 下落的快慢 */
  vy: number
  drift: number
  spin: number
}

/** 背景星芒 / 飘落的花瓣，共用一个小粒子结构 */
function buildSpecks(rng: () => number, seed: number): Speck[] {
  const list: Speck[] = []
  const count = 34 + Math.floor(rng() * 14)
  for (let i = 0; i < count; i++) {
    // 一部分是背景星芒（基本不动），一部分是会飘落的花瓣
    const falling = i % 3 === 0
    list.push({
      x: rand(rng, 20, W - 20),
      y: rand(rng, 0, H),
      r: falling ? rand(rng, 5, 11) : rand(rng, 1.2, 2.8),
      a: rand(rng, 0.25, 0.85),
      phase: rand(rng, 0, Math.PI * 2),
      speed: rand(rng, 0.6, 1.6),
      vy: falling ? rand(rng, 16, 34) : 0,
      drift: rand(rng, -12, 12),
      spin: rand(rng, -0.9, 0.9) * (seed % 2 === 0 ? 1 : 1),
    })
  }
  return list
}

/** 一片花瓣的轮廓：从根部收窄的泪滴形，用两段贝塞尔收出尖端 */
function petalPath(ctx: CanvasRenderingContext2D, len: number, width: number) {
  const hw = width / 2
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(hw * 1.02, -len * 0.16, hw * 1.14, -len * 0.66, 0, -len)
  ctx.bezierCurveTo(-hw * 1.14, -len * 0.66, -hw * 1.02, -len * 0.16, 0, 0)
  ctx.closePath()
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  f: Flower,
  bloom: number,
  growth: number,
  time: number,
  pal: Palette,
) {
  if (bloom <= 0.001) return

  const sway = Math.sin(time * 0.6 + f.phase)
  const { ex, ey } = stemControl(f, sway)
  const scale = growth * (1 + 0.03 * sway)

  ctx.save()
  ctx.translate(ex, ey)
  // 花头的微小摇摆 + 自身倾角
  ctx.rotate(((f.tilt * Math.PI) / 180) * 0.35 + sway * 0.06)
  ctx.scale(scale, scale)

  const pal5 = f.palette
  const layers = KIND_LAYERS[f.kind]
  const R = f.size

  // 花瓣：逐层、逐片错峰展开（先长出来，再向外张开）
  for (let li = 0; li < layers.length; li++) {
    const layer = layers[li]
    const layerStart = layers.length > 1 ? (li / layers.length) * 0.55 : 0
    const layerSpread = 0.45 + 0.55 * easeInOut(bloom / Math.max(0.001, layerStart + 0.45))

    for (let pi = 0; pi < layer.count; pi++) {
      const stagger = pi / layer.count
      const local = easeOutCubic(bloom * 1.6 - layerStart - stagger * 0.26)
      if (local <= 0) continue

      const angle = (pi / layer.count) * 360 + layerStart * 40 + stagger * 6 + (li % 2 ? 18 : 0)
      // 花瓣按角度和层序在调色板里取值，越靠内越浅
      const cFrom = pal5[Math.min(pal5.length - 1, li)]
      const cTo = pal5[Math.min(pal5.length - 1, li + 2)]
      const shade = mixHex(cFrom, cTo, 0.15 + 0.5 * (pi / layer.count))

      const len = R * layer.len * local * (0.94 + 0.12 * Math.sin(pi * 2.3 + f.phase))
      const wid = R * layer.len * layer.width * local * layerSpread * 2

      ctx.save()
      ctx.rotate((angle * Math.PI) / 180)
      // 花瓣向外张开：绕根部转一点，并在盛开过程中向外顶
      ctx.translate(0, -R * 0.05 * layer.scale * local)
      ctx.scale(1, 0.86 + 0.14 * local - 0.2 * (1 - local))

      const grad = ctx.createLinearGradient(0, 0, 0, -len)
      grad.addColorStop(0, cFrom)
      grad.addColorStop(0.55, shade)
      grad.addColorStop(1, cTo)
      ctx.fillStyle = grad
      petalPath(ctx, len, wid)
      ctx.fill()

      // 花瓣中脉，让花看起来有体积
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)'
      ctx.lineWidth = Math.max(0.6, R * 0.012)
      ctx.beginPath()
      ctx.moveTo(0, -len * 0.12)
      ctx.lineTo(0, -len * 0.92)
      ctx.stroke()

      ctx.restore()
    }
  }

  // 花心：渐入的光晕 + 一点点花蕊
  const core = easeOutCubic(bloom * 1.3 - 0.55)
  if (core > 0) {
    const cr = R * 0.3 * core
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, cr * 2.4)
    glow.addColorStop(0, 'rgba(255, 246, 214, 0.95)')
    glow.addColorStop(0.45, 'rgba(255, 210, 130, 0.55)')
    glow.addColorStop(1, 'rgba(255, 190, 110, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(0, 0, cr * 2.4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 252, 235, 0.95)'
    ctx.beginPath()
    ctx.arc(0, 0, cr * 0.52, 0, Math.PI * 2)
    ctx.fill()

    if (f.kind !== 'rose') {
      ctx.fillStyle = 'rgba(214, 158, 54, 0.85)'
      const dots = f.kind === 'daisy' ? 7 : 5
      for (let d = 0; d < dots; d++) {
        const ang = (d / dots) * Math.PI * 2 + f.phase
        ctx.beginPath()
        ctx.arc(Math.cos(ang) * cr * 0.85, Math.sin(ang) * cr * 0.85, cr * 0.14, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // 花头后面一圈柔光，让花从背景里浮出来
  if (bloom > 0.5) {
    ctx.globalCompositeOperation = 'lighter'
    const halo = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 2.1)
    halo.addColorStop(0, pal.glow)
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = halo
    ctx.beginPath()
    ctx.arc(0, 0, R * 2.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  ctx.restore()
}

function drawLeaves(
  ctx: CanvasRenderingContext2D,
  bouquet: Bouquet,
  grow: number,
  time: number,
) {
  for (const leaf of bouquet.leaves) {
    const f = bouquet.flowers[leaf.stem]
    const stemGrow = clamp01((grow - TIME.ambient) / TIME.stem)
    if (stemGrow <= 0.05) continue

    const sway = Math.sin(time * 0.6 + f.phase)
    const { ex, ey, mx, my } = stemControl(f, sway)
    const base = pointOnStem(ANCHOR.x, ANCHOR.y, mx, my, ex, ey, leaf.at * stemGrow)

    const open = easeOutCubic((grow - STEM_HOLD - leaf.delay) / TIME.leaf)
    if (open <= 0) continue

    // 叶柄方向：沿茎的切线再向侧面张开
    const tangent = Math.atan2(ey - ANCHOR.y, ex - ANCHOR.x)
    const angle = tangent + leaf.side * (0.85 + 0.35 * open) - Math.PI / 2
    const flap = Math.sin(time * 0.8 + f.phase + leaf.at * 6)

    ctx.save()
    ctx.translate(base.x, base.y)
    ctx.rotate(angle + flap * 0.05)
    ctx.scale(open, open * (0.7 + 0.3 * open))

    const len = leaf.len
    const wid = leaf.width

    // 叶柄
    ctx.strokeStyle = STEM_FILL
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -len * 0.22)
    ctx.stroke()

    const grad = ctx.createLinearGradient(0, 0, 0, -len)
    grad.addColorStop(0, LEAF_DARK)
    grad.addColorStop(0.6, LEAF_FILL)
    grad.addColorStop(1, LEAF_LIGHT)
    ctx.fillStyle = grad

    // 柳叶形：左右两条对称贝塞尔 + 中央主脉
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(wid * 0.9, -len * 0.26, wid * 0.75, -len * 0.72, 0, -len)
    ctx.bezierCurveTo(-wid * 0.75, -len * 0.72, -wid * 0.9, -len * 0.26, 0, 0)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
    ctx.lineWidth = 1.1
    ctx.beginPath()
    ctx.moveTo(0, -len * 0.06)
    ctx.lineTo(0, -len * 0.96)
    ctx.stroke()

    ctx.restore()
  }
}

function drawWrap(ctx: CanvasRenderingContext2D, growth: number, pal: Palette) {
  const open = easeOutCubic((growth - STEM_HOLD + 0.35) / 0.7)
  if (open <= 0) return

  ctx.save()
  ctx.globalAlpha = open

  // 包装纸：握把处收窄、向上张开的花瓣形纸
  const topY = ANCHOR.y - 250
  const grad = ctx.createLinearGradient(0, topY, 0, ANCHOR.y + 60)
  grad.addColorStop(0, pal.wrapLight)
  grad.addColorStop(0.65, pal.wrapDark)
  grad.addColorStop(1, pal.wrapDark)
  ctx.fillStyle = grad

  ctx.beginPath()
  ctx.moveTo(ANCHOR.x - 26, ANCHOR.y + 46)
  ctx.bezierCurveTo(ANCHOR.x - 120, ANCHOR.y - 30, ANCHOR.x - 176, ANCHOR.y - 170, ANCHOR.x - 150, topY)
  // 纸口：左右两片错开，做出层次
  ctx.bezierCurveTo(ANCHOR.x - 96, topY + 66, ANCHOR.x - 40, topY + 40, ANCHOR.x - 6, topY + 30)
  ctx.bezierCurveTo(ANCHOR.x + 34, topY + 78, ANCHOR.x + 96, topY + 60, ANCHOR.x + 150, topY + 12)
  ctx.bezierCurveTo(ANCHOR.x + 178, ANCHOR.y - 170, ANCHOR.x + 122, ANCHOR.y - 30, ANCHOR.x + 26, ANCHOR.y + 46)
  ctx.closePath()
  ctx.fill()

  // 折痕：从握把向纸口发散的几条线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)'
  ctx.lineWidth = 1.6
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue
    const tipX = ANCHOR.x + (i * 46) / 3 + (i % 2 ? 12 : -8)
    const tipY = topY + 34 + Math.abs(i) * 8
    ctx.beginPath()
    ctx.moveTo(ANCHOR.x, ANCHOR.y + 30)
    ctx.quadraticCurveTo(ANCHOR.x + (i * 70) / 3, ANCHOR.y - 120, tipX, tipY)
    ctx.stroke()
  }

  // 束带：握把处一条，加一个简化的蝴蝶结
  ctx.fillStyle = pal.ribbon
  ctx.beginPath()
  ctx.moveTo(ANCHOR.x - 40, ANCHOR.y - 6)
  ctx.quadraticCurveTo(ANCHOR.x, ANCHOR.y + 16, ANCHOR.x + 40, ANCHOR.y - 6)
  ctx.quadraticCurveTo(ANCHOR.x, ANCHOR.y - 22, ANCHOR.x - 40, ANCHOR.y - 6)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = pal.ribbon
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(ANCHOR.x, ANCHOR.y + 2)
    ctx.quadraticCurveTo(
      ANCHOR.x + side * 46,
      ANCHOR.y - 30,
      ANCHOR.x + side * 26,
      ANCHOR.y + 54,
    )
    ctx.stroke()
  }

  ctx.restore()
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  bouquet: Bouquet,
  specks: Speck[],
  time: number,
  growth: number,
  pal: Palette,
) {
  // 分段执行：万一某一段画崩了，也让它明确暴露出来（写到 <canvas data-stage> 上），
  // 而不是留下半张画、还查不出原因。
  const stages: Array<[string, () => void]> = [
    ['sky', () => drawSky(ctx, pal)],
    ['ambient', () => drawAmbient(ctx, growth, pal)],
    ['specks', () => drawSpecks(ctx, specks, time, growth, pal)],
    ['shadow', () => drawShadow(ctx, growth, pal)],
    ['stems', () => drawStems(ctx, bouquet, time, growth)],
    ['wrap', () => drawWrap(ctx, growth, pal)],
    ['leaves', () => drawLeaves(ctx, bouquet, growth, time)],
    [
      'flowers',
      () => {
        const stemGrow = clamp01((growth - TIME.ambient) / TIME.stem)
        const bloomAll = clamp01((growth - LEAF_HOLD) / TIME.petals)
        for (const f of bouquet.flowers) {
          const bloom = easeOutCubic(bloomAll * (1 + TIME.petals) - f.delay)
          drawFlower(ctx, f, bloom, stemGrow, time, pal)
        }
      },
    ],
  ]

  for (const [name, run] of stages) {
    try {
      run()
    } catch (error) {
      // 画崩了要看得见：既写进 DOM，也在画布左上角糊一块醒目的红，
      // 免得到时候只看到"半张画"还以为是配色问题
      if (ctx.canvas) ctx.canvas.dataset.stage = `failed:${name}`
      console.error(`[flowers] 绘制阶段 "${name}" 出错：`, error)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = 'rgba(220, 20, 60, 0.85)'
      ctx.fillRect(0, 0, 140, 26)
      return
    }
  }
}

function drawSky(ctx: CanvasRenderingContext2D, pal: Palette) {
  const sky = ctx.createLinearGradient(0, 0, W * 0.35, H)
  sky.addColorStop(0, pal.sky[0])
  sky.addColorStop(1, pal.sky[1])
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)
}

/** 花束背后的一团暖光 */
function drawAmbient(ctx: CanvasRenderingContext2D, growth: number, pal: Palette) {
  const ambient = clamp01(growth / TIME.ambient)
  if (ambient <= 0) return

  const cy = ANCHOR.y - STEM_LEN * 0.62
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = ambient
  const halo = ctx.createRadialGradient(ANCHOR.x, cy, 40, ANCHOR.x, cy, STEM_LEN * 1.05)
  halo.addColorStop(0, pal.halo)
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(ANCHOR.x, cy, STEM_LEN * 1.05, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** 背景星芒 + 飘落的花瓣 */
function drawSpecks(
  ctx: CanvasRenderingContext2D,
  specks: Speck[],
  time: number,
  growth: number,
  pal: Palette,
) {
  const ambient = clamp01(growth / TIME.ambient)
  const release = clamp01((growth - BLOOM_HOLD * 0.6) / 1)

  for (const s of specks) {
    const twinkle = 0.55 + 0.45 * Math.sin(time * s.speed + s.phase)
    const alpha = s.a * twinkle * (0.35 + 0.65 * ambient)

    if (s.vy === 0) {
      ctx.save()
      ctx.globalAlpha = alpha * 0.8
      ctx.fillStyle = pal.sparkle
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = alpha * 0.35
      ctx.fillRect(s.x - s.r * 3.2, s.y - 0.5, s.r * 6.4, 1)
      ctx.fillRect(s.x - 0.5, s.y - s.r * 3.2, 1, s.r * 6.4)
      ctx.restore()
      continue
    }

    if (release <= 0) continue

    const y = (s.y + time * s.vy) % (H + 60)
    const x = s.x + Math.sin(time * 0.5 + s.phase) * s.drift * 1.6

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(time * s.spin + s.phase)
    ctx.globalAlpha = alpha * release * 0.9
    const petalGrad = ctx.createLinearGradient(0, 0, 0, -s.r * 2)
    petalGrad.addColorStop(0, '#e5386d')
    petalGrad.addColorStop(1, '#ffc9dc')
    ctx.fillStyle = petalGrad
    petalPath(ctx, s.r * 2, s.r * 1.3)
    ctx.fill()
    ctx.restore()
  }
}

/** 花束底下的影子 */
function drawShadow(ctx: CanvasRenderingContext2D, growth: number, pal: Palette) {
  ctx.save()
  ctx.globalAlpha = 0.5 * clamp01(growth / TIME.stem)
  ctx.fillStyle = pal.shadow
  ctx.beginPath()
  ctx.ellipse(ANCHOR.x + 8, ANCHOR.y + 98, 168, 26, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** 花茎：从握把往外长 */
function drawStems(
  ctx: CanvasRenderingContext2D,
  bouquet: Bouquet,
  time: number,
  growth: number,
) {
  const stemGrow = clamp01((growth - TIME.ambient) / TIME.stem)
  if (stemGrow <= 0) return

  ctx.lineCap = 'round'
  for (const f of bouquet.flowers) {
    const sway = Math.sin(time * 0.6 + f.phase)
    const { ex, ey, mx, my } = stemControl(f, sway)

    // 茎按 stemGrow 从握把往外长
    const tipX = ANCHOR.x + (ex - ANCHOR.x) * stemGrow
    const tipY = ANCHOR.y + (ey - ANCHOR.y) * stemGrow
    const ctlX = ANCHOR.x + (mx - ANCHOR.x) * stemGrow
    const ctlY = ANCHOR.y + (my - ANCHOR.y) * stemGrow

    ctx.strokeStyle = STEM_FILL
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.moveTo(ANCHOR.x, ANCHOR.y)
    ctx.quadraticCurveTo(ctlX, ctlY, tipX, tipY)
    ctx.stroke()

    // 高光：让茎不是一根死板的绿线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)'
    ctx.lineWidth = 2.2
    ctx.beginPath()
    ctx.moveTo(ANCHOR.x - 1.6, ANCHOR.y)
    ctx.quadraticCurveTo(ctlX - 1.6, ctlY, tipX - 1.6, tipY)
    ctx.stroke()
  }
}

/* ------------------------------------------------------------------ */
/* 组件                                                               */
/* ------------------------------------------------------------------ */

export function FlowersCanvas({ seed, resetKey }: { seed: number; resetKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const bouquet = buildBouquet(seed)
    const specks = buildSpecks(mulberry32(seed ^ 0x5bf03635), seed)

    let width = 0
    let height = 0
    let scale = 1
    let offX = 0
    let offY = 0
    let elapsed = 0
    let last = 0
    let rafId = 0
    /** 是否已经确认"时间在走"、可以正式播动画 */
    let running = false
    /** 探路用的帧计数 */
    let probes = 0

    const readPalette = (): Palette =>
      document.documentElement.dataset.theme === 'light'
        ? PALETTES_BY_THEME.light
        : PALETTES_BY_THEME.dark

    // ?still=1 只画一帧盛开态、不起动画。
    // 用处：截图 / 视觉回归时能拿到完全确定的一帧（带随机摇曳的动画没法比对），
    // 也给"不想看动效"的人一个开关。
    const still = new URLSearchParams(window.location.search).has('still')

    const paint = (time: number, growth: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // 设计坐标 -> 画布坐标（contain，居中）
      ctx.setTransform(scale, 0, 0, scale, offX, offY)
      drawScene(ctx, bouquet, specks, time, growth, readPalette())
      // 把"开到哪一步了"写在 DOM 上：排查问题（以及做无头截图验证）时很有用，
      // 不用去猜那一帧到底画没画出来
      canvas.dataset.growth = growth.toFixed(2)
      canvas.dataset.flowers = String(bouquet.flowers.length)
      canvas.dataset.seed = String(seed)
      canvas.dataset.stage = canvas.dataset.stage?.startsWith('failed') ? canvas.dataset.stage : 'ok'
      canvas.dataset.frames = String(Number(canvas.dataset.frames ?? 0) + 1)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))

      scale = Math.min(canvas.width / W, canvas.height / H)
      offX = (canvas.width - W * scale) / 2
      offY = (canvas.height - H * scale) / 2

      if (reduced.matches) paint(BLOOM_HOLD + 4, BLOOM_HOLD + 4)
    }

    const draw = (stamp: number) => {
      if (!last) last = stamp
      const dtRaw = (stamp - last) / 1000
      const dt = Math.min(Math.max(dtRaw, 0), 0.05)
      last = stamp

      // 先确认"时间真的在走"，再开始播动画。
      //
      // 为什么需要这一步：有些环境里 rAF 只被调用几帧、而且这几帧的时间戳完全相同
      // （无头浏览器、后台标签页、省电模式）。此时 dt 恒为 0，动画进度永远停在 0，
      // 却会一帧帧把首帧画好的整束花擦成空背景 —— 最后看到的就是一片纯色。
      // 所以这里先空转两帧探路：时间没在走就直接收工，把首帧的盛开态留在画布上。
      if (!running) {
        probes += 1
        if (dtRaw > 0.004) {
          running = true
          elapsed = 0
        } else if (probes >= 3) {
          // 时间不走：保持盛开态，不再请求下一帧
          paint(BLOOM_HOLD + 4, BLOOM_HOLD + 4)
          rafId = 0
          return
        } else {
          paint(BLOOM_HOLD + 4, BLOOM_HOLD + 4)
          rafId = window.requestAnimationFrame(draw)
          return
        }
      }

      elapsed += dt

      // growth 按 BLOOM_HOLD 秒从 0 长到封顶值，之后只保留摇曳。
      // 归一化（而不是直接拿 elapsed 当 growth）保证实际耗时不等于设计时长时也能开完。
      const growth = Math.min(elapsed / BLOOM_HOLD, 1) * (BLOOM_HOLD + 4)
      paint(elapsed, growth)
      rafId = window.requestAnimationFrame(draw)
    }

    const start = () => {
      // still 模式下永远不起动画循环
      if (still || rafId || reduced.matches) return
      last = 0
      probes = 0
      rafId = window.requestAnimationFrame(draw)
    }
    const stop = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
        rafId = 0
      }
    }

    const onVisibility = () => (document.hidden ? stop() : start())
    const onReduced = () => {
      if (reduced.matches) {
        stop()
        paint(BLOOM_HOLD + 4, BLOOM_HOLD + 4)
      } else {
        start()
      }
    }

    resize()

    // 先同步画一帧"盛开完成"的样子：首帧就有花可看。
    // 少了这一步，在 rAF 被节流/冻结的环境（后台标签页、无头浏览器、某些省电模式）
    // 里画面会一直空着 —— 而一束花本来就该是"已经在花瓶里"的状态。
    elapsed = 0
    paint(BLOOM_HOLD + 4, BLOOM_HOLD + 4)
    // 然后从头开始播盛开动画（?still=1 时不播）
    if (!still) start()

    const observer = new ResizeObserver(() => {
      resize()
    })
    observer.observe(canvas)
    document.addEventListener('visibilitychange', onVisibility)
    reduced.addEventListener('change', onReduced)

    return () => {
      stop()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      reduced.removeEventListener('change', onReduced)
    }
    // resetKey 变化 = 重新播一次盛开；seed 变化 = 换一束花
  }, [seed, resetKey])

  return <canvas className="flowers-canvas" ref={canvasRef} aria-hidden="true" />
}
