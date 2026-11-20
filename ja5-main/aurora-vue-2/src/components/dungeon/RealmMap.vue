<template>
  <!--
    樱之异境 · 可走地图
    ------------------------------------------------------------
    和小镇同一套 2:1 等距投影（HW=44 / HH=22，16×16 格），
    点地面就沿直线走过去；走近遭遇点 1.4 格才会触发。
    镜头跟着人走，人物保持在画面偏下。
  -->
  <div ref="wrapEl" class="rmap" :class="`is-${region}`">
    <svg
      ref="svgEl"
      class="rmap__svg"
      viewBox="0 0 960 620"
      preserveAspectRatio="xMidYMid slice"
      @pointerdown="onGround"
    >
      <defs>
        <linearGradient :id="`ground-${uid}`" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" :stop-color="palette.top" />
          <stop offset="100%" :stop-color="palette.bottom" />
        </linearGradient>
        <radialGradient :id="`glow-${uid}`" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff6fb" stop-opacity=".85" />
          <stop offset="100%" stop-color="#fff6fb" stop-opacity="0" />
        </radialGradient>
        <linearGradient :id="`fog-${uid}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="palette.fog" stop-opacity=".8" />
          <stop offset="100%" :stop-color="palette.fog" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- 远景：不随镜头动（天空/雾/山影） -->
      <g class="rmap__far">
        <ellipse v-for="(m, i) in farShapes" :key="`far${i}`" :cx="m.x" :cy="m.y" :rx="m.rx" :ry="m.ry" :fill="palette.far" opacity=".5" />
        <rect x="0" y="0" width="960" height="150" :fill="`url(#fog-${uid})`" opacity=".55" />
      </g>

      <!-- 世界：跟着人平移 -->
      <g :transform="`translate(${-cam.x} ${-cam.y})`">
        <!-- 地面：一圈外沿 + 主体菱形 -->
        <path :d="rimD" :fill="palette.rim" opacity=".9" />
        <path :d="groundD" :fill="`url(#ground-${uid})`" />
        <!-- 格线：每 4 格一道，太密会像方格纸 -->
        <path v-for="(l, i) in gridLines" :key="`gl${i}`" :d="l" fill="none" :stroke="palette.line" stroke-width="1" opacity=".22" />
        <!-- 区域专属地面图形 -->
        <g v-for="(s, i) in groundDecals" :key="`gd${i}`">
          <path v-if="s.d" :d="s.d" :fill="s.fill" :opacity="s.o" />
          <ellipse v-else :cx="s.cx" :cy="s.cy" :rx="s.rx" :ry="s.ry" :fill="s.fill" :opacity="s.o" />
        </g>
        <!-- 小径 -->
        <path :d="pathD" fill="none" :stroke="palette.path" stroke-width="26" stroke-linecap="round" opacity=".8" />
        <path :d="pathD" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="6 12" opacity=".35" />

        <!-- 人物身后的物件 -->
        <g v-for="p in behind" :key="p.key">
          <path :d="p.d" :fill="p.fill" :opacity="p.o" />
        </g>

        <!-- 遭遇点（在人物身后那一半） -->
        <RealmEnc
          v-for="e in behindEncs" :key="e.id"
          :enc="e" :done="doneOf(e)" :locked="!meets(e)" :scale="encScale(e)"
          :x="sx(e)" :y="sy(e)"
          @go="walkTo(e)"
        />

        <!-- 人物 -->
        <g :transform="`translate(${mePos.x} ${mePos.y})`" class="rmap__me">
          <ellipse cx="0" cy="4" rx="19" ry="7" :fill="palette.shadow" opacity=".3" />
          <g :class="{ 'is-walking': walking }" :style="{ transform: `translateY(${-bob}px) scale(1.28)` }">
            <path d="M-9 -6q9 -5 18 0l3 12q-12 5 -24 0Z" :fill="palette.cloth" />
            <path d="M-6 6l-3 12M6 6l3 12" :stroke="palette.clothDark" stroke-width="5" stroke-linecap="round" />
            <circle cx="0" cy="-14" r="8" fill="#ffe3d2" />
            <path d="M-8 -16q2 -10 8 -10t8 10q-4 -5 -8 -5t-8 5Z" fill="#584152" />
            <circle cx="6" cy="-20" r="3.4" fill="#584152" />
            <circle cx="6" cy="-20" r="1.6" fill="#f9b8cd" />
            <path d="M9 -8l4 -10" stroke="#7d6478" stroke-width="2.6" stroke-linecap="round" />
          </g>
        </g>

        <!-- 人物前面的物件 -->
        <RealmEnc
          v-for="e in frontEncs" :key="e.id"
          :enc="e" :done="doneOf(e)" :locked="!meets(e)" :scale="encScale(e)"
          :x="sx(e)" :y="sy(e)"
          @go="walkTo(e)"
        />
        <g v-for="p in front" :key="p.key">
          <path :d="p.d" :fill="p.fill" :opacity="p.o" />
        </g>

        <!-- 樱枝门：走到门口就切下一个区域，别只靠顶上的标签 -->
        <g class="rmap__portal" :transform="`translate(${portalPos.x} ${portalPos.y})`" @click.stop="walkTo(portal)">
          <ellipse cx="0" cy="0" rx="46" ry="18" :fill="palette.shadow" opacity=".18" />
          <path d="M-30 -6 L-30 -84" :stroke="palette.portal" stroke-width="7" stroke-linecap="round" />
          <path d="M30 -6 L30 -84" :stroke="palette.portal" stroke-width="7" stroke-linecap="round" />
          <path d="M-42 -84 L42 -84" :stroke="palette.portal" stroke-width="7" stroke-linecap="round" />
          <path d="M-50 -94 L50 -94" :stroke="palette.portal" stroke-width="5" stroke-linecap="round" opacity=".8" />
          <path d="M-9 -86 L9 -86 L9 -72 L-9 -72 Z" fill="#fdf6fb" opacity=".9" />
          <path d="M-6 -82 L6 -82" :stroke="palette.portal" stroke-width="2" stroke-linecap="round" />
          <text y="16" text-anchor="middle" class="rmap__portal-label">樱枝门</text>
        </g>
      </g>

      <!-- 前景遮挡：固定在屏幕上，不随镜头走，纵深就出来了 -->
      <g class="rmap__front" aria-hidden="true">
        <g v-for="(f, i) in foreground" :key="`fg${i}`">
          <path :d="f.d" :fill="f.fill" opacity=".9" />
        </g>
      </g>
    </svg>

    <!-- 走不过去/锁着的提示 -->
    <Transition name="rmap-tip">
      <p v-if="tip" class="rmap__tip">{{ tip }}</p>
    </Transition>

    <p class="rmap__hint">点地面走过去 · 走近才开战</p>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import RealmEnc from './RealmEnc.vue'

