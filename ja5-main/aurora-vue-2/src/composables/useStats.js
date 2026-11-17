// ============================================================
//  樱花小镇 · 角色属性（模块级单例）
// ------------------------------------------------------------
//  七项属性：体力 / 力量 / 智力 / 敏捷 / 神秘 / 魅力 / 幸运
//
//  为什么放在前端本地：
//    · 属性是「你在这个小镇里活成了什么样」的记账，不影响交易与体力上限，
//      所以暂时不需要后端接口，localStorage 一份就够
//    · 以后要上服务端，只要把 load/save 换成接口读写，gain() 的调用点一行都不用改
//
//  注意：这里的「体力」是角色耐力（VIGOR），跟钱包那条会随时间恢复的
//  「体力值」不是一回事 —— 面板里要写清楚，否则一定会有人问。
// ============================================================

import { reactive, computed, ref } from 'vue'

const STORE_KEY = 'sakura_stats_v1'
const MAX = 99

/** 七项属性的展示信息（顺序即面板顺序） */
export const STATS = [
  { key: 'vigor', label: '体力', en: 'VIGOR', color: '#ee8aa0', icon: 'bolt', desc: '耐力与恢复，睡觉、训练都会长' },
  { key: 'strength', label: '力量', en: 'STRENGTH', color: '#e8845f', icon: 'dumbbell', desc: '健身房撸铁，一次 +2' },
  { key: 'wits', label: '智力', en: 'WITS', color: '#7f9fc9', icon: 'book', desc: '上课、读书、买书' },
  { key: 'agility', label: '敏捷', en: 'AGILITY', color: '#6fae9d', icon: 'wind', desc: '打工、赶车、玩小游戏' },
  { key: 'mystic', label: '神秘', en: 'MYSTIC', color: '#9a86b6', icon: 'moon', desc: '许愿、花语、夜里的樱花' },
  { key: 'charm', label: '魅力', en: 'CHARM', color: '#e39ab0', icon: 'heart', desc: '咖啡、甜品、和人说话' },
  { key: 'luck', label: '幸运', en: 'LUCK', color: '#e8bf6a', icon: 'clover', desc: '偶然的好运，谁也说不清' }
]

const BASE = { vigor: 10, strength: 10, wits: 10, agility: 10, mystic: 6, charm: 10, luck: 6 }

/** 属性值（响应式） */
export const stats = reactive({ ...BASE })

/** 每项属性的累计获得次数，用来算「今日成长」和称号进度 */
export const grown = reactive({ ...BASE })

/** 弹出来的小提示：「智力 +2」 */
export const toasts = reactive([])

let toastId = 0

function load () {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    STATS.forEach((s) => {
      if (typeof data[s.key] === 'number') stats[s.key] = clamp(data[s.key])
      if (data.grown && typeof data.grown[s.key] === 'number') grown[s.key] = data.grown[s.key]
    })
  } catch (e) {
    /* 本地存档坏了就当新号，不要因为一行 JSON 把整站搞白屏 */
  }
}

function save () {
  try {
    const plain = {}
    STATS.forEach((s) => { plain[s.key] = stats[s.key] })
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...plain, grown: { ...grown } }))
  } catch (e) {
    /* 隐私模式写不进去就算了 */
  }
}

function clamp (n) {
  return Math.max(0, Math.min(MAX, Math.round(n)))
}

load()

/**
 * 加属性。
 * @param {string} key  STATS 里的 key
 * @param {number} n    加多少（默认 1）
 * @param {boolean} quiet 不弹提示（批量补正时用）
 */
export function gain (key, n = 1, quiet = false) {
  const def = STATS.find((s) => s.key === key)
  if (!def) return
  const before = stats[key]
  stats[key] = clamp(before + n)
  const real = stats[key] - before
  grown[key] += Math.max(0, real)
  save()
  if (real > 0 && !quiet) pushToast(def, real)
}

