<template>
  <!-- 2.5D 室内剖视图：把一栋楼「拆开」看里面 -->
  <figure class="iso" :class="`iso--${sceneKey}`">
    <figcaption class="iso__cap">
      <span class="iso__tag">INSIDE</span>
      <b>{{ scene.title }}</b>
      <i>{{ scene.sub }}</i>
    </figcaption>

    <svg
      class="iso__svg"
      :viewBox="box"
      role="img"
      :aria-label="`${scene.title}的室内剖视图：${scene.sub}`"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- 地面 / 墙 / 踢脚 -->
      <path v-for="(p, i) in shell" :key="`s${i}`" :d="p.d" :fill="p.fill || 'none'"
            :stroke="p.stroke || 'none'" :stroke-width="p.sw || 0" :opacity="p.opacity == null ? 1 : p.opacity" />

      <!-- 墙上的东西（窗、黑板、海报） -->
      <path v-for="(p, i) in wallParts" :key="`w${i}`" :d="p.d" :fill="p.fill || 'none'"
            :stroke="p.stroke || 'none'" :stroke-width="p.sw || 0" :opacity="p.opacity == null ? 1 : p.opacity" />

      <!-- 家具：按 x+y 排序，近的压远的 -->
      <g v-for="(item, i) in placed" :key="`p${i}`">
        <path v-for="(p, j) in item.parts" :key="`q${j}`" :d="p.d" :fill="p.fill || 'none'"
              :stroke="p.stroke || 'none'" :stroke-width="p.sw || 0" :opacity="p.opacity == null ? 1 : p.opacity" />
      </g>

      <!-- 区域小牌 -->
      <g v-for="(l, i) in labels" :key="`l${i}`">
        <rect :x="l.rx" :y="l.ry" :width="l.rw" :height="l.rh" rx="9"
              fill="rgba(255, 253, 252, .92)" stroke="rgba(255, 255, 255, .95)" stroke-width="1"
              :transform="`rotate(-0.01 ${l.cx} ${l.cy})`" />
        <text :x="l.cx" :y="l.cy + 4.2" text-anchor="middle" class="iso__lb">{{ l.t }}</text>
      </g>
    </svg>
  </figure>
</template>

<script setup>
import { computed } from 'vue'
import { ip, r1 } from './iso/iso'
import { drawProp } from './iso/props'
import { SCENES } from './iso/scenes'

const props = defineProps({
  sceneKey: { type: String, default: 'home' }
})

const scene = computed(() => SCENES[props.sceneKey] || SCENES.home)

/** 房间外壳 */
const shell = computed(() => {
  const r = scene.value.room
  const { w, d, h } = r
  const wallL = r.wallL || '#f3e2e8'
  const wallR = r.wallR || '#fdf0ea'
  const floor = r.floor || '#f0dccb'
  const parts = []

  // 地板 + 木纹
  parts.push({ d: polyOf([ip(0, 0), ip(w, 0), ip(w, d), ip(0, d)]), fill: floor })
  for (let i = 1; i < Math.round(d); i++) {
    parts.push({ d: `M${pt(ip(0, i))}L${pt(ip(w, i))}`, fill: 'none', stroke: 'rgba(150, 110, 90, .14)', sw: 1 })
  }
  // 后墙两面
  parts.push({ d: polyOf([ip(0, 0, 0), ip(0, d, 0), ip(0, d, h), ip(0, 0, h)]), fill: wallL })
  parts.push({ d: polyOf([ip(0, 0, 0), ip(w, 0, 0), ip(w, 0, h), ip(0, 0, h)]), fill: wallR })
  // 墙脚
  parts.push({ d: polyOf([ip(0, 0, 0), ip(0, d, 0), ip(0, d, 5), ip(0, 0, 5)]), fill: 'rgba(160, 120, 110, .26)' })
  parts.push({ d: polyOf([ip(0, 0, 0), ip(w, 0, 0), ip(w, 0, 5), ip(0, 0, 5)]), fill: 'rgba(160, 120, 110, .18)' })
  // 墙缝
  parts.push({ d: `M${pt(ip(0, 0, 0))}L${pt(ip(0, 0, h))}`, fill: 'none', stroke: 'rgba(150, 110, 120, .28)', sw: 1.3 })
  // 剖切面（楼板厚度）
  parts.push({ d: polyOf([ip(0, d, 0), ip(w, d, 0), ip(w, d, -8), ip(0, d, -8)]), fill: '#dcc6b0' })
  parts.push({ d: polyOf([ip(w, 0, 0), ip(w, d, 0), ip(w, d, -8), ip(w, 0, -8)]), fill: '#cbb39c' })

  // 院子等附加地面
  ;(scene.value.extras || []).filter((e) => e.kind === 'ground').forEach((g) => {
    parts.push({ d: polyOf([ip(g.x, g.y), ip(g.x + g.w, g.y), ip(g.x + g.w, g.y + g.d), ip(g.x, g.y + g.d)]), fill: g.fill })
  })
  return parts
})