const props = defineProps({
  region: { type: String, default: 'forest' },
  encounters: { type: Array, default: () => [] },
  isDone: { type: Function, required: true },
  meetsNeed: { type: Function, required: true }
})
const emit = defineEmits(['engage'])

/* ---------- 投影 ---------- */
const G = 16
const HW = 44
const HH = 22
const OX = 760
const OY = 80
const uid = Math.random().toString(36).slice(2, 7)
const ip = (x, y, z = 0) => [OX + (x - y) * HW, OY + (x + y) * HH - z]
const P = (p) => `${Math.round(p[0] * 10) / 10} ${Math.round(p[1] * 10) / 10}`
const poly = (pts) => 'M' + pts.map(P).join('L') + 'Z'

const svgEl = ref(null)
const wrapEl = ref(null)

/* ---------- 配色 ---------- */
const PALETTES = {
  forest: {
    top: '#e6ebcd', bottom: '#c9dcae', rim: '#a9bd8b', line: '#8fa877',
    path: '#f6e7d6', fog: '#fbe9f1', far: '#e3c9dd', shadow: '#6b4b69',
    cloth: '#f2b6c4', clothDark: '#c98b9b', deco: '#f4b8cc', portal: '#b98aa6'
  },
  lake: {
    top: '#dcebf5', bottom: '#a9c9e4', rim: '#8aa8c8', line: '#7c9dbd',
    path: '#eef3f8', fog: '#e8f1fb', far: '#c2d4e8', shadow: '#4e5f7a',
    cloth: '#f2b6c4', clothDark: '#c98b9b', deco: '#bfe0f0', portal: '#93a9c6'
  },
  roots: {
    top: '#6d5664', bottom: '#4a3745', rim: '#382734', line: '#8f7183',
    path: '#8a7183', fog: '#4a3446', far: '#553d50', shadow: '#1e131f',
    cloth: '#e8a2b4', clothDark: '#b66f83', deco: '#a8c79a', portal: '#7d6472'
  },
  shrine: {
    top: '#f6eefb', bottom: '#e2d0ee', rim: '#c6acd8', line: '#b79ecb',
    path: '#fff8fd', fog: '#f4e8fa', far: '#dcc7e8', shadow: '#5a4568',
    cloth: '#f2b6c4', clothDark: '#c98b9b', deco: '#f9c6d8', portal: '#c2a6d6'
  }
}
const palette = computed(() => PALETTES[props.region] || PALETTES.forest)

