// ============================================================
//  2.5D 室内引擎（等距剖视）
// ------------------------------------------------------------
//  和小镇地图同一套 2:1 斜轴投影，但这里是「剖开的房间」：
//  只保留后方的两面墙（x = x0 与 y = y0），朝向镜头的两面拆掉，
//  于是能看见地板、家具和墙上的东西。
//
//  坐标：x 往右下、y 往左下、z 往上；depth = x + y 越大越靠前。
// ============================================================

export const HW = 24
export const HH = 12
export const OX = 320
export const OY = 130

export const r1 = (n) => Math.round(n * 10) / 10
export const P = (p) => `${r1(p[0])} ${r1(p[1])}`

/** 格坐标 + 高度 → 屏幕坐标 */
export function ip (x, y, z = 0) {
  return [OX + (x - y) * HW, OY + (x + y) * HH - z]
}

export const poly = (pts) => 'M' + pts.map(P).join('L') + 'Z'

/** 屏幕坐标系里的椭圆（轮胎、桌面、灯罩都用它） */
export function ep (cx, cy, rx, ry) {
  return `M${r1(cx - rx)} ${r1(cy)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(rx * 2)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-rx * 2)} 0Z`
}

/** 长方形盒子：只出朝向镜头的两个立面 + 顶面 */
export function box (x0, y0, w, d, z0, z1, c) {
  const x1 = x0 + w
  const y1 = y0 + d
  return [
    { d: poly([ip(x0, y1, z0), ip(x1, y1, z0), ip(x1, y1, z1), ip(x0, y1, z1)]), fill: c.l },
    { d: poly([ip(x1, y0, z0), ip(x1, y1, z0), ip(x1, y1, z1), ip(x1, y0, z1)]), fill: c.r },
    { d: poly([ip(x0, y0, z1), ip(x1, y0, z1), ip(x1, y1, z1), ip(x0, y1, z1)]), fill: c.t }
  ]
}

/** 贴在地板上的一块板（地毯、花坛、软垫） */
export function slab (x0, y0, w, d, z, fill, opacity = 1) {
  return { d: poly([ip(x0, y0, z), ip(x0 + w, y0, z), ip(x0 + w, y0 + d, z), ip(x0, y0 + d, z)]), fill, opacity }
}

/** 挂在墙上的矩形：face = 'left'（x=x0 墙）| 'right'（y=y0 墙） */
export function onWall (face, x0, y0, u0, u1, z0, z1, fill, extra = {}) {
  if (face === 'left') {
    // 左后墙：x 固定，u 沿 y 方向走
    return {
      d: poly([ip(x0, y0 + u0, z0), ip(x0, y0 + u1, z0), ip(x0, y0 + u1, z1), ip(x0, y0 + u0, z1)]),
      fill,
      ...extra
    }
  }
  // 右后墙：y 固定，u 沿 x 方向走
  return {
    d: poly([ip(x0 + u0, y0, z0), ip(x0 + u1, y0, z0), ip(x0 + u1, y0, z1), ip(x0 + u0, y0, z1)]),
    fill,
    ...extra
  }
}