/** 一次加多项：gainMany({ wits: 2, vigor: 1 }) */
export function gainMany (map) {
  Object.entries(map || {}).forEach(([k, v]) => gain(k, v))
}

function pushToast (def, n) {
  // 同一属性连点不加两条：把已有的那条加上去（「魅力 +2」点三次要显示 +6）
  const hit = toasts.find((t) => t.key === def.key)
  if (hit) {
    hit.n += n
    clearTimeout(hit.timer)
    hit.timer = setTimeout(() => dropToast(hit.id), 2400)
    return
  }
  const id = ++toastId
  const item = { id, key: def.key, label: def.label, color: def.color, n, timer: null }
  item.timer = setTimeout(() => dropToast(id), 2400)
  toasts.push(item)
  // 同屏最多三条，避免连点时糊成一片
  while (toasts.length > 3) dropToast(toasts[0].id)
}

function dropToast (id) {
  const i = toasts.findIndex((t) => t.id === id)
  if (i >= 0) {
    clearTimeout(toasts[i].timer)
    toasts.splice(i, 1)
  }
}

/** 每项属性的等级：每 10 点一级，0 级起步 */
export function levelOf (key) {
  return Math.floor((stats[key] || 0) / 10)
}

/** 当前最高的一项（称号用） */
export const topStat = computed(() => {
  let best = STATS[0]
  STATS.forEach((s) => { if (stats[s.key] > stats[best.key]) best = s })
  return best
})

const TITLES = {
  vigor: '不累的人',
  strength: '搬得动书柜的人',
  wits: '镇上的书本虫',
  agility: '跑得比班车快',
  mystic: '守樱人',
  charm: '店门口的招牌',
  luck: '猫愿意跟着走'
}

/** 称号：跟着最高的那一项走 */
export const title = computed(() => TITLES[topStat.value.key] || '小镇住民')

/** 七项总和，用来显示「总成长」 */
export const total = computed(() => STATS.reduce((sum, s) => sum + stats[s.key], 0))

/** 最高的一项能到多少级（面板里的进度条用） */
export const MAX_VALUE = MAX

/* ============================================================
   心情（MOOD）：和七项属性不同，它是会实时变化的状态
   —— 打工掉、睡觉涨，放着不管会慢慢往 60 靠
   ============================================================ */
const MOOD_KEY = 'sakura_mood_v1'
const MOOD_BASE = 60

export const mood = ref(72)

export const MOOD_LEVELS = [
  { min: 85, label: '雀跃', color: '#f2789a' },
  { min: 70, label: '惬意', color: '#ee94ad' },
  { min: 52, label: '平静', color: '#7f9fc9' },
  { min: 34, label: '有点闷', color: '#9a86b6' },
  { min: 0, label: '低落', color: '#8d8397' }
]

export const moodMeta = computed(() => MOOD_LEVELS.find((l) => mood.value >= l.min) || MOOD_LEVELS[MOOD_LEVELS.length - 1])

const clampMood = (n) => Math.max(0, Math.min(100, Math.round(n)))

function loadMood () {
  try {
    const raw = localStorage.getItem(MOOD_KEY)
    if (raw != null) {
      const v = Number(raw)
      if (Number.isFinite(v)) mood.value = clampMood(v)
    }
  } catch (e) { /* 读不到就用默认值 */ }
}

function saveMood () {
  try {
    localStorage.setItem(MOOD_KEY, String(mood.value))
  } catch (e) { /* 隐私模式下静默 */ }
}

loadMood()

/**
 * 心情变化。
 * @param {number} n 可正可负
 * @param {string} why 想显示在提示里的来源（暂时不用，留着以后做日志）
 */
export function nudgeMood (n) {
  if (!n) return
  const before = mood.value
  mood.value = clampMood(before + n)
  const real = mood.value - before
  saveMood()
  if (real !== 0) pushToast({ key: 'mood', label: '心情', color: moodMeta.value.color }, real)
}

let moodTimer = null

