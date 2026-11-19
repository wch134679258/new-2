// ============================================================
//  室内家具件库
// ------------------------------------------------------------
//  每个件都是一个函数：(spec) => parts[]
//  spec 里的 x / y 是它在房间里的「后角」，其余参数按件自取。
//  parts 的每项：{ d, fill, stroke?, sw?, opacity? } —— 直接喂给 <path>
// ============================================================

import { ip, P, poly, ep, box, slab, onWall } from './iso'

const soft = (fill, stroke = 'rgba(120, 86, 106, .18)', sw = 1) => ({ stroke, sw })

/* ---------------- 软装 ---------------- */
function sofa (s) {
  const { x, y, w = 2, d = 0.9 } = s
  const c = s.c || '#e6a9bc'
  const c2 = s.c2 || '#f4c6d3'
  return [
    ...box(x, y, w, d, 0, 7, { l: '#c98fa4', r: '#b77e92', t: '#d9a2b4' }),
    ...box(x, y, w, d * 0.62, 7, 16, { l: c, r: '#d79aad', t: c2 }),
    // 靠背
    ...box(x, y, w, 0.22, 16, 30, { l: c2, r: c, t: '#fbdfe6' }),
    // 两个坐垫的分缝
    { d: `M${P(ip(x + w / 2, y + 0.1, 17))}L${P(ip(x + w / 2, y + d, 17))}`, fill: 'none', stroke: 'rgba(150, 96, 116, .28)', sw: 1.2 },
    // 抱枕
    ...box(x + 0.14, y + 0.28, 0.42, 0.3, 17, 25, { l: '#fff2f5', r: '#ffe6ec', t: '#fffafb' }),
    ...box(x + w - 0.6, y + 0.28, 0.42, 0.3, 17, 25, { l: '#ffe1e8', r: '#fbd0da', t: '#fff3f6' })
  ]
}

function table (s) {
  const { x, y, w = 1.2, d = 0.7, h = 13 } = s
  const top = s.top || '#d9b18e'
  const leg = s.leg || '#a98166'
  const parts = []
  // 四条腿
  const lx = [[0.08, 0.08], [w - 0.16, 0.08], [0.08, d - 0.16], [w - 0.16, d - 0.16]]
  lx.forEach(([dx, dy]) => {
    parts.push(...box(x + dx, y + dy, 0.1, 0.1, 0, h - 2, { l: leg, r: leg, t: leg }))
  })
  parts.push({ d: poly([ip(x, y, h), ip(x + w, y, h), ip(x + w, y + d, h), ip(x, y + d, h)]), fill: top })
  parts.push({ d: poly([ip(x, y + d, h), ip(x + w, y + d, h), ip(x + w, y + d, h - 2), ip(x, y + d, h - 2)]), fill: 'rgba(150, 110, 90, .35)' })
  return parts
}

function rug (s) {
  const { x, y, w = 2.4, d = 1.8 } = s
  const c = s.c || '#f7dfe6'
  return [
    slab(x, y, w, d, 1, c),
    slab(x + 0.16, y + 0.14, w - 0.32, d - 0.28, 1.2, s.c2 || '#fdedf1')
  ]
}

function chair (s) {
  const { x, y, d = 0.5 } = s
  const c = s.c || '#d8b48f'
  return [
    ...box(x, y, 0.5, d, 0, 11, { l: c, r: '#c39d78', t: '#e5c4a2' }),
    ...box(x, y, 0.5, 0.14, 11, 24, { l: '#c39d78', r: '#b08b6a', t: '#dcb997' })
  ]
}

function plant (s) {
  const { x, y } = s
  const s2 = s.size || 1
  const [bx, by] = ip(x, y)
  const parts = [
    // 花盆
    { d: poly([[bx - 8 * s2, by], [bx + 8 * s2, by], [bx + 6 * s2, by - 13 * s2], [bx - 6 * s2, by - 13 * s2]]), fill: s.pot || '#d9a487' },
    { d: poly([[bx - 6 * s2, by - 13 * s2], [bx + 6 * s2, by - 13 * s2], [bx + 6 * s2, by - 15 * s2], [bx - 6 * s2, by - 15 * s2]]), fill: 'rgba(120, 90, 70, .3)' }
  ]
  // 叶子
  const leaves = [[0, -30, 13, 11], [-10, -24, 10, 9], [10, -25, 10, 9], [-4, -38, 9, 8], [7, -37, 8, 7]]
  leaves.forEach(([dx, dy, rx, ry], i) => {
    parts.push({
      d: ep(bx + dx * s2, by + dy * s2, rx * s2, ry * s2),
      fill: i % 2 ? '#a8c99a' : '#8fb884'
    })
  })
  return parts
}

function cushion (s) {
  const { x, y } = s
  const [bx, by] = ip(x, y)
  return [
    { d: ep(bx, by - 2, 13, 7), fill: s.c || '#f2b6c6' },
    { d: ep(bx, by - 4, 13, 7), fill: s.c2 || '#fbcdd8' }
  ]
}

