// ============================================================
//  樱花小镇 · 钱包状态（模块级单例）
// ------------------------------------------------------------
//  为什么做成单例而不是每个页面各拉一次：
//    · 金币 / 体力出现在每一个小镇页面（书店、便利店、健身房、家），
//      还出现在顶部 HUD —— 分散管理一定会出现「买完书 HUD 还是旧金额」
//    · 服务端每个写接口都会回最新状态，sync() 一合并，全站同时刷新
//
//  体力是「读的时候算」的：服务端按时间戳补恢复，这里只做乐观倒计时，
//  倒计时归零时本地 +1，真正对账交给下一次 refresh()。
// ============================================================

import { reactive, computed } from 'vue'
import {
  fetchState, fetchOwned, workShift, gymTrain, gymDrink,
  sleepAtHome, buyBook, claimGameReward,
  benchRest, fetchDrinks, buyDrink
} from '../api/economy'
import { getToken } from '../api/http'

/** 与后端字段一一对应；页面只读，写一律走下面的 action */
export const wallet = reactive({
  money: 0,
  energy: 0,
  energyMax: 100,
  regenSeconds: 90,
  nextRegenIn: 0,
  workEnergyCost: 12,
  workReadyIn: 0,
  trainCost: 30,
  trainBonus: 5,
  drinkCost: 8,
  drinkRestore: 30,
  energyMaxCap: 160,
  sleptToday: false,
  ownedCount: 0,
  gameEarnedToday: 0,
  gameDailyCap: 240,
  benchRestore: 15,
  benchReadyIn: 0,
  ready: false,
  loading: false
})

/** 已购书目 id（Set 查询更快，模板里用 hasOwned(id)） */
const owned = reactive(new Set())

const NUMERIC_KEYS = [
  'money', 'energy', 'energyMax', 'regenSeconds', 'nextRegenIn',
  'workEnergyCost', 'workReadyIn', 'trainCost', 'trainBonus',
  'drinkCost', 'drinkRestore', 'energyMaxCap', 'ownedCount',
  'gameEarnedToday', 'gameDailyCap', 'benchRestore', 'benchReadyIn'
]

/** 把接口返回的对象合并进单例（只认白名单字段，避免脏键污染） */
export function sync (data) {
  if (!data || typeof data !== 'object') return
  NUMERIC_KEYS.forEach((k) => {
    if (typeof data[k] === 'number') wallet[k] = data[k]
  })
  if (typeof data.sleptToday === 'boolean') wallet.sleptToday = data.sleptToday
  wallet.ready = true
}

/** 拉一次最新状态（未登录直接跳过，不打扰游客） */
export async function refresh () {
  if (!getToken()) return null
  wallet.loading = true
  try {
    const data = await fetchState()
    sync(data)
    return data
  } finally {
    wallet.loading = false
  }
}

/** 拉已购书目（书店 / 家里的书架用） */
export async function refreshOwned () {
  if (!getToken()) return []
  const ids = await fetchOwned()
  owned.clear()
  ids.forEach((id) => owned.add(Number(id)))
  return ids
}

export function hasOwned (id) {
  return owned.has(Number(id))
}

/* ---------------- 本地倒计时 ---------------- */
let ticker = null

/**
 * 启动本地倒计时（幂等，全局只需要一个）。
 * 每秒推进一次：体力恢复倒计时归零就本地 +1，打工冷却归零就解锁按钮。
 */
export function startTicker () {
  if (ticker) return
  ticker = setInterval(() => {
    if (wallet.nextRegenIn > 0) {
      wallet.nextRegenIn -= 1
      if (wallet.nextRegenIn === 0) {
        // 乐观 +1；服务端按锚点算，误差最多一两秒
        if (wallet.energy < wallet.energyMax) wallet.energy += 1
        if (wallet.energy < wallet.energyMax) wallet.nextRegenIn = wallet.regenSeconds
      }
    }
    if (wallet.workReadyIn > 0) wallet.workReadyIn -= 1
    if (wallet.benchReadyIn > 0) wallet.benchReadyIn -= 1
  }, 1000)
}

/* ---------------- 行为（每个都会回最新状态） ---------------- */

export async function work (score) {
  const res = await workShift(score)
  sync(res)
  return res
}

export async function train () {
  const res = await gymTrain()
  sync(res)
  return res
}

export async function protein () {
  const res = await gymDrink()
  sync(res)
  return res
}

export async function sleep () {
  const res = await sleepAtHome()
  sync(res)
  return res
}

export async function buy (articleId) {
  const res = await buyBook(articleId)
  sync(res)
  owned.add(Number(articleId))
  if (typeof res.ownedCount === 'number') wallet.ownedCount = res.ownedCount
  return res
}

/** 公园长椅歇脚 */
export async function bench () {
  const res = await benchRest()
  sync(res)
  return res
}

/** 贩卖机货道 */
export function drinks () {
  return fetchDrinks()
}

/** 投币买饮料 */
export async function drink (key) {
  const res = await buyDrink(key)
  sync(res)
  return res
}

export async function gameReward (game, score) {
  const res = await claimGameReward(game, score)
  sync(res)
  return res
}

/* ---------------- 派生展示值 ---------------- */
export const energyPercent = computed(() => {
  const max = wallet.energyMax || 1
  return Math.max(0, Math.min(100, Math.round((wallet.energy / max) * 100)))
})

export const canWork = computed(() => wallet.energy >= wallet.workEnergyCost && wallet.workReadyIn <= 0)

/** 组合式入口：页面里 const eco = useEconomy() 即可拿到全部读写能力 */
export function useEconomy () {
  return {
    wallet,
    owned,
    hasOwned,
    refresh,
    refreshOwned,
    sync,
    work,
    train,
    protein,
    sleep,
    bench,
    drinks,
    drink,
    buy,
    gameReward,
    startTicker,
    energyPercent,
    canWork
  }
}