/** 启动心情的慢速回落（幂等）：每 90 秒往 60 靠一格 */
export function startVitals () {
  if (moodTimer) return
  moodTimer = setInterval(() => {
    if (mood.value > MOOD_BASE) { mood.value -= 1; saveMood() }
    else if (mood.value < MOOD_BASE) { mood.value += 1; saveMood() }
  }, 90000)
}

/* ============================================================
   面板形态：日常 / 探索战斗
   —— 小镇过日子不需要看闪避和暴击，所以日常只留四项；
      要出门探索时切到战斗态，七项全开，外加一层战斗换算
   ============================================================ */
export const PANEL_MODES = [
  { key: 'daily', label: '日常', en: 'DAILY' },
  { key: 'battle', label: '探索战斗', en: 'ADVENTURE' }
]

/** 日常模式下露出的四项：过日子用得上的那几个 */
export const DAILY_KEYS = ['vigor', 'strength', 'wits', 'charm']

const MODE_KEY = 'sakura_panel_mode'

export const panelMode = ref('daily')

function loadMode () {
  try {
    const v = localStorage.getItem(MODE_KEY)
    if (v === 'daily' || v === 'battle') panelMode.value = v
  } catch (e) { /* 读不到就按日常 */ }
}

loadMode()

export function setPanelMode (key) {
  if (key !== 'daily' && key !== 'battle') return
  panelMode.value = key
  try { localStorage.setItem(MODE_KEY, key) } catch (e) { /* 静默 */ }
}

/** 当前形态下要显示的属性行 */
export const visibleStats = computed(() =>
  panelMode.value === 'battle' ? STATS : STATS.filter((s) => DAILY_KEYS.includes(s.key))
)

/** 被收起来的属性（日常模式下给一句提示用） */
export const hiddenStats = computed(() =>
  STATS.filter((s) => !visibleStats.value.some((v) => v.key === s.key))
)

/** 战力：七项加权，战斗态才显示 */
export const power = computed(() => {
  const s = stats
  return Math.round(
    s.vigor * 1.2 + s.strength * 1.5 + s.wits * 1.1 +
    s.agility * 1.3 + s.mystic * 1.4 + s.charm * 1.0 + s.luck * 1.2
  )
})

/** 战斗换算：每个数字都能追到某一项属性，不凭空编 */
export const combat = computed(() => {
  const s = stats
  return [
    { key: 'hp', label: '生命', en: 'HP', value: 40 + s.vigor * 4, unit: '', hint: '体力', color: '#e0576f' },
    { key: 'atk', label: '攻击', en: 'ATK', value: Math.round(s.strength * 1.6 + s.vigor * 0.4), unit: '', hint: '力量', color: '#e8845f' },
    { key: 'def', label: '防御', en: 'DEF', value: Math.round(s.vigor * 1.1 + s.strength * 0.5), unit: '', hint: '体力 + 力量', color: '#7f9fc9' },
    { key: 'eva', label: '闪避', en: 'EVA', value: Math.round(s.agility * 1.2), unit: '%', hint: '敏捷', color: '#6fae9d' },
    { key: 'crit', label: '暴击', en: 'CRIT', value: Math.round(4 + s.luck * 0.6), unit: '%', hint: '幸运', color: '#e8bf6a' },
    { key: 'sight', label: '灵视', en: 'SIGHT', value: Math.round(s.mystic * 1.5), unit: '', hint: '神秘', color: '#9a86b6' },
    { key: 'rally', label: '鼓舞', en: 'RALLY', value: Math.round(s.charm * 1.3), unit: '', hint: '魅力', color: '#e39ab0' }
  ]
})

export function useStats () {
  return {
    stats,
    grown,
    toasts,
    gain,
    gainMany,
    levelOf,
    topStat,
    title,
    total,
    STATS,
    MAX_VALUE,
    mood,
    moodMeta,
    nudgeMood,
    startVitals,
    // 面板形态
    PANEL_MODES,
    panelMode,
    setPanelMode,
    visibleStats,
    hiddenStats,
    power,
    combat
  }
}