/* ---------------- 卧室 ---------------- */
function bed (s) {
  const { x, y, w = 2.2, d = 3 } = s
  const parts = [
    ...box(x, y, w, d, 0, 6, { l: '#c9a68c', r: '#b8907a', t: '#dbb99e' }),
    // 床垫
    ...box(x + 0.06, y + 0.06, w - 0.12, d - 0.12, 6, 14, { l: '#fffdfb', r: '#fdf4f2', t: '#ffffff' }),
    // 被子（盖住前 2/3）
    ...box(x + 0.04, y + d * 0.34, w - 0.08, d * 0.62, 14, 17, { l: '#f3c3d0', r: '#e9b2c1', t: '#fbdfe6' }),
    { d: poly([ip(x + 0.04, y + d * 0.34, 17), ip(x + w - 0.04, y + d * 0.34, 17), ip(x + w - 0.04, y + d * 0.34, 14), ip(x + 0.04, y + d * 0.34, 14)]), fill: '#f9d3dd' },
    { d: poly([ip(x + 0.04, y + d * 0.34, 17.6), ip(x + w - 0.04, y + d * 0.34, 17.6), ip(x + w - 0.04, y + d * 0.34, 16.4), ip(x + 0.04, y + d * 0.34, 16.4)]), fill: '#fff2f6' },
    // 枕头
    ...box(x + 0.2, y + 0.16, w - 0.4, 0.5, 14, 19, { l: '#fffaf8', r: '#fff2ef', t: '#ffffff' }),
    // 床头板（贴着后沿，够高才像床）
    ...box(x, y, w, 0.16, 0, 30, { l: '#d9b18e', r: '#c39a76', t: '#eccfae' })
  ]
  return parts
}

function desk (s) {
  const { x, y, w = 1.8, d = 0.8 } = s
  return [
    ...table({ x, y, w, d, h: 15, top: s.top || '#e0c1a0', leg: '#b08a6a' }),
    // 桌上一盏小灯
    ...[0, 1].map((i) => box(x + w - 0.42, y + 0.16 + i * 0.02, 0.2, 0.2, 15, 15 + 11, { l: '#e8938f', r: '#d47e7c', t: '#f6b3ad' })[i]),
    { d: poly([ip(x + w - 0.48, y + 0.12, 26), ip(x + w - 0.08, y + 0.12, 26), ip(x + w - 0.08, y + 0.44, 26), ip(x + w - 0.48, y + 0.44, 26)]), fill: '#f6c2b8' },
    // 摊开的书 / 纸
    { d: poly([ip(x + 0.24, y + 0.22, 15.4), ip(x + 0.86, y + 0.22, 15.4), ip(x + 0.86, y + 0.54, 15.4), ip(x + 0.24, y + 0.54, 15.4)]), fill: '#fffdf8' },
    { d: `M${P(ip(x + 0.55, y + 0.22, 15.5))}L${P(ip(x + 0.55, y + 0.54, 15.5))}`, fill: 'none', stroke: 'rgba(150, 120, 110, .35)', sw: 1 }
  ]
}

function lamp (s) {
  const { x, y } = s
  const [bx, by] = ip(x, y)
  return [
    { d: ep(bx, by, 9, 4.5), fill: '#c9ac93' },
    { d: `M${P([bx, by])}V${Math.round(by - 40)}`, fill: 'none', stroke: '#a98d78', sw: 2.6 },
    { d: poly([[bx - 12, by - 40], [bx + 12, by - 40], [bx + 8, by - 56], [bx - 8, by - 56]]), fill: '#ffe6b8' },
    { d: poly([[bx - 8, by - 56], [bx + 8, by - 56], [bx + 5, by - 58], [bx - 5, by - 58]]), fill: '#f6d79c' }
  ]
}

/* ---------------- 收纳 / 书架 ---------------- */
function shelf (s) {
  const { x, y, w = 2, d = 0.5, h = 42 } = s
  const c = s.c || '#c9a183'
  const parts = [
    ...box(x, y, w, d, 0, h, { l: c, r: '#b8906f', t: '#dcbb9c' })
  ]
  // 层板 + 书脊
  const rows = s.rows || 3
  const cols = s.cols || ['#d4708c', '#e0a05c', '#7f9fc9', '#8fb98b', '#b189c4']
  for (let r = 0; r < rows; r++) {
    const z = 8 + r * ((h - 14) / rows)
    parts.push({
      d: poly([ip(x + 0.04, y + d, z), ip(x + w - 0.04, y + d, z), ip(x + w - 0.04, y + d, z + 1.6), ip(x + 0.04, y + d, z + 1.6)]),
      fill: 'rgba(120, 84, 64, .4)'
    })
    const n = Math.max(3, Math.round(w * 3.2))
    for (let i = 0; i < n; i++) {
      const a = 0.08 + (i * (w - 0.16)) / n
      parts.push({
        d: poly([ip(x + a, y + d, z + 2), ip(x + a + (w - 0.16) / n - 0.05, y + d, z + 2),
          ip(x + a + (w - 0.16) / n - 0.05, y + d, z + ((h - 18) / rows)), ip(x + a, y + d, z + ((h - 18) / rows))]),
        fill: cols[(i + r) % cols.length],
        opacity: 0.9
      })
    }
  }
  return parts
}

/* ---------------- 墙面 ---------------- */
function windowWall (s) {
  const { face, u0, u1, z0 = 22, z1 = 54 } = s
  const parts = [
    onWall(face, 0, 0, u0, u1, z0, z1, '#cfe8f2'),
    onWall(face, 0, 0, u0, u1, z0, z1, 'none', { stroke: '#f7f0ea', sw: 3 }),
    // 窗棂
    onWall(face, 0, 0, (u0 + u1) / 2 - 0.015, (u0 + u1) / 2 + 0.015, z0, z1, '#fdfaf6'),
    onWall(face, 0, 0, u0, u1, (z0 + z1) / 2 - 1, (z0 + z1) / 2 + 1, '#fdfaf6'),
    // 窗外透进来的光
    onWall(face, 0, 0, u0 + 0.05, u1 - 0.05, z0 + 3, z1 - 6, 'rgba(255, 255, 255, .5)')
  ]
  return parts
}