/** 墙上的件 */
const wallParts = computed(() => {
  const out = []
  ;(scene.value.walls || []).forEach((w) => {
    const fn = PROP_WALLS[w.type]
    if (fn) out.push(...fn(w))
  })
  return out
})

/** 地上的件：按 x+y 排序（不能叫 props —— 会和 defineProps 的返回值撞名） */
const placed = computed(() => {
  const list = []
  ;(scene.value.props || []).forEach((p) => {
    const parts = drawProp(p)
    if (parts.length) list.push({ depth: p.x + p.y + (p.d || 0) * 0.5, parts })
  })
  // 院子里的东西（秋千、花坛、栅栏）跟房子一起排
  ;(scene.value.extras || []).filter((e) => e.type).forEach((e) => {
    const parts = drawProp(e)
    if (parts.length) list.push({ depth: e.x + e.y + (e.w || 0) * 0.5, parts })
  })
  return list.sort((a, b) => a.depth - b.depth)
})

/** 区域小牌：先用屏幕坐标算好矩形，交给模板画 */
const labels = computed(() => {
  return (scene.value.labels || []).map((l) => {
    const [cx, cy] = ip(l.x, l.y, (l.z || 30) + 30)
    const w = Math.max(34, l.t.length * 12 + 16)
    const h = 19
    return { t: l.t, cx, cy, rx: cx - w / 2, ry: cy - h / 2, rw: w, rh: h }
  })
})

/** 取景框：把地、墙、院子和牌子都框进去 */
const box = computed(() => {
  const r = scene.value.room
  const pts = [
    ip(0, 0, r.h + 8), ip(r.w, 0, r.h + 8), ip(0, r.d, r.h + 8),
    ip(0, r.d, -14), ip(r.w, r.d, -14), ip(r.w, 0, -14),
    ip(0, 0, 0), ip(r.w, 0, 0), ip(0, r.d, 0), ip(r.w, r.d, 0)
  ]
  ;(scene.value.extras || []).forEach((e) => {
    if (e.kind === 'ground') {
      pts.push(ip(e.x, e.y, 0), ip(e.x + e.w, e.y + e.d, 0), ip(e.x, e.y + e.d, 0), ip(e.x + e.w, e.y, 0))
    } else {
      pts.push(ip(e.x, e.y, 0), ip(e.x, e.y + (e.w || 1), 0))
    }
  })
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  pts.forEach(([px, py]) => {
    x0 = Math.min(x0, px)
    y0 = Math.min(y0, py)
    x1 = Math.max(x1, px)
    y1 = Math.max(y1, py)
  })
  const pad = 12
  return `${r1(x0 - pad)} ${r1(y0 - pad - 12)} ${r1(x1 - x0 + pad * 2)} ${r1(y1 - y0 + pad * 2 + 12)}`
})