/** 房间外壳：地板 + 两面后墙 + 踢脚线 + 剖切断面 */
export function roomShell (r) {
  const { w, d, h } = r
  const wallL = r.wallL || '#f3e2e8'
  const wallR = r.wallR || '#fdf0ea'
  const floor = r.floor || '#f0dccb'
  const cut = r.cut || '#cdb0bd'      // 剖切断面（墙芯）
  const cutDark = r.cutDark || '#b894a4'
  const parts = []
  const T = 0.16                        // 墙厚（格）

  // 地板
  parts.push({ d: poly([ip(0, 0), ip(w, 0), ip(w, d), ip(0, d)]), fill: floor })
  // 地板木纹：顺着 x 的缝 + 顺着 y 的缝，铺成一条一条
  for (let i = 1; i < Math.round(d); i++) {
    parts.push({ d: `M${P(ip(0, i))}L${P(ip(w, i))}`, fill: 'none', stroke: 'rgba(150, 110, 90, .13)', sw: 1 })
  }
  for (let i = 1; i < Math.round(w); i++) {
    parts.push({ d: `M${P(ip(i, 0))}L${P(ip(i, d))}`, fill: 'none', stroke: 'rgba(150, 110, 90, .07)', sw: 0.8 })
  }

  // 户外空间（公园亭）没有墙：只留台基和剖切边
  const bare = r.bare === true
  if (!bare) {
    // 左后墙（x = 0）
    parts.push({ d: poly([ip(0, 0, 0), ip(0, d, 0), ip(0, d, h), ip(0, 0, h)]), fill: wallL })
    // 右后墙（y = 0）
    parts.push({ d: poly([ip(0, 0, 0), ip(w, 0, 0), ip(w, 0, h), ip(0, 0, h)]), fill: wallR })

    // 墙面光影：上暗下亮，室内才不像一张纸
    parts.push({ d: poly([ip(0, 0, h * 0.6), ip(0, d, h * 0.6), ip(0, d, h), ip(0, 0, h)]), fill: 'rgba(112, 82, 104, .07)' })
    parts.push({ d: poly([ip(0, 0, h * 0.6), ip(w, 0, h * 0.6), ip(w, 0, h), ip(0, 0, h)]), fill: 'rgba(112, 82, 104, .05)' })
    parts.push({ d: poly([ip(0, 0, 0), ip(0, d, 0), ip(0, d, h * 0.16), ip(0, 0, h * 0.16)]), fill: 'rgba(255, 255, 255, .16)' })

    // 墙脚
    parts.push({ d: poly([ip(0, 0, 0), ip(0, d, 0), ip(0, d, 5), ip(0, 0, 5)]), fill: 'rgba(160, 120, 110, .26)' })
    parts.push({ d: poly([ip(0, 0, 0), ip(w, 0, 0), ip(w, 0, 5), ip(0, 0, 5)]), fill: 'rgba(160, 120, 110, .18)' })
    // 两块墙的交界线
    parts.push({ d: `M${P(ip(0, 0, 0))}L${P(ip(0, 0, h))}`, fill: 'none', stroke: 'rgba(150, 110, 120, .3)', sw: 1.4 })
  }

  // ---- 剖切断面：只在前沿留一条墙芯线，不画整面（整面会把室内挡死）----
  parts.push({
    d: poly([ip(0, d, 0), ip(w, d, 0), ip(w, d, 0.22), ip(0, d, 0.22)]),
    fill: cutDark
  })

  // 楼板厚度（往下的一段，像蛋糕切口）
  parts.push({ d: poly([ip(0, d, 0), ip(w, d, 0), ip(w, d, -8), ip(0, d, -8)]), fill: '#cbb39c' })
  parts.push({ d: poly([ip(w, 0, 0), ip(w, d, 0), ip(w, d, -8), ip(w, 0, -8)]), fill: '#bda68f' })
  // 楼板与墙芯之间的分界线
  parts.push({ d: `M${P(ip(0, d, 0))}L${P(ip(w, d, 0))}`, fill: 'none', stroke: 'rgba(120, 90, 100, .22)', sw: 1 })

  return parts
}

/** 前沿保留的两小段墙垛：给「剖开的房间」一点建筑包裹感，又不挡住室内 */
export function frontPiers (r, side = 'both') {
  if (r.bare === true) return []
  const { w, d, h } = r
  const cut = r.cut || '#cdb0bd'
  const cutDark = r.cutDark || '#b894a4'
  const wall = r.wallFront || r.wallL || '#f3e2e8'
  const pw = r.pierW || 0.34
  const ph = (r.pierH || 0.66) * h
  const T = 0.16
  const parts = []

  const pier = (x0, x1, tone) => {
    // 内侧墙面（朝里）
    parts.push({ d: poly([ip(x0, d - T, 0), ip(x1, d - T, 0), ip(x1, d - T, ph), ip(x0, d - T, ph)]), fill: wall })
    // 断面（朝镜头）
    parts.push({ d: poly([ip(x0, d, 0), ip(x1, d, 0), ip(x1, d, ph), ip(x0, d, ph)]), fill: tone })
    // 顶面
    parts.push({ d: poly([ip(x0, d - T, ph), ip(x1, d - T, ph), ip(x1, d, ph), ip(x0, d, ph)]), fill: cutDark })
    // 竖直边
    parts.push({ d: `M${P(ip(x1, d, 0))}L${P(ip(x1, d, ph))}`, fill: 'none', stroke: 'rgba(120, 88, 100, .26)', sw: 1 })
  }

  if (side !== 'right') pier(0, pw, cut)
  if (side !== 'left') pier(w - pw, w, cutDark)
  return parts
}