function poster (s) {
  const { face, u0, u1, z0, z1 } = s
  return [
    onWall(face, 0, 0, u0, u1, z0, z1, '#fff8f0'),
    onWall(face, 0, 0, u0, u1, z0, z1, 'none', { stroke: 'rgba(140, 106, 120, .35)', sw: 1.2 }),
    onWall(face, 0, 0, u0 + 0.08, u1 - 0.08, z0 + (z1 - z0) * 0.55, z0 + (z1 - z0) * 0.8, s.c || '#f2a8bd'),
    onWall(face, 0, 0, u0 + 0.08, u1 - 0.08, z0 + (z1 - z0) * 0.2, z0 + (z1 - z0) * 0.45, s.c2 || '#a8c6d9')
  ]
}

function blackboard (s) {
  const { u0 = 0.6, u1 = 2.4, z0 = 22, z1 = 52 } = s
  return [
    onWall('right', 0, 0, u0, u1, z0, z1, '#3a4b41'),
    onWall('right', 0, 0, u0, u1, z0, z1, 'none', { stroke: '#c9a183', sw: 4 }),
    // 粉笔字
    onWall('right', 0, 0, u0 + 0.16, u0 + 0.9, z1 - 10, z1 - 7, 'rgba(255, 250, 240, .75)'),
    onWall('right', 0, 0, u0 + 0.16, u0 + 1.4, z1 - 17, z1 - 14.5, 'rgba(255, 250, 240, .55)'),
    onWall('right', 0, 0, u0 + 0.16, u0 + 1.1, z1 - 24, z1 - 21.5, 'rgba(255, 250, 240, .45)'),
    // 粉笔槽
    onWall('right', 0, 0, u0 - 0.04, u1 + 0.04, z0 - 2.6, z0, '#dfc2a4')
  ]
}

/* ---------------- 商用 ---------------- */
function counter (s) {
  const { x, y, w = 1.8, d = 0.6 } = s
  return [
    ...box(x, y, w, d, 0, 22, { l: s.l || '#e3c9b2', r: s.r || '#cfae94', t: s.t || '#f6e3cd' }),
    // 台面
    { d: poly([ip(x - 0.04, y - 0.04, 22), ip(x + w + 0.04, y - 0.04, 22), ip(x + w + 0.04, y + d + 0.04, 22), ip(x - 0.04, y + d + 0.04, 22)]), fill: '#fffaf2' }
  ]
}

function register (s) {
  const { x, y } = s
  return [
    ...box(x, y, 0.42, 0.36, 0, 7, { l: '#dfe3e8', r: '#c7ccd3', t: '#f2f4f7' }),
    ...box(x + 0.06, y + 0.05, 0.3, 0.24, 7, 14, { l: '#f4f6f9', r: '#dfe3e8', t: '#ffffff' }),
    { d: poly([ip(x + 0.1, y + 0.24, 9), ip(x + 0.34, y + 0.24, 9), ip(x + 0.34, y + 0.24, 12.4), ip(x + 0.1, y + 0.24, 12.4)]), fill: '#8fd0c8' }
  ]
}

function fridge (s) {
  const { x, y, w = 1.2, d = 0.6 } = s
  return [
    ...box(x, y, w, d, 0, 40, { l: '#eef6f6', r: '#dcebea', t: '#f8fdfd' }),
    // 玻璃门里透出的冷光
    { d: poly([ip(x + 0.06, y + d, 6), ip(x + w - 0.06, y + d, 6), ip(x + w - 0.06, y + d, 34), ip(x + 0.06, y + d, 34)]), fill: 'rgba(198, 232, 236, .92)' },
    // 货架上的饮料
    ...[0, 1, 2].map((r) => ({
      d: poly([ip(x + 0.1, y + d, 10 + r * 8), ip(x + w - 0.1, y + d, 10 + r * 8), ip(x + w - 0.1, y + d, 10.8 + r * 8), ip(x + 0.1, y + d, 10.8 + r * 8)]),
      fill: 'rgba(150, 190, 195, .6)'
    })),
    ...[0, 1, 2, 3, 4].map((i) => ({
      d: poly([ip(x + 0.12 + i * 0.19, y + d, 11.4), ip(x + 0.12 + i * 0.19 + 0.12, y + d, 11.4), ip(x + 0.12 + i * 0.19 + 0.12, y + d, 16), ip(x + 0.12 + i * 0.19, y + d, 16)]),
      fill: ['#f2a8bd', '#a8c6d9', '#f6d79c', '#a8c99a', '#d9b8ea'][i]
    }))
  ]
}

/* ---------------- 学校 ---------------- */
function schoolDesk (s) {
  const { x, y } = s
  return [
    ...box(x, y, 0.8, 0.5, 0, 14, { l: '#e0bd97', r: '#c9a179', t: '#efd2ad' }),
    ...box(x + 0.06, y + 0.02, 0.68, 0.44, 14, 15.5, { l: '#f2dcc0', r: '#e6caa6', t: '#fae8cd' }),
    // 桌上的本子
    { d: poly([ip(x + 0.18, y + 0.12, 15.7), ip(x + 0.54, y + 0.12, 15.7), ip(x + 0.54, y + 0.34, 15.7), ip(x + 0.18, y + 0.34, 15.7)]), fill: '#fffdf8' },
    // 椅子
    ...box(x + 0.14, y + 0.62, 0.52, 0.42, 0, 9, { l: '#d8b48f', r: '#c39d78', t: '#e5c4a2' }),
    ...box(x + 0.14, y + 0.96, 0.52, 0.12, 9, 20, { l: '#c39d78', r: '#b08b6a', t: '#dcb997' })
  ]
}