/* ---------- 人物与镜头 ---------- */
const START = { x: 7.8, y: 12.4 }
const me = ref({ ...START })
const target = ref(null)
const walking = ref(false)
const bob = ref(0)
const cam = ref({ x: 0, y: 0 })
const tip = ref('')
let tipTimer = null
let raf = null
let lastT = 0

const mePos = computed(() => {
  const [x, y] = ip(me.value.x, me.value.y)
  return { x, y }
})
const meDepth = computed(() => me.value.x + me.value.y)

/** 世界坐标范围：16×16 的菱形在两个方向上的投影 */
const worldBox = (() => {
  const pts = [ip(0, 0), ip(G, 0), ip(G, G), ip(0, G)]
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
})()

const VIEW_W = 960
const VIEW_H = 620

function updateCam () {
  const p = mePos.value
  // 人物固定在画面中间偏下：镜头比他高 90px
  let cx = p.x - VIEW_W / 2
  let cy = p.y - VIEW_H * 0.62
  cx = Math.max(worldBox.x0 - 60, Math.min(worldBox.x1 - VIEW_W + 60, cx))
  cy = Math.max(worldBox.y0 - 40, Math.min(worldBox.y1 - VIEW_H + 40, cy))
  // 差不到半像素就别动：每帧新建对象会让模板白白重绘
  if (Math.abs(cx - cam.value.x) > 0.5 || Math.abs(cy - cam.value.y) > 0.5) {
    cam.value = { x: cx, y: cy }
  }
}

function tick (t) {
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0)
  lastT = t
  const tg = target.value
  if (tg) {
    const dx = tg.x - me.value.x
    const dy = tg.y - me.value.y
    const dist = Math.hypot(dx, dy)
    if (dist < 0.06) {
      me.value = { ...tg }
      target.value = null
      walking.value = false
      bob.value = 0
      onArrive(tg)
    } else {
      const step = Math.min(dist, 4.2 * dt)
      me.value = { x: me.value.x + (dx / dist) * step, y: me.value.y + (dy / dist) * step }
      walking.value = true
      bob.value = Math.abs(Math.sin(t / 130)) * 2.6
    }
  }
  updateCam()
  raf = requestAnimationFrame(tick)
}

/* 樱枝门：地图近端的传送点 */
const portal = { id: 'portal', kind: 'portal', name: '樱枝门', x: 7.6, y: 14.6 }
const portalPos = (() => { const p = ip(portal.x, portal.y); return { x: p[0], y: p[1] } })()

/* ---------- 走动与触发 ---------- */
let pending = null

function walkTo (e) {
  if (props.isDone(e.id)) return
  pending = e
  const dx = e.x - me.value.x
  const dy = e.y - me.value.y
  const d = Math.hypot(dx, dy) || 1
  // 停在遭遇点前面 1.2 格，别踩到人家身上
  const k = Math.max(0, (d - 1.2) / d)
  target.value = { x: me.value.x + dx * k, y: me.value.y + dy * k }
}

function onArrive () {
  if (pending && nearEnough(pending)) {
    const e = pending
    pending = null
    emit('engage', e)
    return
  }
  // 就算只是随便点地面，走进 1.4 格也会撞上
  const hit = props.encounters.find((e) => !props.isDone(e.id) && nearEnough(e))
  if (hit) {
    pending = null
    emit('engage', hit)
  }
}

function nearEnough (e) {
  return Math.hypot(e.x - me.value.x, e.y - me.value.y) <= 1.5
}

function showTip (text) {
  tip.value = text
  clearTimeout(tipTimer)
  tipTimer = setTimeout(() => { tip.value = '' }, 1800)
}

