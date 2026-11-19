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

      <!-- 家具 + 隔墙：按 x+y 排序，近的压远的 -->
      <g v-for="(item, i) in placed" :key="`p${i}`">
        <path v-for="(p, j) in item.parts" :key="`q${j}`" :d="p.d" :fill="p.fill || 'none'"
              :stroke="p.stroke || 'none'" :stroke-width="p.sw || 0" :opacity="p.opacity == null ? 1 : p.opacity" />
      </g>

      <!-- 前沿墙垛：剖切面上留着的一小段外墙，给房间一点包裹感 -->
      <g v-if="pierParts.length">
        <path v-for="(p, i) in pierParts" :key="`pr${i}`" :d="p.d" :fill="p.fill || 'none'"
              :stroke="p.stroke || 'none'" :stroke-width="p.sw || 0" :opacity="p.opacity == null ? 1 : p.opacity" />
      </g>

      <!-- 前沿墙垛：剖切面上留着的一小段外墙，给房间一点包裹感 -->
      <!-- 前景：贴着镜头的东西，不参与排序，永远压在最上面 -->
      <g v-if="foreParts.length">
        <path v-for="(p, i) in foreParts" :key="`f${i}`" :d="p.d" :fill="p.fill || 'none'"
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
import { ip, r1, onWall, ep, divider, doorFrame, roomShell, frontPiers } from './iso/iso'
import { drawProp } from './iso/props'
import { SCENES } from './iso/scenes'

const props = defineProps({
  sceneKey: { type: String, default: 'home' }
})

const scene = computed(() => SCENES[props.sceneKey] || SCENES.home)

/** 房间外壳：直接用 iso.js 的 roomShell，别在这儿再写一份（两份会走样） */
const shell = computed(() => {
  const r = scene.value.room
  const parts = roomShell(r)
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
  // 隔墙：切成小段跟进队列，家具才不会整片压在墙前面
  ;(scene.value.dividers || []).forEach((d) => {
    divider(d).forEach((seg) => list.push({ depth: seg.depth, parts: seg.parts }))
    if (d.door) {
      const df = doorFrame(d.axis || 'y', d.at, d.door.at, d.door.w, d.door.z || 38, d.doorColor || '#c9a183')
      list.push({ depth: d.at + d.door.at, parts: df })
    }
  })
  return list.sort((a, b) => a.depth - b.depth)
})

/** 前沿墙垛：画在家具之后（它比所有家具都靠前） */
const pierParts = computed(() => frontPiers(scene.value.room))

/** 前景：贴着镜头的遮挡（近处的墙角、垂下的花枝），永远画在最上层 */
const foreParts = computed(() => {
  const out = []
  ;(scene.value.foreground || []).forEach((f) => {
    if (f.parts) out.push(...f.parts)
    else {
      const parts = drawProp(f)
      if (parts.length) out.push(...parts)
    }
  })
  return out
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
  const pad = 8
  return `${r1(x0 - pad)} ${r1(y0 - pad - 8)} ${r1(x1 - x0 + pad * 2)} ${r1(y1 - y0 + pad * 2 + 8)}`
})

/* ---- 小工具（模板里直接用来拼路径） ---- */
function pt (p) { return `${r1(p[0])} ${r1(p[1])}` }
function polyOf (pts) { return 'M' + pts.map(pt).join('L') + 'Z' }