function podium (s) {
  const { x, y } = s
  return [
    ...box(x, y, 0.9, 0.5, 0, 20, { l: '#d9b18e', r: '#bf9673', t: '#ecd0b0' }),
    // 桌上的木槌
    { d: poly([ip(x + 0.2, y + 0.18, 21), ip(x + 0.5, y + 0.18, 21), ip(x + 0.5, y + 0.3, 21), ip(x + 0.2, y + 0.3, 21)]), fill: '#a97e5e' }
  ]
}

function lockers (s) {
  const { x, y, w = 1.4, d = 0.5, h = 46 } = s
  const parts = [...box(x, y, w, d, 0, h, { l: '#cfd8d0', r: '#b9c4bb', t: '#e3eae3' })]
  const n = 3
  for (let i = 0; i < n; i++) {
    parts.push({
      d: poly([ip(x + 0.04 + i * (w / n), y + d, 4), ip(x + 0.04 + i * (w / n) + w / n - 0.08, y + d, 4),
        ip(x + 0.04 + i * (w / n) + w / n - 0.08, y + d, h - 4), ip(x + 0.04 + i * (w / n), y + d, h - 4)]),
      fill: i % 2 ? '#e8efea' : '#dde6e0'
    })
    parts.push({
      d: poly([ip(x + 0.04 + i * (w / n) + w / n / 2 - 0.04, y + d, h / 2 - 2), ip(x + 0.04 + i * (w / n) + w / n / 2 + 0.02, y + d, h / 2 - 2),
        ip(x + 0.04 + i * (w / n) + w / n / 2 + 0.02, y + d, h / 2 + 2), ip(x + 0.04 + i * (w / n) + w / n / 2 - 0.04, y + d, h / 2 + 2)]),
      fill: '#9aa8a0'
    })
  }
  return parts
}

function matRow (s) {
  const { x, y, w = 2.6, d = 2.4 } = s
  const parts = [slab(x, y, w, d, 1, s.c || '#dfe6d8')]
  // 分格
  for (let i = 1; i < 4; i++) {
    parts.push({ d: `M${P(ip(x, y + (d / 4) * i, 1.2))}L${P(ip(x + w, y + (d / 4) * i, 1.2))}`, fill: 'none', stroke: 'rgba(120, 140, 110, .5)', sw: 1 })
  }
  return parts
}

function dummy (s) {
  const { x, y } = s
  const [bx, by] = ip(x, y)
  return [
    { d: ep(bx, by, 12, 6), fill: 'rgba(120, 90, 70, .2)' },
    { d: poly([[bx - 5, by], [bx + 5, by], [bx + 4, by - 34], [bx - 4, by - 34]]), fill: '#b98a6b' },
    { d: ep(bx, by - 40, 9, 8), fill: '#c99a78' },
    { d: poly([[bx - 9, by - 26], [bx + 9, by - 26], [bx + 7, by - 14], [bx - 7, by - 14]]), fill: '#a97e5e' }
  ]
}

function gearRack (s) {
  const { x, y, w = 1.6 } = s
  const parts = [
    ...box(x, y, w, 0.4, 0, 42, { l: '#b08a6a', r: '#96725a', t: '#c9a181' })
  ]
  // 架上的木刀
  for (let i = 0; i < 3; i++) {
    parts.push({
      d: poly([ip(x + 0.16 + i * 0.42, y + 0.4, 12), ip(x + 0.24 + i * 0.42, y + 0.4, 12),
        ip(x + 0.24 + i * 0.42, y + 0.4, 38), ip(x + 0.16 + i * 0.42, y + 0.4, 38)]),
      fill: i === 1 ? '#e4c48e' : '#d9c3a4'
    })
  }
  return parts
}

/* ---------------- 健身 ---------------- */
function dumbbellRack (s) {
  const { x, y, w = 1.6 } = s
  const parts = [
    ...box(x, y, w, 0.5, 0, 10, { l: '#8f7a94', r: '#75617c', t: '#a892ac' }),
    ...box(x, y + 0.1, w, 0.3, 22, 26, { l: '#a892ac', r: '#8f7a94', t: '#c0adc6' })
  ]
  // 一排哑铃
  for (let i = 0; i < 4; i++) {
    const cx = x + 0.22 + i * 0.38
    parts.push({ d: poly([ip(cx, y + 0.22, 26), ip(cx + 0.2, y + 0.22, 26), ip(cx + 0.2, y + 0.22, 31), ip(cx, y + 0.22, 31)]), fill: '#5a4d60' })
    parts.push({ d: poly([ip(cx + 0.03, y + 0.22, 31), ip(cx + 0.17, y + 0.22, 31), ip(cx + 0.17, y + 0.22, 33), ip(cx + 0.03, y + 0.22, 33)]), fill: '#6f6076' })
  }
  return parts
}