/** 房间外的露台 / 院子：只有一块地，没有墙 */
export function ground (x0, y0, w, d, fill, z = 0) {
  return [
    { d: poly([ip(x0, y0, z), ip(x0 + w, y0, z), ip(x0 + w, y0 + d, z), ip(x0, y0 + d, z)]), fill }
  ]
}

/* ============================================================
   隔墙：把一个大房间切成几个能互相看见的小空间
   ------------------------------------------------------------
   axis = 'y'：墙横在 y = at，沿 x 从 from 走到 to（画面上「左右横着」）
   axis = 'x'：墙横在 x = at，沿 y 从 from 走到 to（画面上「斜着往后」）

   切成小段返回，每段自带 depth，交给渲染器跟家具一起排序 ——
   整面墙用一个 depth 的话，家具会整片压在墙前面或者后面，穿帮。
   ============================================================ */
export function divider (d) {
  const {
    axis = 'y',
    at,
    from,
    to,
    h = 46,
    thick = 0.16,
    t = 2.6,
    face = '#f6e8ee',
    cap = '#e3cdd8',
    edge = 'rgba(150, 110, 130, .26)',
    door = null
  } = d

  const inDoor = (u) => door && u > door.at - door.w / 2 && u < door.at + door.w / 2
  const step = 0.4
  const segs = []

  for (let u = from; u < to - 1e-6; u += step) {
    const u1 = Math.min(u + step, to)
    const mid = (u + u1) / 2

    if (inDoor(mid)) {
      // 门洞上方保留过梁
      if (door.z != null) {
        segs.push({ show: 'lintel', u0: u, u1, doorZ: door.z })
      }
      continue
    }
    segs.push({ show: 'wall', u0: u, u1 })
  }

  return segs.map((s) => {
    const { u0, u1, show } = s
    const parts = []
    let depth

    if (axis === 'y') {
      depth = at + (u0 + u1) / 2
      if (show === 'wall') {
        parts.push({ d: poly([ip(u0, at, 0), ip(u1, at, 0), ip(u1, at, h), ip(u0, at, h)]), fill: face })
        // 顶面（剖切）：一条薄边，墙才有厚度
        parts.push({ d: poly([ip(u0, at, h), ip(u1, at, h), ip(u1, at + thick, h), ip(u0, at + thick, h)]), fill: cap })
        // 墙脚
        parts.push({ d: poly([ip(u0, at, 0), ip(u1, at, 0), ip(u1, at, 4.4), ip(u0, at, 4.4)]), fill: 'rgba(160, 120, 110, .2)' })
        // 两端竖缝
        parts.push({ d: `M${P(ip(u1, at, 0))}L${P(ip(u1, at, h))}`, fill: 'none', stroke: edge, sw: 1 })
      } else {
        // 过梁：门洞上方那一截
        parts.push({ d: poly([ip(u0, at, s.doorZ), ip(u1, at, s.doorZ), ip(u1, at, h), ip(u0, at, h)]), fill: face })
        parts.push({ d: poly([ip(u0, at, h), ip(u1, at, h), ip(u1, at + thick, h), ip(u0, at + thick, h)]), fill: cap })
      }
    } else {
      depth = (u0 + u1) / 2 + at
      if (show === 'wall') {
        parts.push({ d: poly([ip(at, u0, 0), ip(at, u1, 0), ip(at, u1, h), ip(at, u0, h)]), fill: face })
        parts.push({ d: poly([ip(at, u0, h), ip(at + thick, u0, h), ip(at + thick, u1, h), ip(at, u1, h)]), fill: cap })
        parts.push({ d: poly([ip(at, u0, 0), ip(at, u1, 0), ip(at, u1, 4.4), ip(at, u0, 4.4)]), fill: 'rgba(160, 120, 110, .2)' })
        parts.push({ d: `M${P(ip(at, u1, 0))}L${P(ip(at, u1, h))}`, fill: 'none', stroke: edge, sw: 1 })
      } else {
        parts.push({ d: poly([ip(at, u0, s.doorZ), ip(at, u1, s.doorZ), ip(at, u1, h), ip(at, u0, h)]), fill: face })
        parts.push({ d: poly([ip(at, u0, h), ip(at + thick, u0, h), ip(at + thick, u1, h), ip(at, u1, h)]), fill: cap })
      }
    }

    return { depth, parts }
  })
}