/* ---- 小工具（模板里直接用来拼路径） ---- */
function pt (p) { return `${r1(p[0])} ${r1(p[1])}` }
function polyOf (pts) { return 'M' + pts.map(pt).join('L') + 'Z' }

/* 墙面件单独取（props.js 里的 onWall 系列） */
import { onWall, ep } from './iso/iso'
const PROP_WALLS = {
  windowWall (s) {
    const { face, u0, u1, z0 = 22, z1 = 54 } = s
    return [
      onWall(face, 0, 0, u0, u1, z0, z1, '#cfe8f2'),
      onWall(face, 0, 0, u0, u1, z0, z1, 'none', { stroke: '#f7f0ea', sw: 3 }),
      onWall(face, 0, 0, (u0 + u1) / 2 - 0.015, (u0 + u1) / 2 + 0.015, z0, z1, '#fdfaf6'),
      onWall(face, 0, 0, u0, u1, (z0 + z1) / 2 - 1, (z0 + z1) / 2 + 1, '#fdfaf6'),
      onWall(face, 0, 0, u0 + 0.05, u1 - 0.05, z0 + 3, z1 - 6, 'rgba(255, 255, 255, .5)')
    ]
  },
  poster (s) {
    const { face, u0, u1, z0, z1 } = s
    return [
      onWall(face, 0, 0, u0, u1, z0, z1, '#fff8f0'),
      onWall(face, 0, 0, u0, u1, z0, z1, 'none', { stroke: 'rgba(140, 106, 120, .35)', sw: 1.2 }),
      onWall(face, 0, 0, u0 + 0.08, u1 - 0.08, z0 + (z1 - z0) * 0.55, z0 + (z1 - z0) * 0.8, s.c || '#f2a8bd'),
      onWall(face, 0, 0, u0 + 0.08, u1 - 0.08, z0 + (z1 - z0) * 0.2, z0 + (z1 - z0) * 0.45, s.c2 || '#a8c6d9')
    ]
  },
  blackboard (s) {
    const { u0 = 0.6, u1 = 2.4, z0 = 22, z1 = 52 } = s
    return [
      onWall('right', 0, 0, u0, u1, z0, z1, '#3a4b41'),
      onWall('right', 0, 0, u0, u1, z0, z1, 'none', { stroke: '#c9a183', sw: 4 }),
      onWall('right', 0, 0, u0 + 0.16, u0 + 0.9, z1 - 10, z1 - 7, 'rgba(255, 250, 240, .75)'),
      onWall('right', 0, 0, u0 + 0.16, u0 + 1.4, z1 - 17, z1 - 14.5, 'rgba(255, 250, 240, .55)'),
      onWall('right', 0, 0, u0 + 0.16, u0 + 1.1, z1 - 24, z1 - 21.5, 'rgba(255, 250, 240, .45)'),
      onWall('right', 0, 0, u0 - 0.04, u1 + 0.04, z0 - 2.6, z0, '#dfc2a4')
    ]
  }
}
</script>

<style scoped>
.iso {
  position: relative;
  margin: 0 0 22px;
  padding: 14px 16px 8px;
  border: 1px solid rgba(255, 255, 255, .82);
  border-radius: 24px;
  background:
    radial-gradient(120% 90% at 30% 0%, rgba(255, 255, 255, .9), rgba(255, 247, 244, .6) 60%, rgba(247, 236, 240, .5) 100%);
  box-shadow: var(--lift);
  overflow: hidden;
}
.iso__cap {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 0 4px 6px;
}
.iso__tag {
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: .26em;
  color: rgba(150, 116, 134, .7);
}
.iso__cap b {
  font-family: var(--font-serif);
  font-size: 14.5px;
  letter-spacing: .1em;
  color: var(--ink);
}
.iso__cap i {
  font-style: normal;
  font-size: 10.5px;
  letter-spacing: .06em;
  color: var(--muted);
}
.iso__svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 58vh;
}
.iso__lb {
  font-family: var(--font-serif);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .06em;
  fill: #6b4864;
}
</style>