function treadmill (s) {
  const { x, y, w = 1.1, d = 2.2 } = s
  const parts = [
    ...box(x, y, w, d, 0, 8, { l: '#8b93a1', r: '#767e8c', t: '#a3aab8' }),
    // 跑带
    { d: poly([ip(x + 0.08, y + 0.12, 8.2), ip(x + w - 0.08, y + 0.12, 8.2), ip(x + w - 0.08, y + d - 0.12, 8.2), ip(x + 0.08, y + d - 0.12, 8.2)]), fill: '#5c6470' },
    // 扶手
    ...box(x + 0.06, y + d - 0.2, 0.1, 0.1, 8, 30, { l: '#7b8391', r: '#646c78', t: '#929aa8' }),
    ...box(x + w - 0.16, y + d - 0.2, 0.1, 0.1, 8, 30, { l: '#7b8391', r: '#646c78', t: '#929aa8' }),
    ...box(x + 0.06, y + d - 0.24, w - 0.02, 0.08, 30, 32, { l: '#929aa8', r: '#7b8391', t: '#aab2c0' })
  ]
  return parts
}

function gymBench (s) {
  const { x, y, w = 1.5, d = 0.55 } = s
  return [
    ...box(x, y, w, d, 0, 16, { l: '#4f5560', r: '#3d434c', t: '#69707c' }),
    ...box(x, y + 0.06, w, d - 0.12, 16, 20, { l: '#c2557a', r: '#a84566', t: '#d9718f' })
  ]
}

function barbell (s) {
  const { x, y, w = 1.8 } = s
  const [bx, by] = ip(x, y)
  return [
    { d: ep(bx, by, 7, 3.4), fill: 'rgba(80, 70, 90, .22)' },
    // 杠
    { d: `M${P([bx - w * 24, by - 6])}L${P([bx + w * 24, by - 6])}`, fill: 'none', stroke: '#9aa2b0', sw: 3.4 },
    // 配重
    { d: poly([[bx - w * 20, by - 12], [bx - w * 20 + 8, by - 12], [bx - w * 20 + 8, by], [bx - w * 20, by]]), fill: '#3f3a48' },
    { d: poly([[bx + w * 20 - 8, by - 12], [bx + w * 20, by - 12], [bx + w * 20, by], [bx + w * 20 - 8, by]]), fill: '#3f3a48' }
  ]
}

function waterStation (s) {
  const { x, y } = s
  return [
    ...box(x, y, 0.6, 0.5, 0, 42, { l: '#dfe6ea', r: '#c9d2d8', t: '#f2f7fa' }),
    { d: poly([ip(x + 0.1, y + 0.5, 28), ip(x + 0.5, y + 0.5, 28), ip(x + 0.5, y + 0.5, 40), ip(x + 0.1, y + 0.5, 40)]), fill: 'rgba(150, 210, 230, .9)' },
    // 纸杯
    ...[0, 1].map((i) => ({ d: poly([ip(x + 0.68 + i * 0.14, y + 0.3, 24), ip(x + 0.78 + i * 0.14, y + 0.3, 24), ip(x + 0.76 + i * 0.14, y + 0.3, 29), ip(x + 0.7 + i * 0.14, y + 0.3, 29)]), fill: '#fffaf6' }))
  ]
}

/* ---------------- 车站 / 亭子 ---------------- */
function benchLong (s) {
  const { x, y, w = 2.2, d = 0.6 } = s
  return [
    ...box(x, y, w, d, 0, 14, { l: '#c9a183', r: '#b08a6a', t: '#dcb997' }),
    ...box(x, y, w, 0.14, 14, 26, { l: '#dcb997', r: '#c9a183', t: '#efd2ad' }),
    // 椅面缝
    ...[0.3, 0.9, 1.5].map((o) => ({ d: `M${P(ip(x + o, y + 0.08, 14.4))}L${P(ip(x + o, y + d, 14.4))}`, fill: 'none', stroke: 'rgba(140, 100, 70, .3)', sw: 1 }))
  ]
}

function ticketMachine (s) {
  const { x, y } = s
  const parts = [
    ...box(x, y, 0.9, 0.6, 0, 40, { l: '#dfe3ea', r: '#c9ced8', t: '#f4f6fa' }),
    // 屏幕
    { d: poly([ip(x + 0.08, y + 0.6, 24), ip(x + 0.82, y + 0.6, 24), ip(x + 0.82, y + 0.6, 36), ip(x + 0.08, y + 0.6, 36)]), fill: '#8fd0c8' },
    // 投币口 / 出票口
    { d: poly([ip(x + 0.16, y + 0.6, 14), ip(x + 0.42, y + 0.6, 14), ip(x + 0.42, y + 0.6, 17), ip(x + 0.16, y + 0.6, 17)]), fill: '#8f97a4' },
    { d: poly([ip(x + 0.56, y + 0.6, 12), ip(x + 0.82, y + 0.6, 12), ip(x + 0.82, y + 0.6, 16), ip(x + 0.56, y + 0.6, 16)]), fill: '#fffdf6' }
  ]
  return parts
}

function stoneTable (s) {
  const { x, y } = s
  const parts = [
    // 石桌
    { d: ep(...ip(x, y), 19, 9.6), fill: '#cdc4c0' },
    { d: ep(...ip(x, y, 4), 19, 9.6), fill: '#ded6d2' },
    { d: ep(...ip(x, y, 24), 17.6, 8.8), fill: '#d6cdc8' },
    { d: poly([ip(x - 0.1, y, 4), ip(x + 0.1, y, 4), ip(x + 0.1, y, 24), ip(x - 0.1, y, 24)]), fill: '#bdb3ae' }
  ]
  return parts
}

function stoneStool (s) {
  const { x, y } = s
  return [
    { d: ep(...ip(x, y), 11, 5.5), fill: '#c6bcb8' },
    { d: poly([ip(x - 0.08, y, 10), ip(x + 0.08, y, 10), ip(x + 0.08, y, 0), ip(x - 0.08, y, 0)]), fill: '#bdb3ae' },
    { d: ep(...ip(x, y, 10), 10, 5), fill: '#d8d0cb' }
  ]
}

