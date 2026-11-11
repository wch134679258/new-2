// ============================================================
//  樱花吹雪引擎 · 新海诚风格（Canvas 2D，零依赖）
// ------------------------------------------------------------
//  设计目标：灵动、通透、轻盈。不是「下花瓣雨」，而是空气里浮着樱花。
//
//  性能策略（决定 60fps 的关键）：
//   1. 花瓣按「颜色 × 翻面 8 档 × 景深 3 层」预渲染到离屏画布，
//      主循环只做 drawImage + translate/rotate/scale，绝不每帧调 bezier/渐变。
//      旧实现每片花瓣每帧都走一遍 petalPath + createLinearGradient，
//      100 片就要上万次贝塞尔求值，低端机直接掉帧。
//   2. DPR 上限 2；移动端自动降密度（系数 0.7）与 DPR（1.5）。
//   3. 固定步长积分 + dt 上限 32ms，切后台 pause、回前台不补帧。
//   4. 自适应画质：滑动平均帧时长 > 22ms 持续 60 帧就减花瓣数，保帧率不保数量。
//   5. 站点动效关闭（useMotion 判定）直接不启动。
//
//  物理：
//   - 匀速沉降（深度决定速度）+ 正弦侧摆（每片独立频率/相位/振幅）
//   - 低频噪声风场：由两层不同周期的正弦叠加而成，形成「阵风」而不是恒风
//   - 指针风场：由指针速度矢量驱动的高斯衰减力场，带惯性；
//     停止移动后力场在 ~600ms 内自然衰减归零，花瓣回到原来的轨迹
// ============================================================

import { motionEnabled } from './useMotion'

/** 配色：低饱和淡粉 / 近白 / 淡薰衣草。整站不走艳粉 */
const TONES = [
  { core: '#fff4f8', edge: '#ffd6e6', rim: '#ffb6d0' }, // 近白樱
  { core: '#ffe9f2', edge: '#ffc8dd', rim: '#ffa5c6' }, // 淡樱
  { core: '#fff1f6', edge: '#f6d3e4', rim: '#e9b3ce' }, // 浅灰粉
  { core: '#fbeffa', edge: '#ecd6f2', rim: '#d8b8e4' }, // 薰衣草
  { core: '#fff7f9', edge: '#ffe0ec', rim: '#ffd0e0' }  // 高光白
]

/** 翻面档位：8 档足够表现「侧过去变窄、背面变暗」，再多也只是浪费内存 */
const FLIP_STEPS = 8
/** 三层景深：远（小、淡、慢、轻虚化）/ 中 / 近（大、实、快） */
const DEPTHS = [
  { scale: 0.52, speed: 0.5, alpha: 0.42, blur: 0.6 },
  { scale: 0.85, speed: 0.85, alpha: 0.66, blur: 0 },
  { scale: 1.25, speed: 1.35, alpha: 0.92, blur: 0 }
]

/** 单瓣的贝塞尔轮廓：底端在原点，向 -y 生长，尖端有小缺口 */
function petalPath (ctx, w, h, notch) {
  const hw = w / 2
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(-hw * 0.98, -h * 0.3, -hw * 1.04, -h * 0.74, -hw * notch, -h)
  ctx.quadraticCurveTo(0, -h * (1 - 0.11), hw * notch, -h)
  ctx.bezierCurveTo(hw * 1.04, -h * 0.74, hw * 0.98, -h * 0.3, 0, 0)
  ctx.closePath()
}

/**
 * 预渲染一组花瓣贴片。
 * 返回 sprites[tone][flipStep][depth] = { canvas, pad }
 * 画布四周留 pad 空隙，边缘用 shadowBlur 做柔和过渡（只在这里做一次）。
 */
function buildSprites (base) {
  const sprites = []
  for (let ti = 0; ti < TONES.length; ti++) {
    const tone = TONES[ti]
    const perTone = []
    for (let f = 0; f < FLIP_STEPS; f++) {
      const squash = Math.max(0.16, Math.abs(Math.cos((f / FLIP_STEPS) * Math.PI * 2)))
      const back = f > FLIP_STEPS / 2
      const perFlip = []
      for (let d = 0; d < DEPTHS.length; d++) {
        const w = base * DEPTHS[d].scale
        const h = w * 1.3
        const pad = Math.ceil(w * 0.4 + 4)
        const cw = Math.ceil(w + pad * 2)
        const ch = Math.ceil(h + pad * 2)
        const cv = document.createElement('canvas')
        cv.width = cw
        cv.height = ch
        const c = cv.getContext('2d')
        c.translate(cw / 2, ch - pad)
        c.scale(squash, 1)
        c.shadowColor = tone.edge
        c.shadowBlur = 5 + d * 2
        petalPath(c, w, h, 0.2)
        const g = c.createLinearGradient(0, 0, 0, -h)
        g.addColorStop(0, back ? tone.edge : tone.core)
        g.addColorStop(0.55, back ? tone.rim : tone.core)
        g.addColorStop(1, tone.edge)
        c.fillStyle = g
        c.fill()
        c.shadowBlur = 0
        // 瓣脉：只在近景画，远景画脉只会脏
        if (d === 2) {
          c.beginPath()
          c.moveTo(0, -h * 0.14)
          c.lineTo(0, -h * 0.74)
          c.strokeStyle = tone.rim
          c.globalAlpha = 0.35
          c.lineWidth = Math.max(0.35, w * 0.035)
          c.stroke()
        }
        perFlip.push({ canvas: cv, pad })
      }
      perTone.push(perFlip)
    }
    sprites.push(perTone)
  }
  return sprites
}