/** 门框：门洞两侧各一根立框 + 一道门槛，门洞才不是「一堵墙缺了一块」 */
export function doorFrame (axis, at, doorAt, w, hDoor, color = '#c9a183') {
  const u0 = doorAt - w / 2
  const u1 = doorAt + w / 2
  const parts = []
  if (axis === 'y') {
    parts.push({ d: poly([ip(u0, at, 0), ip(u0 + 0.06, at, 0), ip(u0 + 0.06, at, hDoor), ip(u0, at, hDoor)]), fill: color })
    parts.push({ d: poly([ip(u1 - 0.06, at, 0), ip(u1, at, 0), ip(u1, at, hDoor), ip(u1 - 0.06, at, hDoor)]), fill: color })
    parts.push({ d: poly([ip(u0, at, hDoor - 1.6), ip(u1, at, hDoor - 1.6), ip(u1, at, hDoor), ip(u0, at, hDoor)]), fill: color })
    parts.push({ d: poly([ip(u0, at, 0), ip(u1, at, 0), ip(u1, at, 1.2), ip(u0, at, 1.2)]), fill: 'rgba(150, 110, 120, .3)' })
  } else {
    parts.push({ d: poly([ip(at, u0, 0), ip(at, u0 + 0.06, 0), ip(at, u0 + 0.06, hDoor), ip(at, u0, hDoor)]), fill: color })
    parts.push({ d: poly([ip(at, u1 - 0.06, 0), ip(at, u1, 0), ip(at, u1, hDoor), ip(at, u1 - 0.06, hDoor)]), fill: color })
    parts.push({ d: poly([ip(at, u0, hDoor - 1.6), ip(at, u1, hDoor - 1.6), ip(at, u1, hDoor), ip(at, u0, hDoor)]), fill: color })
    parts.push({ d: poly([ip(at, u0, 0), ip(at, u1, 0), ip(at, u1, 1.2), ip(at, u0, 1.2)]), fill: 'rgba(150, 110, 120, .3)' })
  }
  return parts
}

/** 门口的外部轮廓：剖切面外侧露出一点外墙和屋檐，让人知道「这是从外面看进来」 */
export function outlineLedge (r, side = 'front') {
  const { w, d, h } = r
  const parts = []
  const wall = r.wallOut || '#e6cfd8'
  const roof = r.roofOut || '#8272a6'

  if (side === 'front') {
    // 前方剖切面：只补一段挑出来的檐口（楼板断面由 roomShell 画），
    // 有这一圈边，才像「从外面剖开看进去」而不是一张平面图
    parts.push({ d: poly([ip(-0.1, d + 0.16, h - 3), ip(w + 0.1, d + 0.16, h - 3), ip(w + 0.1, d + 0.16, h + 3), ip(-0.1, d + 0.16, h + 3)]), fill: roof })
    parts.push({ d: poly([ip(w + 0.16, -0.1, h - 3), ip(w + 0.16, d + 0.16, h - 3), ip(w + 0.16, d + 0.16, h + 3), ip(w + 0.16, -0.1, h + 3)]), fill: roof })
    // 檐下阴影
    parts.push({ d: poly([ip(0, d + 0.04, h - 3), ip(w, d + 0.04, h - 3), ip(w, d + 0.04, 0), ip(0, d + 0.04, 0)]), fill: 'rgba(120, 84, 106, .06)' })
    parts.push({ d: poly([ip(w + 0.04, 0, h - 3), ip(w + 0.04, d, h - 3), ip(w + 0.04, d, 0), ip(w + 0.04, 0, 0)]), fill: 'rgba(120, 84, 106, .04)' })
  }

  return parts
}

/** 落地投影：家具底下压一层，东西才「站」在地上 */
export function shadow (x, y, w, d, op = 0.13) {
  return {
    d: poly([ip(x, y, 0.4), ip(x + w, y, 0.4), ip(x + w, y + d, 0.4), ip(x, y + d, 0.4)]),
    fill: `rgba(96, 74, 92, ${op})`
  }
}
