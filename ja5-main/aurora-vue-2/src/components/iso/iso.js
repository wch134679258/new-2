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

/** 房间外壳：地板 + 两面后墙 + 踢脚线 + 一点墙面分格 */
export function roomShell (r) {
  const { w, d, h } = r
  const wallL = r.wallL || '#f3e2e8'
  const wallR = r.wallR || '#fdf0ea'
  const floor = r.floor || '#f0dccb'
  const parts = []

  // 地板
  parts.push({ d: poly([ip(0, 0), ip(w, 0), ip(w, d), ip(0, d)]), fill: floor })
  // 地板木纹：顺着 x 方向的缝
  for (let i = 1; i < Math.round(d); i++) {
    parts.push({
      d: `M${P(ip(0, i))}L${P(ip(w, i))}`,
      fill: 'none',
      stroke: 'rgba(150, 110, 90, .16)',
      sw: 1
    })
  }
  // 左后墙（x = 0）
  parts.push({ d: poly([ip(0, 0, 0), ip(0, d, 0), ip(0, d, h), ip(0, 0, h)]), fill: wallL })
  // 右后墙（y = 0）
  parts.push({ d: poly([ip(0, 0, 0), ip(w, 0, 0), ip(w, 0, h), ip(0, 0, h)]), fill: wallR })
  // 墙脚
  parts.push({ d: poly([ip(0, 0, 0), ip(0, d, 0), ip(0, d, 5), ip(0, 0, 5)]), fill: 'rgba(160, 120, 110, .28)' })
  parts.push({ d: poly([ip(0, 0, 0), ip(w, 0, 0), ip(w, 0, 5), ip(0, 0, 5)]), fill: 'rgba(160, 120, 110, .2)' })
  // 两块墙的交界线
  parts.push({ d: `M${P(ip(0, 0, 0))}L${P(ip(0, 0, h))}`, fill: 'none', stroke: 'rgba(150, 110, 120, .3)', sw: 1.4 })
  // 楼板厚度（剖切面）
  parts.push({ d: poly([ip(0, d, 0), ip(w, d, 0), ip(w, d, -7), ip(0, d, -7)]), fill: '#d9c3ad' })
  parts.push({ d: poly([ip(w, 0, 0), ip(w, d, 0), ip(w, d, -7), ip(w, 0, -7)]), fill: '#c9b19b' })
  return parts
}

/** 房间外的露台 / 院子：只有一块地，没有墙 */
export function ground (x0, y0, w, d, fill, z = 0) {
  return [
    { d: poly([ip(x0, y0, z), ip(x0 + w, y0, z), ip(x0 + w, y0 + d, z), ip(x0, y0 + d, z)]), fill }
  ]
}