/* ---------- 点击地面 ---------- */
function onGround (ev) {
  const svg = svgEl.value
  if (!svg) return
  const ctm = svg.getScreenCTM()
  if (!ctm) return
  const pt = svg.createSVGPoint()
  pt.x = ev.clientX
  pt.y = ev.clientY
  const p = pt.matrixTransform(ctm.inverse())
  // 屏幕 → 世界 → 格
  const wx = p.x + cam.value.x
  const wy = p.y + cam.value.y
  const gx = ((wx - OX) / HW + (wy - OY) / HH) / 2
  const gy = ((wy - OY) / HH - (wx - OX) / HW) / 2
  const clamp = (v) => Math.max(0.7, Math.min(G - 0.7, v))
  const nx = clamp(gx)
  const ny = clamp(gy)
  // 点到菱形外就忽略，别让人贴着边角走
  if (gx < -0.6 || gy < -0.6 || gx > G + 0.6 || gy > G + 0.6) return
  pending = null
  target.value = { x: nx, y: ny }
}

/* ---------- 地面 ---------- */
const groundD = poly([ip(0, 0), ip(G, 0), ip(G, G), ip(0, G)])
const rimD = (() => {
  const o = 0.55
  return poly([ip(-o, -o), ip(G + o, -o), ip(G + o, G + o), ip(-o, G + o)])
})()

const gridLines = (() => {
  const out = []
  for (let i = 4; i < G; i += 4) {
    out.push(`M${P(ip(i, 0))}L${P(ip(i, G))}`)
    out.push(`M${P(ip(0, i))}L${P(ip(G, i))}`)
  }
  return out
})()

const pathD = (() => {
  // 一条从后角通到前角的小径，微微弯
  const pts = [[7.2, 0.6], [7.0, 4], [7.6, 7.2], [7.2, 10.6], [7.8, 13.6], [7.6, 15.6]]
  return 'M' + pts.map(([x, y]) => P(ip(x, y))).join('L')
})()

