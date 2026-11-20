// ============================================================
//  樱花小镇 · 地点 ↔ 属性
// ------------------------------------------------------------
//  七项属性各自要有一个「能稳定刷」的地方，否则面板里的数字
//  就只是摆设。这张表就是唯一口径：UI（属性面板的「成长来源」）
//  和实际发属性的地方都从这里读，改一处不会两边打架。
//
//  已经挂在服务端行为上的（打工 / 训练 / 买书 / 睡觉 / 长椅 / 取票）
//  在 useEconomy.js 里 gain；没服务端行为的（后山 / 钟楼）走 gainOnce，
//  带一个冷却，防止站着连点把属性刷满。
// ============================================================

import { gainMany } from './useStats'

/** 地点表：label 显示名，act 触发动作，gains 给什么 */
export const PLACES = [
  { key: 'home', label: '书店', act: '买书', gains: [{ key: 'wits', n: 1 }] },
  { key: 'school', label: '学校', act: '上课 / 读书角', gains: [{ key: 'wits', n: 2 }, { key: 'vigor', n: 1 }] },
  { key: 'store', label: '便利店', act: '打一班工', gains: [{ key: 'agility', n: 1 }, { key: 'vigor', n: 1 }] },
  { key: 'gym', label: '健身房', act: '训练', gains: [{ key: 'strength', n: 2 }, { key: 'vigor', n: 1 }] },
  { key: 'gamehome', label: '家', act: '睡觉 / 小游戏', gains: [{ key: 'vigor', n: 3 }] },
  { key: 'cafe', label: '咖啡馆', act: '点单 / 闲聊', gains: [{ key: 'charm', n: 2 }] },
  { key: 'sweet', label: '甜品屋', act: '点单', gains: [{ key: 'charm', n: 2 }] },
  { key: 'flower', label: '花店', act: '买花', gains: [{ key: 'mystic', n: 1 }, { key: 'charm', n: 1 }] },
  { key: 'park', label: '公园', act: '长椅歇脚', gains: [{ key: 'charm', n: 1 }, { key: 'luck', n: 1 }] },
  { key: 'station', label: '车站', act: '取一张车票', gains: [{ key: 'agility', n: 1 }, { key: 'luck', n: 1 }] },
  { key: 'backhill', label: '后山', act: '走到千年樱', gains: [{ key: 'vigor', n: 1 }, { key: 'mystic', n: 1 }] },
  { key: 'clock', label: '钟楼', act: '敲一次钟', gains: [{ key: 'mystic', n: 1 }, { key: 'luck', n: 1 }] },
  { key: 'realm', label: '樱之异境', act: '宝箱 / 事件', gains: [{ key: 'mystic', n: 2 }] }
]

/** 每个地点「主属性」——面板里一格只显示一项，免得挤 */
export const PLACE_PRIMARY = {
  home: 'wits',
  school: 'wits',
  store: 'agility',
  gym: 'strength',
  gamehome: 'vigor',
  cafe: 'charm',
  sweet: 'charm',
  flower: 'mystic',
  park: 'luck',
  station: 'agility',
  backhill: 'mystic',
  clock: 'luck',
  realm: 'mystic'
}

/* ---------------- 带冷却的发放 ---------------- */
const STAMP_KEY = 'sakura_place_gain_v1'

function stamps () {
  try {
    return JSON.parse(localStorage.getItem(STAMP_KEY) || '{}') || {}
  } catch (e) {
    return {}
  }
}

function stampOf (key) {
  const v = stamps()[key]
  return typeof v === 'number' ? v : 0
}

function writeStamp (key, t) {
  try {
    const all = stamps()
    all[key] = t
    localStorage.setItem(STAMP_KEY, JSON.stringify(all))
  } catch (e) { /* 隐私模式写不进去就算了，下一轮再给 */ }
}

/** 这个地点还要等多久（毫秒），0 表示现在就能拿 */
export function cooldownLeft (key, gapMs) {
  const left = gapMs - (Date.now() - stampOf(key))
  return left > 0 ? left : 0
}

/**
 * 同一地点按冷却发属性。
 * @returns {boolean} 这次到底发没发（可以拿来做提示）
 */
export function gainOnce (key, gapMs, map) {
  if (cooldownLeft(key, gapMs) > 0) return false
  writeStamp(key, Date.now())
  gainMany(map)
  return true
}