export function createPetalField (canvas, opts = {}) {
  // 动效开关统一走 useMotion：默认开启，只有显式关闭时才不启动
  // （不要直接用 prefers-reduced-motion —— 系统关掉动画时整站花瓣会一起消失）
  const reduce = !motionEnabled()
  const mobile = window.matchMedia('(max-width: 720px)').matches
  const opt = {
    density: mobile ? 0.00006 : 0.000085, // 每平方像素花瓣数；移动端更低
    max: mobile ? 80 : 150,
    min: 36,
    base: 15,                            // 基准花瓣宽（像素），实际尺寸乘景深系数
    wind: 0.16,                          // 常态侧风强度
    ...opts
  }

  let ctx = null
  let W = 0
  let H = 0
  let dpr = 1
  let raf = null
  let last = 0
  let t = 0
  let running = false
  let petals = []
  let sprites = null
  let densityScale = 1                    // 自适应降载系数

  /* 指针风场：保留历史位置算速度，速度本身就是「风的强度」 */
  const ptr = { x: 0, y: 0, vx: 0, vy: 0, power: 0, has: false }

  function makePetal (seedY = null) {
    const depthR = Math.random()
    const depth = depthR < 0.42 ? 0 : depthR < 0.82 ? 1 : 2
    const tone = (Math.random() * TONES.length) | 0
    const flip = (Math.random() * FLIP_STEPS) | 0
    return {
      depth,
      tone,
      x: Math.random() * (W + 160) - 80,
      y: seedY == null ? -20 - Math.random() * H * 0.6 : seedY,
      // 每片独立的基础下沉速度：有的快有的慢
      vy: (14 + Math.random() * 16) * DEPTHS[depth].speed,
      // 独立侧摆：频率、相位、振幅都不同，才不会整片一起晃
      swayPhase: Math.random() * Math.PI * 2,
      swayFreq: 0.25 + Math.random() * 0.5,
      swayAmp: (10 + Math.random() * 22) * DEPTHS[depth].scale,
      // 自转：缓慢，且与摆动耦合一点点
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.5,
      flipPhase: Math.random() * Math.PI * 2,
      flipSpeed: (0.25 + Math.random() * 0.55) * (depth === 2 ? 1.3 : 1),
      flipOffset: flip,
      // 出生/死亡透明度，用于淡出
      alpha: DEPTHS[depth].alpha * (0.75 + Math.random() * 0.25),
      fade: 0,                            // 0→1 淡入
      life: 0
    }
  }

  function resize () {
    dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2)
    W = window.innerWidth
    H = window.innerHeight
    canvas.width = Math.floor(W * dpr)
    canvas.height = Math.floor(H * dpr)
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (!sprites) sprites = buildSprites(opt.base)
    retune()
  }

  function retune () {
    const want = Math.round(W * H * opt.density * densityScale)
    const n = Math.max(opt.min, Math.min(opt.max, want))
    while (petals.length < n) petals.push(makePetal(Math.random() * H))
    if (petals.length > n) petals.length = n
  }

  /* 自适应降载：滑动平均帧时长超标就减花瓣，绝不硬撑 */
  let frameAvg = 16.7
  let slowCount = 0

  function step (now) {
    raf = requestAnimationFrame(step)
    if (!running) return
    const raw = now - last
    const dt = Math.min(32, raw || 16.7)
    last = now
    const dtSec = dt / 1000
    t += dtSec

    frameAvg += (raw - frameAvg) * 0.05
    if (frameAvg > 23) {
      if (++slowCount > 60 && densityScale > 0.4) {
        densityScale *= 0.85
        retune()
        slowCount = 0
      }
    } else if (slowCount > 0) slowCount--

    ctx.clearRect(0, 0, W, H)

    /* 低频风场：两个不可通约周期的正弦叠加，得到不规则阵风 */
    const gust =
      Math.sin(t * 0.21) * 0.6 +
      Math.sin(t * 0.53 + 1.7) * 0.3 +
      Math.sin(t * 0.13) * 0.4
    const wind = opt.wind + gust * 0.42

    /* 指针风场：速度矢量决定强度，指数衰减 */
    ptr.vx *= 0.9
    ptr.vy *= 0.9
    const speed = Math.hypot(ptr.vx, ptr.vy)
    const targetPower = Math.min(1, speed / 22)
    ptr.power += (targetPower - ptr.power) * 0.12

    for (let i = 0; i < petals.length; i++) {
      const p = petals[i]
      p.life += dtSec
      if (p.fade < 1) p.fade = Math.min(1, p.fade + dtSec * 0.6)

      const sway = Math.sin(p.swayPhase + t * p.swayFreq) * p.swayAmp

      /* 指针推开：高斯衰减，越远越弱 */
      let px = 0
      let py = 0
      if (ptr.power > 0.02) {
        const dx = p.x - ptr.x
        const dy = p.y - ptr.y
        const d2 = dx * dx + dy * dy
        const R = 200 + p.depth * 70
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 1
          const fall = Math.exp(-d2 / (R * R * 0.5))
          const force = fall * ptr.power * (60 + p.depth * 50)
          px = (dx / d) * force
          py = (dy / d) * force
        }
      }

      // x = 基础侧风 + 独立正弦摆 + 指针推开
      p.x += (wind * 26 * DEPTHS[p.depth].scale + sway * 0.6 + px) * dtSec
      p.y += (p.vy + py) * dtSec
      p.rot += (p.spin + Math.cos(p.swayPhase + t * p.swayFreq) * 0.35) * dtSec
      p.flipPhase += p.flipSpeed * dtSec

      // 出界回收：从顶部重新飘落，不重置透明度导致「闪一下」
      if (p.y > H + 50) {
        const np = makePetal(-30)
        np.x = Math.random() * (W + 80) - 40
        petals[i] = np
        continue
      }
      if (p.x > W + 90) p.x = -70
      else if (p.x < -90) p.x = W + 60

      // 快到屏幕底部时淡出，避免「硬切」消失
      const edgeFade = Math.min(1, Math.max(0, (H + 40 - p.y) / 90))
      const a = p.alpha * p.fade * edgeFade
      if (a <= 0.004) continue

      // 翻面：用连续相位映射到预渲染档位
      const phase = ((p.flipPhase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
      const fs = Math.floor((phase / (Math.PI * 2)) * FLIP_STEPS) % FLIP_STEPS

      const spr = sprites[p.tone][fs][p.depth]
      const w = spr.canvas.width
      const h = spr.canvas.height

      ctx.save()
      ctx.globalAlpha = a
      ctx.translate(p.x + sway * 0.35, p.y)
      ctx.rotate(p.rot)
      // 翻面压缩已经烘焙在 sprite 内，这里不再重复 scale
      // drawImage 是 GPU 友好的合成操作，比每帧描路径快一个量级
      ctx.drawImage(spr.canvas, -w / 2, -h + spr.pad)
      ctx.restore()
    }
  }

  /* ---------------- 生命周期 ---------------- */
  function onResize () { resize() }
  function onVisibility () {
    running = document.visibilityState === 'visible'
    last = performance.now()
  }
  function onPointer (e) {
    const pt = e.touches ? e.touches[0] : e
    if (!pt) return
    if (ptr.has) {
      // 位移差分近似速度（px/帧），不用时间戳避免高刷屏偏差
      ptr.vx = ptr.vx * 0.5 + (pt.clientX - ptr.x) * 0.5
      ptr.vy = ptr.vy * 0.5 + (pt.clientY - ptr.y) * 0.5
    }
    ptr.x = pt.clientX
    ptr.y = pt.clientY
    ptr.has = true
  }
  function onLeave () {
    ptr.has = false
    ptr.vx = ptr.vy = 0
  }

  function mount () {
    if (reduce) return
    ctx = canvas.getContext('2d', { alpha: true })
    resize()
    window.addEventListener('resize', onResize, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('pointerleave', onLeave, { passive: true })
    window.addEventListener('blur', onLeave, { passive: true })
    running = document.visibilityState === 'visible'
    last = performance.now()
    raf = requestAnimationFrame(step)
  }

  function destroy () {
    if (raf) cancelAnimationFrame(raf)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pointermove', onPointer)
    window.removeEventListener('pointerleave', onLeave)
    window.removeEventListener('blur', onLeave)
    sprites = null
    petals = []
  }

  return { mount, destroy }
}