/* 墙面件单独取（props.js 里的 onWall 系列） */
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
  /** 挂钟：圆壳 + 指针，墙面上一个小亮点 */
  clock (s) {
    const { face, u0 = 2.4, z = 44 } = s
    const [cx, cy] = face === 'left' ? ip(0, u0, z) : ip(u0, 0, z)
    return [
      { d: ep(cx, cy, 11, 11), fill: '#fffdf6' },
      { d: ep(cx, cy, 11, 11), fill: 'none', stroke: '#c9a183', sw: 2.4 },
      { d: ep(cx, cy, 9, 9), fill: 'none', stroke: 'rgba(150, 110, 100, .2)', sw: 0.8 },
      { d: `M${pt([cx, cy])}V${r1(cy - 6.4)}`, fill: 'none', stroke: '#6b5470', sw: 1.8 },
      { d: `M${pt([cx, cy])}H${r1(cx + 4.6)}`, fill: 'none', stroke: '#6b5470', sw: 1.6 },
      { d: ep(cx, cy, 1.4, 1.4), fill: '#8d6a86' }
    ]
  },

  /** 窗帘：一根杆 + 两侧垂下的布 */
  curtain (s) {
    const { face, u0, u1, z0 = 24, z1 = 56 } = s
    const c = s.c || 'rgba(255, 244, 240, .94)'
    const w = u1 - u0
    const parts = [
      onWall(face, 0, 0, u0 - 0.05, u1 + 0.05, z1 + 1.5, z1 + 3, '#c9a183'),
      onWall(face, 0, 0, u0, u0 + w * 0.22, z0, z1, c),
      onWall(face, 0, 0, u1 - w * 0.22, u1, z0, z1, c)
    ]
    // 布褶：两条竖线
    parts.push(onWall(face, 0, 0, u0 + w * 0.08, u0 + w * 0.1, z0, z1, 'rgba(180, 140, 150, .18)'))
    parts.push(onWall(face, 0, 0, u1 - w * 0.12, u1 - w * 0.1, z0, z1, 'rgba(180, 140, 150, .18)'))
    // 底下摆一道边
    parts.push(onWall(face, 0, 0, u0, u0 + w * 0.22, z0, z0 + 1.6, 'rgba(190, 150, 160, .22)'))
    parts.push(onWall(face, 0, 0, u1 - w * 0.22, u1, z0, z0 + 1.6, 'rgba(190, 150, 160, .22)'))
    return parts
  },

  /** 墙面搁板：一块板 + 上面几件小东西 */
  wallShelf (s) {
    const { face, u0, u1, z = 42 } = s
    const parts = [
      onWall(face, 0, 0, u0, u1, z - 1.6, z, '#d9b48c'),
      onWall(face, 0, 0, u0, u1, z, z + 1.2, '#c4a179')
    ]
    // 板上：两本书 + 一个小瓶 + 一盆小植物
    const w = u1 - u0
    parts.push(onWall(face, 0, 0, u0 + 0.06, u0 + 0.16, z + 1.2, z + 6.4, '#c9556f'))
    parts.push(onWall(face, 0, 0, u0 + 0.17, u0 + 0.26, z + 1.2, z + 5.4, '#7f9fc9'))
    parts.push(onWall(face, 0, 0, u0 + w * 0.52, u0 + w * 0.58, z + 1.2, z + 5.2, 'rgba(206, 232, 238, .95)'))
    parts.push(onWall(face, 0, 0, u0 + w * 0.48, u0 + w * 0.62, z + 5.2, z + 6.4, '#9cbb8e'))
    parts.push(onWall(face, 0, 0, u0 + w * 0.72, u0 + w * 0.8, z + 1.2, z + 4.2, '#b189c4'))
    return parts
  },

  /** 挂轴：和式房间里那种竖长条的字画 */
  scroll (s) {
    const { face, u0, z0 = 26, z1 = 52 } = s
    const w = s.w || 0.42
    return [
      onWall(face, 0, 0, u0, u0 + w, z0, z1, '#f8f1e4'),
      onWall(face, 0, 0, u0, u0 + w, z0, z1, 'none', { stroke: 'rgba(150, 110, 90, .34)', sw: 1.2 }),
      onWall(face, 0, 0, u0 - 0.04, u0 + w + 0.04, z1, z1 + 2, '#8a6152'),
      onWall(face, 0, 0, u0 - 0.04, u0 + w + 0.04, z0 - 2, z0, '#8a6152'),
      // 画心的一点墨
      onWall(face, 0, 0, u0 + w * 0.28, u0 + w * 0.72, z0 + 6, z0 + 12, 'rgba(90, 80, 86, .55)'),
      onWall(face, 0, 0, u0 + w * 0.34, u0 + w * 0.66, z0 + 13, z0 + 15, 'rgba(90, 80, 86, .35)')
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
  max-height: min(58vh, 560px);
}
.iso__lb {
  font-family: var(--font-serif);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .06em;
  fill: #6b4864;
}
</style>