function stoneLantern (s) {
  const { x, y } = s
  const [bx, by] = ip(x, y)
  return [
    { d: ep(bx, by, 10, 5), fill: '#b9b0ab' },
    { d: poly([[bx - 4, by], [bx + 4, by], [bx + 3, by - 26], [bx - 3, by - 26]]), fill: '#c9c0bb' },
    { d: poly([[bx - 11, by - 26], [bx + 11, by - 26], [bx + 9, by - 34], [bx - 9, by - 34]]), fill: '#d5ccc7' },
    { d: poly([[bx - 9, by - 34], [bx + 9, by - 34], [bx + 7, by - 40], [bx - 7, by - 40]]), fill: '#ffe9b8' },
    { d: poly([[bx - 12, by - 40], [bx + 12, by - 40], [bx, by - 50]]), fill: '#b9b0ab' }
  ]
}

function wishRack (s) {
  const { x, y, w = 1.6 } = s
  const parts = [
    ...box(x, y, 0.1, 0.1, 0, 40, { l: '#a98166', r: '#8f6a52', t: '#c09a7c' }),
    ...box(x + w, y, 0.1, 0.1, 0, 40, { l: '#a98166', r: '#8f6a52', t: '#c09a7c' }),
    ...box(x, y, w + 0.1, 0.1, 38, 41, { l: '#c09a7c', r: '#a98166', t: '#d9b591' })
  ]
  // 一排绘马
  for (let i = 0; i < 5; i++) {
    parts.push({
      d: poly([ip(x + 0.16 + i * 0.28, y + 0.05, 24), ip(x + 0.38 + i * 0.28, y + 0.05, 24),
        ip(x + 0.38 + i * 0.28, y + 0.05, 37), ip(x + 0.16 + i * 0.28, y + 0.05, 37)]),
      fill: '#f6e6c8'
    })
  }
  return parts
}

function fence (s) {
  const { x, y, w = 3, vertical = false } = s
  const parts = []
  const n = 8
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const px = vertical ? x : x + w * t
    const py = vertical ? y + w * t : y
    const [bx, by] = ip(px, py)
    parts.push({ d: `M${P([bx, by])}V${Math.round(by - 20)}`, fill: 'none', stroke: '#d9c3a4', sw: 3 })
  }
  const [ax, ay] = ip(x, y, 20)
  const [bx2, by2] = vertical ? ip(x, y + w, 20) : ip(x + w, y, 20)
  parts.push({ d: `M${P([ax, ay])}L${P([bx2, by2])}`, fill: 'none', stroke: '#c9ad8c', sw: 3 })
  return parts
}

function swing (s) {
  const { x, y } = s
  const [bx, by] = ip(x, y)
  return [
    { d: `M${P([bx - 34, by])}L${P([bx - 26, by - 48])}L${P([bx + 26, by - 48])}L${P([bx + 34, by])}`, fill: 'none', stroke: '#b08a6a', sw: 3.4 },
    { d: `M${P([bx - 26, by - 48])}L${P([bx + 26, by - 48])}`, fill: 'none', stroke: '#c9a183', sw: 4 },
    // 两根绳 + 坐板
    { d: `M${P([bx - 8, by - 46])}V${Math.round(by - 22)}M${P([bx + 8, by - 46])}V${Math.round(by - 22)}`, fill: 'none', stroke: '#c9b08c', sw: 1.6 },
    { d: poly([[bx - 12, by - 22], [bx + 12, by - 24], [bx + 12, by - 19], [bx - 12, by - 17]]), fill: '#dcb997' }
  ]
}

function flowerBed (s) {
  const { x, y, w = 2, d = 0.8 } = s
  const parts = [slab(x, y, w, d, 2, '#c9a183')]
  for (let i = 0; i < 6; i++) {
    const [bx, by] = ip(x + 0.2 + (i * (w - 0.4)) / 6, y + d / 2)
    parts.push({ d: ep(bx, by - 8, 5, 5), fill: ['#f2a8bd', '#f6d79c', '#d9b8ea', '#ffc2cf', '#a8c99a', '#fff0c8'][i] })
    parts.push({ d: `M${P([bx, by - 3])}v-4`, fill: 'none', stroke: '#8fae83', sw: 2 })
  }
  return parts
}

/* ---------------- 分发 ---------------- */

/* ============================================================
   第二批：补「功能辨识度」
   客厅的电视墙、卧室的飘窗、玄关的挂钩、后院的晾衣、
   健身房的沙袋、休息角的毛巾 —— 少一件，房间就说不清是干什么的
   ============================================================ */