/* ---------- 随机（固定种子，切区域不重排） ---------- */
function rng (seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/* ---------- 区域地面装饰 ---------- */
const groundDecals = computed(() => {
  const r = props.region
  if (r === 'lake') {
    return [
      { d: poly([[2.2, 3.2], [9.4, 1.8], [13.6, 5.4], [12.2, 11.4], [5.4, 12.6], [1.6, 8.2]].map(([x, y]) => ip(x, y))), fill: '#b7d2ea', o: 0.95 },
      { d: poly([[3.2, 4.2], [8.8, 3.1], [12.2, 6.0], [11.0, 10.4], [5.6, 11.2], [2.8, 7.8]].map(([x, y]) => ip(x, y))), fill: '#96bbdd', o: 0.55 },
      { d: poly([[5.2, 6.6], [8.2, 5.9], [9.6, 7.4], [8.0, 9.0], [5.8, 8.6]].map(([x, y]) => ip(x, y))), fill: '#e9f3fb', o: 0.45 }
    ]
  }
  if (r === 'roots') {
    return [
      { d: poly([[1.4, 2.2], [14.4, 1.2], [15.0, 12.6], [8.0, 15.2], [1.0, 13.2]].map(([x, y]) => ip(x, y))), fill: '#553f4e', o: 0.75 },
      { d: poly([[4.0, 4.0], [11.6, 3.4], [12.4, 9.4], [7.6, 11.8], [3.4, 9.0]].map(([x, y]) => ip(x, y))), fill: '#3b2a37', o: 0.5 }
    ]
  }
  if (r === 'shrine') {
    const c = ip(8, 8)
    return [
      { cx: c[0], cy: c[1], rx: 240, ry: 118, fill: '#fdf7ff', o: 0.85 },
      { cx: c[0], cy: c[1], rx: 196, ry: 96, fill: '#eadcf5', o: 0.75 },
      { cx: c[0], cy: c[1], rx: 150, ry: 73, fill: '#fdf9ff', o: 0.8 },
      { cx: c[0], cy: c[1], rx: 96, ry: 47, fill: '#e4d0f0', o: 0.7 }
    ]
  }
  // forest：几块深浅不一的草斑
  return [
    { d: poly([[2.0, 3.4], [7.6, 2.0], [9.2, 5.2], [4.6, 7.0]].map(([x, y]) => ip(x, y))), fill: '#d3e3b8', o: 0.7 },
    { d: poly([[10.0, 8.4], [14.4, 7.2], [15.0, 11.6], [11.4, 13.0]].map(([x, y]) => ip(x, y))), fill: '#d9e7bf', o: 0.6 },
    { d: poly([[3.4, 9.6], [7.2, 9.0], [8.0, 12.4], [4.2, 13.4]].map(([x, y]) => ip(x, y))), fill: '#c6daa9', o: 0.55 }
  ]
})

/* ---------- 场景物件 ---------- */
function buildProps (region) {
  const out = []
  const pal = PALETTES[region]
  const add = (kind, x, y, d, fill, o = 1) => out.push({ key: `${kind}-${x}-${y}`, kind, x, y, depth: x + y, d, fill, o })

  if (region === 'forest' || region === 'shrine') {
    // 樱树：树干 + 三团花冠
    const trees = region === 'forest'
      ? [[2.6, 4.2, 1], [12.4, 3.2, .9], [3.0, 11.2, .85], [14.4, 12.4, .95], [9.6, 2.2, .7], [4.6, 14.2, .8]]
      : [[2.4, 5.0, .9], [13.2, 5.4, .85], [2.8, 11.6, .8], [12.8, 11.4, .9]]
    trees.forEach(([x, y, s], i) => {
      const [bx, by] = ip(x, y)
      const h = 62 * s
      // 树干：上窄下宽，再挂两根分枝
      add('tree', x, y,
        `M${P([bx - 5 * s, by])}L${P([bx - 2.6 * s, by - h])}L${P([bx + 2.6 * s, by - h])}L${P([bx + 5 * s, by])}Z`,
        '#8e6f7c')
      add('tree', x, y - 0.01,
        `M${P([bx - 1 * s, by - h * 0.7])}L${P([bx - 13 * s, by - h * 0.92])}M${P([bx + 1 * s, by - h * 0.66])}L${P([bx + 12 * s, by - h * 0.88])}`,
        'none')
      const cy = by - h - 8 * s
      // 花冠：三团叠在一起，才不是一根棒棒糖
      const blobs = [
        [bx - 15 * s, cy + 7 * s, 21 * s],
        [bx + 13 * s, cy + 5 * s, 19 * s],
        [bx - 1 * s, cy - 7 * s, 23 * s]
      ]
      blobs.forEach(([cx2, cy2, r], k) => {
        add('tree', x, y + 0.02 * k,
          `M${P([cx2 - r, cy2])}a${r} ${r * 0.78} 0 1 0 ${r * 2} 0a${r} ${r * 0.78} 0 1 0 ${-r * 2} 0Z`,
          i % 2 ? '#f7c8d8' : '#fbd6e2')
      })
      // 亮部
      add('tree', x, y + 0.05,
        `M${P([bx - 8 * s, cy - 6 * s])}a${14 * s} ${11 * s} 0 1 0 ${28 * s} 0a${14 * s} ${11 * s} 0 1 0 ${-28 * s} 0Z`,
        '#fff0f5', 0.9)
    })

    // 石头
    ;[[4.6, 6.6], [10.8, 9.8], [6.2, 2.8], [12.0, 13.0]].forEach(([x, y], i) => {
      const [bx, by] = ip(x, y)
      add('rock', x, y,
        `M${P([bx - 16, by])}L${P([bx - 9, by - 12])}L${P([bx + 6, by - 13])}L${P([bx + 15, by - 3])}L${P([bx + 8, by + 4])}Z`,
        i % 2 ? '#cbbec6' : '#bdaeb8')
    })
  }

  if (region === 'lake') {
    // 浮岛：水面上的小平台
    ;[[4.4, 4.6, 1], [10.6, 8.2, 1.1], [12.6, 4.2, .8]].forEach(([x, y, s]) => {
      const [bx, by] = ip(x, y)
      add('isle', x, y, `M${P([bx - 40 * s, by])}a${40 * s} ${20 * s} 0 1 0 ${80 * s} 0a${40 * s} ${20 * s} 0 1 0 ${-80 * s} 0Z`, '#dfe9f2')
      add('isle', x - 0.02, y - 0.02, `M${P([bx - 40 * s, by - 6])}a${40 * s} ${20 * s} 0 1 0 ${80 * s} 0a${40 * s} ${20 * s} 0 1 0 ${-80 * s} 0Z`, '#f3f8fc', 0.9)
      add('isle', x, y + 0.01, `M${P([bx - 6, by - 26])}L${P([bx + 6, by - 26])}L${P([bx + 4, by - 6])}L${P([bx - 4, by - 6])}Z`, '#a8c79a', 0.9)
    })
    // 石带
    ;[[3.2, 7.4], [9.2, 11.4], [13.2, 7.0], [6.4, 3.0]].forEach(([x, y], i) => {
      const [bx, by] = ip(x, y)
      add('rock', x, y, `M${P([bx - 14, by])}L${P([bx - 8, by - 10])}L${P([bx + 7, by - 9])}L${P([bx + 13, by - 2])}Z`, i % 2 ? '#b9c6d2' : '#a9b8c6')
    })
  }

  if (region === 'roots') {
    // 横跨地图的粗根
    const roots = [
      [[0.8, 4.4], [4.6, 5.2], [9.4, 4.4], [15.2, 5.4]],
      [[1.2, 9.6], [5.4, 8.8], [10.4, 9.8], [15.0, 9.0]],
      [[1.0, 13.6], [6.0, 12.8], [11.0, 13.8], [15.2, 13.0]]
    ]
    roots.forEach((pts, i) => {
      const d = 'M' + pts.map(([x, y], j) => P(ip(x, y + (j % 2 ? 0.18 : -0.12)))).join('L')
      add('root', pts[0][0], pts[0][1], d, i % 2 ? '#3b2a37' : '#4a3543')
      add('root', pts[0][0], pts[0][1] + 0.01, d, '#5b4353', 0.5)
    })
    // 亮苔
    ;[[3.4, 6.4], [7.6, 5.6], [12.0, 7.6], [5.2, 11.6], [10.8, 12.4], [13.6, 3.4]].forEach(([x, y]) => {
      const [bx, by] = ip(x, y)
      add('moss', x, y, `M${P([bx - 10, by])}a10 5 0 1 0 20 0a10 5 0 1 0 -20 0Z`, '#a8c79a', 0.85)
    })
  }

  if (region === 'shrine') {
    // 四根柱子
    ;[[5.2, 5.2], [10.8, 5.2], [5.2, 10.8], [10.8, 10.8]].forEach(([x, y]) => {
      const [bx, by] = ip(x, y)
      add('pillar', x, y, `M${P([bx - 6, by])}L${P([bx - 6, by - 78])}L${P([bx + 6, by - 78])}L${P([bx + 6, by])}Z`, '#efe0f4')
      add('pillar', x, y + 0.02, `M${P([bx - 10, by - 78])}L${P([bx + 10, by - 78])}L${P([bx + 10, by - 84])}L${P([bx - 10, by - 84])}Z`, '#d9c3e6')
    })
    // 中央祭坛
    const [ax, ay] = ip(8, 8)
    add('altar', 8, 8, `M${P([ax - 86, ay])}a86 43 0 1 0 172 0a86 43 0 1 0 -172 0Z`, '#f8f0fc')
    add('altar', 8, 8.02, `M${P([ax - 62, ay - 6])}a62 31 0 1 0 124 0a62 31 0 1 0 -124 0Z`, '#e6d3f2')
    add('altar', 8, 8.03, `M${P([ax - 30, ay - 12])}a30 15 0 1 0 60 0a30 15 0 1 0 -60 0Z`, '#fdf7ff')
  }

  return out
}

const props_ = computed(() => buildProps(props.region))

/* 人物前后分层：跨过某个物件的 depth 时它就会换层 */
const behind = computed(() => props_.value.filter((p) => p.depth <= meDepth.value))
const front = computed(() => props_.value.filter((p) => p.depth > meDepth.value))

/* ---------- 遭遇点 ---------- */
const sx = (e) => ip(e.x, e.y)[0]
const sy = (e) => ip(e.x, e.y)[1]
const doneOf = (e) => props.isDone(e.id)
const meets = (e) => props.meetsNeed(e)
const encScale = (e) => (e.kind === 'boss' ? 1 : 0.62)

const sortedEncs = computed(() => [...props.encounters].sort((a, b) => (a.x + a.y) - (b.x + b.y)))
const behindEncs = computed(() => sortedEncs.value.filter((e) => e.x + e.y <= meDepth.value))
const frontEncs = computed(() => sortedEncs.value.filter((e) => e.x + e.y > meDepth.value))

/* ---------- 前景遮挡（屏幕坐标，不随镜头） ---------- */
const foreground = (() => {
  const grass = (x, y, s, f) => [
    `M${x} ${y}q${-6 * s} ${-26 * s} ${-14 * s} ${-40 * s}q${10 * s} ${14 * s} ${14 * s} ${40 * s}Z`,
    `M${x + 6 * s} ${y}q${2 * s} ${-30 * s} ${-2 * s} ${-52 * s}q${10 * s} ${22 * s} ${8 * s} ${52 * s}Z`,
    `M${x + 12 * s} ${y}q${10 * s} ${-22 * s} ${6 * s} ${-38 * s}q${2 * s} ${20 * s} ${-8 * s} ${38 * s}Z`
  ].map((d) => ({ d, fill: f }))
  return [
    ...grass(60, 610, 1.5, '#8fa877'),
    ...grass(168, 618, 1.1, '#a3b98a'),
    ...grass(852, 614, 1.4, '#8fa877'),
    ...grass(930, 606, 1.0, '#9db387'),
    // 左上角探出来的一截樱枝
    { d: 'M-10 30q90 6 150 48q-70 -20 -140 -24Z', fill: '#c98ba8' }
  ]
})()

const farShapes = [
  { x: 130, y: 96, rx: 150, ry: 54 },
  { x: 430, y: 72, rx: 190, ry: 62 },
  { x: 760, y: 100, rx: 170, ry: 58 }
]

/* ---------- 生命周期 ---------- */
onMounted(() => {
  updateCam()
  raf = requestAnimationFrame(tick)
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  clearTimeout(tipTimer)
})
watch(() => props.region, () => {
  // 换区域：人回到入口，镜头重置
  me.value = { ...START }
  target.value = null
  pending = null
  walking.value = false
  updateCam()
})

defineExpose({ showTip, me })
</script>

<style scoped>
.rmap {
  position: relative;
  height: 100%;
  min-height: 420px;
  border-radius: 20px;
  overflow: hidden;
  background: radial-gradient(120% 90% at 50% 12%, #fdf6fb 0%, #efdcec 55%, #ddcae4 100%);
}
.is-lake { background: radial-gradient(120% 90% at 50% 12%, #f4f9fd 0%, #dbe8f5 55%, #c5d8ec 100%); }
.is-roots { background: radial-gradient(120% 90% at 50% 12%, #6d5462 0%, #4b3745 60%, #2c1f2c 100%); }
.is-shrine { background: radial-gradient(120% 90% at 50% 10%, #fdf8ff 0%, #efe1f7 55%, #d6c2e6 100%); }

.rmap__svg {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: manipulation;
}
.rmap__me { transition: none; }
.rmap__me .is-walking { animation: me-step .38s ease-in-out infinite; transform-origin: center bottom; }
@keyframes me-step {
  0%, 100% { rotate: -3deg; }
  50% { rotate: 3deg; }
}

.rmap__tip {
  position: absolute;
  left: 50%;
  bottom: 42px;
  transform: translateX(-50%);
  margin: 0;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: .06em;
  color: #fff;
  background: rgba(96, 56, 88, .72);
  backdrop-filter: blur(6px);
  pointer-events: none;
}
.rmap-tip-enter-active, .rmap-tip-leave-active { transition: opacity .25s, transform .25s; }
.rmap-tip-enter-from, .rmap-tip-leave-to { opacity: 0; transform: translate(-50%, 6px); }

.rmap__hint {
  position: absolute;
  right: 14px;
  bottom: 10px;
  margin: 0;
  font-size: 9.5px;
  letter-spacing: .12em;
  color: rgba(110, 76, 104, .5);
  pointer-events: none;
}
.rmap__portal { cursor: pointer; }
.rmap__portal-label {
  font-family: var(--font-serif);
  font-size: 9.5px;
  letter-spacing: .08em;
  fill: rgba(110, 76, 104, .6);
}
.is-roots .rmap__portal-label { fill: rgba(255, 240, 250, .55); }
.is-roots .rmap__hint { color: rgba(255, 240, 250, .55); }
</style>