/** 电视墙：矮柜 + 挂墙的电视（屏幕朝镜头） */
function tvWall (s) {
  const { x, y, w = 2.2 } = s
  const parts = []
  // 柜体
  parts.push(...box(x, y + 0.06, w, 0.46, 0, 12, { l: '#c9a183', r: '#ab866a', t: '#dcc0a2' }))
  // 柜门 + 把手
  for (let i = 0; i < 3; i++) {
    const gx = x + 0.08 + i * ((w - 0.16) / 3)
    parts.push({
      d: poly([ip(gx, y + 0.52, 2), ip(gx + (w - 0.16) / 3 - 0.06, y + 0.52, 2), ip(gx + (w - 0.16) / 3 - 0.06, y + 0.52, 9.6), ip(gx, y + 0.52, 9.6)]),
      fill: 'rgba(120, 90, 74, .22)'
    })
  }
  // 电视：薄盒 + 屏幕
  parts.push(...box(x + 0.14, y + 0.08, w - 0.28, 0.1, 18, 41, { l: '#3d3742', r: '#2c2731', t: '#4c4652' }))
  parts.push({
    d: poly([ip(x + 0.2, y + 0.18, 20.4), ip(x + w - 0.2, y + 0.18, 20.4), ip(x + w - 0.2, y + 0.18, 38.6), ip(x + 0.2, y + 0.18, 38.6)]),
    fill: '#7ea6bd'
  })
  parts.push({
    d: poly([ip(x + 0.28, y + 0.18, 32), ip(x + w * 0.55, y + 0.18, 32), ip(x + w * 0.4, y + 0.18, 24), ip(x + 0.2, y + 0.18, 24)]),
    fill: 'rgba(255, 255, 255, .34)'
  })
  // 底座
  parts.push(...box(x + w / 2 - 0.1, y + 0.1, 0.2, 0.08, 12, 18, { l: '#4c4652', r: '#3a3540', t: '#5a5460' }))
  return parts
}

/** 落地灯：细杆 + 布灯罩 + 一点暖光 */
function floorLamp (s) {
  const { x, y } = s
  const c = s.c || '#f6e0c2'
  const [bx, by] = ip(x + 0.15, y + 0.15, 0)
  return [
    { d: ep(bx, by, 5.6, 2.8), fill: 'rgba(120, 90, 100, .24)' },
    { d: `M${P([bx, by - 1])}V${r2(by - 42)}`, fill: 'none', stroke: '#b0949c', sw: 1.8 },
    { d: ep(bx, by - 42, 8.6, 3), fill: c },
    { d: poly([[bx - 8.6, by - 42], [bx + 8.6, by - 42], [bx + 5.4, by - 54], [bx - 5.4, by - 54]]), fill: c },
    { d: ep(bx, by - 54, 5.4, 2), fill: '#fff7e6' },
    { d: ep(bx, by - 50, 13, 6), fill: 'rgba(255, 226, 170, .3)' }
  ]
}

/** 台灯：桌上那盏小灯 */
function deskLamp (s) {
  const { x, y, z = 14 } = s
  const [bx, by] = ip(x + 0.12, y + 0.12, z)
  return [
    { d: ep(bx, by, 3.6, 1.8), fill: '#a98d92' },
    { d: `M${P([bx, by - 1])}V${r2(by - 13)}`, fill: 'none', stroke: '#a98d92', sw: 1.4 },
    { d: poly([[bx - 5, by - 13], [bx + 5, by - 13], [bx + 3.4, by - 20], [bx - 3.4, by - 20]]), fill: '#f8e2c0' },
    { d: ep(bx, by - 12.4, 5, 1.8), fill: '#fff3da' }
  ]
}

/** 飘窗：靠墙凸出的一块坐台 + 上面的垫子与抱枕 */
function bayWindow (s) {
  const { x, y, w = 1.7, d = 0.72 } = s
  const parts = []
  // 台体
  parts.push(...box(x, y, w, d, 0, 14, { l: '#efd9c4', r: '#dcc2ab', t: '#f8e9d6' }))
  // 台面软垫
  parts.push(...box(x + 0.04, y + 0.04, w - 0.08, d - 0.08, 14, 18, { l: '#f0c6d4', r: '#e2b0c2', t: '#fbdbe4' }))
  // 两个抱枕
  parts.push(...box(x + 0.12, y + 0.1, 0.34, 0.22, 18, 25, { l: '#fff4f7', r: '#f6e2e8', t: '#fffafb' }))
  parts.push(...box(x + w - 0.5, y + 0.14, 0.3, 0.2, 18, 24, { l: '#cfe0ef', r: '#bcd2e4', t: '#e4eff8' }))
  // 窗（贴在墙上，画在台子上方）
  parts.push({
    d: poly([ip(x + 0.05, y + 0.02, 26), ip(x + w - 0.05, y + 0.02, 26), ip(x + w - 0.05, y + 0.02, 52), ip(x + 0.05, y + 0.02, 52)]),
    fill: '#cfe8f2'
  })
  parts.push({
    d: poly([ip(x + 0.05, y + 0.02, 26), ip(x + w - 0.05, y + 0.02, 26), ip(x + w - 0.05, y + 0.02, 52), ip(x + 0.05, y + 0.02, 52)]),
    fill: 'none', stroke: '#fdf8f2', sw: 2.6
  })
  // 窗中梃
  parts.push({
    d: poly([ip(x + w / 2 - 0.02, y + 0.02, 26), ip(x + w / 2 + 0.02, y + 0.02, 26), ip(x + w / 2 + 0.02, y + 0.02, 52), ip(x + w / 2 - 0.02, y + 0.02, 52)]),
    fill: '#fdf8f2'
  })
  return parts
}

/** 玄关挂钩板：一块横板 + 几枚钩子，挂着包和围巾 */
function coatHooks (s) {
  const { x, y, w = 1.1, z = 26 } = s
  const parts = []
  parts.push({
    d: poly([ip(x, y + 0.02, z), ip(x + w, y + 0.02, z), ip(x + w, y + 0.02, z + 5), ip(x, y + 0.02, z + 5)]),
    fill: '#e3c2a8'
  })
  for (let i = 0; i < 3; i++) {
    const hx = x + 0.16 + i * ((w - 0.32) / 2)
    const [px, py] = ip(hx, y + 0.05, z + 2)
    parts.push({ d: `M${P([px, py])}v3`, fill: 'none', stroke: '#a98d83', sw: 1.6 })
  }
  // 挂着的包
  const [bx, by] = ip(x + 0.2, y + 0.06, z)
  parts.push({ d: poly([[bx - 4, by + 2], [bx + 4, by + 2], [bx + 5, by + 12], [bx - 3, by + 12]]), fill: '#c98fa4' })
  // 围巾
  const [sx, sy] = ip(x + w - 0.28, y + 0.06, z)
  parts.push({ d: poly([[sx - 3, sy + 2], [sx + 3, sy + 2], [sx + 2, sy + 14], [sx - 2, sy + 14]]), fill: '#cfe0ef' })
  return parts
}

/** 晾衣架：两根立杆 + 一道绳 + 三件小衣服 */
function laundry (s) {
  const { x, y, w = 1.7 } = s
  const parts = []
  const [ax, ay] = ip(x, y, 0)
  const [bx, by] = ip(x + w, y, 0)
  parts.push({ d: `M${P([ax, ay])}V${r2(ay - 34)}M${P([bx, by])}V${r2(by - 34)}`, fill: 'none', stroke: '#b09a8c', sw: 2 })
  parts.push({ d: `M${P([ax, ay - 34])}L${P([bx, by - 34])}`, fill: 'none', stroke: '#c9b2a4', sw: 1.2 })
  const cloths = ['#f6c9d5', '#d8e4f0', '#fff3d8']
  for (let i = 0; i < 3; i++) {
    const t = 0.2 + i * 0.28
    const cx = ax + (bx - ax) * t
    const cy = ay - 34 + (by - ay) * t
    parts.push({ d: poly([[cx - 5, cy], [cx + 7, cy], [cx + 6, cy + 12], [cx - 4, cy + 12]]), fill: cloths[i] })
  }
  return parts
}

/** 沙袋：吊在横梁上的一只圆柱袋 */
function punchingBag (s) {
  const { x, y } = s
  const [bx, by] = ip(x + 0.2, y + 0.2, 0)
  return [
    { d: ep(bx, by, 12, 5), fill: 'rgba(96, 74, 92, .16)' },
    { d: `M${P([bx, by - 44])}V${r2(by - 54)}`, fill: 'none', stroke: '#8a7a8c', sw: 2.4 },
    { d: poly([[bx - 9, by - 44], [bx + 9, by - 44], [bx + 9, by - 6], [bx - 9, by - 6]]), fill: '#8a5c6e' },
    { d: poly([[bx - 9, by - 44], [bx - 2, by - 44], [bx - 2, by - 6], [bx - 9, by - 6]]), fill: '#a06d80' },
    { d: ep(bx, by - 44, 9, 3.2), fill: '#6f4a5a' },
    { d: ep(bx, by - 6, 9, 3.2), fill: '#6f4a5a' },
    { d: poly([[bx - 9, by - 38], [bx + 9, by - 38], [bx + 9, by - 36], [bx - 9, by - 36]]), fill: '#f2e6ea' }
  ]
}

/** 毛巾架：一根横杆 + 两条搭着的毛巾 */
function towelRack (s) {
  const { x, y, w = 1.1 } = s
  const [ax, ay] = ip(x, y, 0)
  const [bx, by] = ip(x + w, y, 0)
  return [
    { d: `M${P([ax, ay])}V${r2(ay - 28)}M${P([bx, by])}V${r2(by - 28)}`, fill: 'none', stroke: '#a9929a', sw: 2 },
    { d: `M${P([ax, ay - 26])}L${P([bx, by - 26])}`, fill: 'none', stroke: '#bda8ae', sw: 2.2 },
    { d: poly([[ax + 4, ay - 26], [ax + 16, ay - 26], [ax + 15, ay - 12], [ax + 5, ay - 12]]), fill: '#f4d3dd' },
    { d: poly([[bx - 18, by - 26], [bx - 6, by - 26], [bx - 7, by - 13], [bx - 17, by - 13]]), fill: '#cfe0ef' }
  ]
}

/** 小圆凳 / 懒人坐垫（书店阅读角用） */
function floorCushion (s) {
  const { x, y } = s
  const c = s.c || '#e9c2d0'
  const [bx, by] = ip(x + 0.24, y + 0.24, 0)
  return [
    { d: ep(bx, by, 13, 6.4), fill: 'rgba(96, 74, 92, .12)' },
    { d: poly([[bx - 12, by - 2], [bx + 12, by - 2], [bx + 11, by - 10], [bx - 11, by - 10]]), fill: c },
    { d: ep(bx, by - 10, 12, 5.6), fill: '#f6dae4' },
    { d: ep(bx, by - 2, 12, 5.6), fill: c }
  ]
}

function r2 (n) { return Math.round(n * 10) / 10 }

const DRAW = {
  sofa, table, rug, chair, plant, cushion, bed, desk, lamp, shelf,
  windowWall, poster, blackboard, counter, register, fridge,
  schoolDesk, podium, lockers, matRow, dummy, gearRack,
  dumbbellRack, treadmill, gymBench, barbell, waterStation,
  benchLong, ticketMachine, stoneTable, stoneStool, stoneLantern,
  wishRack, fence, swing, flowerBed,
  tvWall, floorLamp, deskLamp, bayWindow, coatHooks, laundry, punchingBag, towelRack, floorCushion
}

export function drawProp (p) {
  const fn = DRAW[p.type]
  if (!fn) return []
  return fn(p)
}
